import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured, SITE_DOC_PATH } from "../lib/firebase";
import {
  atletas as atletas0,
  documentos as documentos0,
  eventos as eventos0,
  noticias as noticias0,
  notificacoesIniciais as notifs0,
  parceiros as parceiros0,
  projeto as projeto0,
} from "../data/mock";

export interface Atleta { id: string; nome: string; posicao: string; nasc: string; numero: number }
export interface Evento { id: string; dia: string; mes: string; hora: string; titulo: string; detalhe: string; tipo: "JOGO" | "TREINO" }
export interface JogoResultado { id: string; casa: string; fora: string; golsCasa: number; golsFora: number; data: string; local: string; gols?: { minuto: string; autor: string }[] }
export interface ProximoJogo { casa: string; fora: string; data: string; hora: string; local: string; competicao: string; rodada: string; casaEscudo: string; foraEscudo: string }
export interface Noticia { id: string; titulo: string; data: string; categoria: string; imagem: string; destaque?: boolean; createdAt?: number }
export interface Parceiro { id: string; nome: string; tipo: string; detalhe: string; cor: string; nivel: "OURO" | "PRATA" | "BRONZE" }
export interface GaleriaItem { id: string; url: string; tipo: "FOTO" | "VIDEO"; createdAt?: number }
export interface Projeto { titulo: string; subtitulo: string; valorTotal: string; captado: string; aCaptar: string; percentual: string; confirmados: { nome: string; detalhe: string; valor: string }[] }
export interface Documento { id: string; nome: string; atualizado: string; tamanho: string }
export interface Notificacao { id: string; titulo: string; data: string; lida: boolean }
export interface Escudo { nome: string; sigla: string; primaria: string; secundaria: string; imagemUrl: string }

const uid = () => Math.random().toString(36).slice(2, 9);

export interface SiteState {
  escudo: Escudo;
  heroImagem: string;
  atletas: Atleta[];
  eventos: Evento[];
  proximoJogo: ProximoJogo;
  ultimoJogo: JogoResultado;
  noticias: Noticia[];
  parceiros: Parceiro[];
  galeria: GaleriaItem[];
  projeto: Projeto;
  documentos: Documento[];
  notificacoes: Notificacao[];
  pin: string;
}

const DEFAULTS: SiteState = {
  escudo: { nome: "SPARTAX", sigla: "SPX", primaria: "#C8102E", secundaria: "#7A0C1E", imagemUrl: "" },
  heroImagem: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=900&auto=format&fit=crop",
  atletas: atletas0.map((a) => ({ ...a, id: uid() })),
  eventos: eventos0.map((e) => ({ ...e, id: uid() })),
  proximoJogo: { casa: "SPARTAX", fora: "A.E. CLUBE", data: "25 de maio de 2026", hora: "15:30", local: "Estádio Municipal — Waiporã, PR", competicao: "CAMPEONATO REGIONAL", rodada: "RODADA 8", casaEscudo: "", foraEscudo: "" },
  ultimoJogo: { id: "j1", casa: "SPX", fora: "GRE", golsCasa: 3, golsFora: 1, data: "18 MAI", local: "Estádio Municipal", gols: [{ minuto: "9'", autor: "Kauan" }, { minuto: "54'", autor: "Miguel" }, { minuto: "78'", autor: "Gabriel" }] },
  noticias: noticias0.map((n, i) => ({ ...n, id: uid(), imagem: ["https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=400&auto=format&fit=crop","https://images.unsplash.com/photo-1553778263-73a83bab9b0c?q=80&w=400&auto=format&fit=crop","https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=400&auto=format&fit=crop","https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=400&auto=format&fit=crop"][i % 4], destaque: i === 0 })),
  parceiros: parceiros0.map((p, i) => ({ id: uid(), nome: p.nome, tipo: p.tipo, detalhe: p.detalhe, cor: ["bg-orange-500","bg-green-600","bg-emerald-500","bg-red-600"][i % 4], nivel: (i === 0 ? "OURO" : i === 1 ? "PRATA" : "BRONZE") as Parceiro["nivel"] })),
  galeria: [
    "photo-1522778119026-d647f0596c20","photo-1574629810360-7efbbe195018","photo-1517466787929-bc90951d0974","photo-1579952363873-27f3bade9f55","photo-1553778263-73a83bab9b0c","photo-1560272564-c83b66b1ad12","photo-1529900748604-07564a03e7a6","photo-1489944440615-453fc2b6a9a9","photo-1517927033932-b3d18e61fb3a",
  ].map((p) => ({ id: uid(), url: `https://images.unsplash.com/${p}?q=80&w=400&auto=format&fit=crop`, tipo: "FOTO" as const })),
  projeto: { ...projeto0 },
  documentos: documentos0.map((d, i) => ({ id: uid(), nome: d, atualizado: "mai/26", tamanho: `${(1 + (i % 3)).toFixed(1)} MB` })),
  notificacoes: notifs0.map((n) => ({ ...n, id: uid() })),
  pin: "1234",
};

const KEY = "spartax-site-v1";

function load(): SiteState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

interface Ctx extends SiteState {
  update: (patch: Partial<SiteState>) => void;
  reset: () => void;
  /** true quando sincronizando com o Firebase; false = só local. */
  cloud: boolean;
}

const SiteCtx = createContext<Ctx | null>(null);

/**
 * Chaves que moram no doc principal. Galeria e notícias vivem em
 * subcoleções (cada foto é um doc) — assim não há limite de 1 MB
 * e não é preciso pagar o Storage.
 */
const SCALAR_KEYS = [
  "escudo", "heroImagem", "atletas", "eventos", "proximoJogo",
  "ultimoJogo", "parceiros", "projeto", "documentos", "notificacoes", "pin",
] as const;

function pickScalars(o: Record<string, unknown>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  for (const k of SCALAR_KEYS) if (k in o) r[k] = o[k];
  return r;
}

const GAL_PATH = `${SITE_DOC_PATH}/galeria`;
const NOT_PATH = `${SITE_DOC_PATH}/noticias`;

function mapGaleria(docs: { id: string; data: () => Record<string, unknown> }[]): GaleriaItem[] {
  return docs
    .map((d) => {
      const v = d.data();
      return {
        id: d.id,
        url: String(v.url ?? ""),
        tipo: (v.tipo === "VIDEO" ? "VIDEO" : "FOTO") as GaleriaItem["tipo"],
        createdAt: Number(v.createdAt ?? 0),
      };
    })
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

function mapNoticias(docs: { id: string; data: () => Record<string, unknown> }[]): Noticia[] {
  return docs
    .map((d) => {
      const v = d.data();
      return {
        id: d.id,
        titulo: String(v.titulo ?? ""),
        data: String(v.data ?? ""),
        categoria: String(v.categoria ?? "Clube"),
        imagem: String(v.imagem ?? ""),
        createdAt: Number(v.createdAt ?? 0),
      };
    })
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SiteState>(load);
  /** JSON dos escalares confirmados na nuvem — evita loop de escrita. */
  const cloudJsonRef = useRef<string | null>(null);
  /** Só escreve na nuvem depois da sincronia inicial. */
  const syncedRef = useRef(!isFirebaseConfigured);
  const listsReadyRef = useRef(!isFirebaseConfigured);
  const prevListsRef = useRef<{ galeria: GaleriaItem[]; noticias: Noticia[] }>({ galeria: [], noticias: [] });

  // Sincronia inicial: doc principal + subcoleções (semeia/migra quando preciso)
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    let cancelled = false;
    const database = db;
    const mainRef = doc(database, SITE_DOC_PATH);

    async function seedColl(path: string, items: { id: string }[], toDoc: (x: never) => object) {
      await Promise.all(
        items.map((it, i) =>
          setDoc(doc(database, `${path}/${it.id}`), { ...toDoc(it as never), createdAt: Date.now() - i })
        )
      );
    }

    void (async () => {
      try {
        const local = load();
        const snap = await getDoc(mainRef);
        if (!snap.exists()) {
          // Primeira vez: publica o conteúdo do aparelho como semente
          await setDoc(mainRef, pickScalars(local as unknown as Record<string, unknown>));
          await seedColl(GAL_PATH, local.galeria, (g) => ({ url: (g as GaleriaItem).url, tipo: (g as GaleriaItem).tipo }));
          await seedColl(NOT_PATH, local.noticias, (n) => ({
            titulo: (n as Noticia).titulo, data: (n as Noticia).data,
            categoria: (n as Noticia).categoria, imagem: (n as Noticia).imagem,
          }));
          if (!cancelled) {
            const clean = pickScalars(local as unknown as Record<string, unknown>);
            cloudJsonRef.current = JSON.stringify(clean);
            setState(local);
            prevListsRef.current = { galeria: [...local.galeria], noticias: [...local.noticias] };
          }
        } else {
          // Migra listas inline legadas p/ subcoleções quando estas estão vazias
          const data = snap.data() as Record<string, unknown>;
          const [galSnap, notSnap] = await Promise.all([
            getDocs(collection(database, GAL_PATH)),
            getDocs(collection(database, NOT_PATH)),
          ]);
          const inlineG = Array.isArray(data.galeria) ? (data.galeria as GaleriaItem[]) : [];
          const inlineN = Array.isArray(data.noticias) ? (data.noticias as Noticia[]) : [];
          if (galSnap.empty && inlineG.length) {
            await seedColl(GAL_PATH, inlineG.map((g) => ({ id: g.id ?? uid() })), (x) => {
              const g = inlineG.find((v) => v.id === (x as { id: string }).id) ?? inlineG[0];
              return { url: g.url, tipo: g.tipo };
            });
          } else if (galSnap.empty && local.galeria.length) {
            await seedColl(GAL_PATH, local.galeria, (g) => ({ url: (g as GaleriaItem).url, tipo: (g as GaleriaItem).tipo }));
          }
          if (notSnap.empty && inlineN.length) {
            await seedColl(NOT_PATH, inlineN.map((n) => ({ id: n.id ?? uid() })), (x) => {
              const n = inlineN.find((v) => v.id === (x as { id: string }).id) ?? inlineN[0];
              return { titulo: n.titulo, data: n.data, categoria: n.categoria, imagem: n.imagem };
            });
          } else if (notSnap.empty && local.noticias.length) {
            await seedColl(NOT_PATH, local.noticias, (n) => ({
              titulo: (n as Noticia).titulo, data: (n as Noticia).data,
              categoria: (n as Noticia).categoria, imagem: (n as Noticia).imagem,
            }));
          }
          const [g2, n2] = await Promise.all([
            getDocs(collection(database, GAL_PATH)),
            getDocs(collection(database, NOT_PATH)),
          ]);
          if (!cancelled) {
            const clean = pickScalars(data);
            cloudJsonRef.current = JSON.stringify(clean);
            const gal = mapGaleria(g2.docs.map((d) => ({ id: d.id, data: () => d.data() as Record<string, unknown> })));
            const not = mapNoticias(n2.docs.map((d) => ({ id: d.id, data: () => d.data() as Record<string, unknown> })));
            prevListsRef.current = { galeria: gal, noticias: not };
            setState((s) => ({ ...s, ...(clean as Partial<SiteState>), galeria: gal, noticias: not }));
          }
        }
      } catch { /* segue com o cache local */ }
      finally {
        syncedRef.current = true;
        listsReadyRef.current = true;
      }
    })();

    // Tempo real: doc principal (escalares) preservando as listas locais
    const unsubMain = onSnapshot(
      mainRef,
      (snap) => {
        if (!snap.exists()) return;
        const clean = pickScalars(snap.data() as Record<string, unknown>);
        const json = JSON.stringify(clean);
        if (json !== cloudJsonRef.current) {
          cloudJsonRef.current = json;
          setState((s) => ({ ...s, ...(clean as Partial<SiteState>) }));
        }
      },
      () => {}
    );
    // Tempo real: subcoleções
    const unsubGal = onSnapshot(
      collection(database, GAL_PATH),
      (snap) => {
        if (!listsReadyRef.current) return;
        const items = mapGaleria(snap.docs.map((d) => ({ id: d.id, data: () => d.data() as Record<string, unknown> })));
        prevListsRef.current.galeria = items;
        setState((s) => ({ ...s, galeria: items }));
      },
      () => {}
    );
    const unsubNot = onSnapshot(
      collection(database, NOT_PATH),
      (snap) => {
        if (!listsReadyRef.current) return;
        const items = mapNoticias(snap.docs.map((d) => ({ id: d.id, data: () => d.data() as Record<string, unknown> })));
        prevListsRef.current.noticias = items;
        setState((s) => ({ ...s, noticias: items }));
      },
      () => {}
    );
    return () => {
      cancelled = true;
      unsubMain();
      unsubGal();
      unsubNot();
    };
  }, []);

  // Sincroniza uma lista (diff: adicionados/removidos) com a subcoleção
  function syncColl(
    path: "galeria" | "noticias",
    prev: { id: string }[],
    next: { id: string }[],
    toDoc: (x: never) => object
  ) {
    if (!isFirebaseConfigured || !db) return;
    const database = db;
    const full = path === "galeria" ? GAL_PATH : NOT_PATH;
    const prevIds = new Set(prev.map((i) => i.id));
    const nextIds = new Set(next.map((i) => i.id));
    for (const item of prev) {
      if (!nextIds.has(item.id)) void deleteDoc(doc(database, `${full}/${item.id}`)).catch(() => {});
    }
    next
      .filter((item) => !prevIds.has(item.id))
      .forEach((item, i) => {
        void setDoc(doc(database, `${full}/${item.id}`), { ...toDoc(item as never), createdAt: Date.now() - i }).catch(() => {});
      });
  }

  // Persistência: sempre no aparelho + nuvem (escalares com debounce)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
    if (!isFirebaseConfigured || !db || !syncedRef.current) return;
    const clean = pickScalars(state as unknown as Record<string, unknown>);
    const json = JSON.stringify(clean);
    if (json === cloudJsonRef.current) return; // já está na nuvem
    cloudJsonRef.current = json; // otimista — ignora o eco do snapshot
    const t = setTimeout(() => {
      if (!db) return;
      void setDoc(doc(db, SITE_DOC_PATH), JSON.parse(json), { merge: true }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [state]);

  const value = useMemo<Ctx>(() => ({
    ...state,
    update: (patch) => {
      setState((s) => ({ ...s, ...patch }));
      if (!isFirebaseConfigured || !syncedRef.current || !listsReadyRef.current) return;
      const { galeria, noticias } = patch as Partial<SiteState>;
      if (galeria) {
        syncColl("galeria", prevListsRef.current.galeria, galeria, (g) => ({ url: (g as GaleriaItem).url, tipo: (g as GaleriaItem).tipo }));
        prevListsRef.current.galeria = [...galeria];
      }
      if (noticias) {
        syncColl("noticias", prevListsRef.current.noticias, noticias, (n) => ({
          titulo: (n as Noticia).titulo, data: (n as Noticia).data,
          categoria: (n as Noticia).categoria, imagem: (n as Noticia).imagem,
        }));
        prevListsRef.current.noticias = [...noticias];
      }
    },
    reset: () => {
      setState(DEFAULTS);
      if (!isFirebaseConfigured || !db) return;
      const database = db;
      cloudJsonRef.current = JSON.stringify(pickScalars(DEFAULTS as unknown as Record<string, unknown>));
      void setDoc(doc(database, SITE_DOC_PATH), pickScalars(DEFAULTS as unknown as Record<string, unknown>), { merge: true }).catch(() => {});
      void (async () => {
        const [g, n] = await Promise.all([
          getDocs(collection(database, GAL_PATH)),
          getDocs(collection(database, NOT_PATH)),
        ]);
        await Promise.all([...g.docs, ...n.docs].map((d) => deleteDoc(d.ref).catch(() => {})));
        await Promise.all([
          ...DEFAULTS.galeria.map((it, i) => setDoc(doc(database, `${GAL_PATH}/${it.id}`), { url: it.url, tipo: it.tipo, createdAt: Date.now() - i })),
          ...DEFAULTS.noticias.map((it, i) => setDoc(doc(database, `${NOT_PATH}/${it.id}`), { titulo: it.titulo, data: it.data, categoria: it.categoria, imagem: it.imagem, createdAt: Date.now() - i })),
        ]);
        prevListsRef.current = { galeria: [...DEFAULTS.galeria], noticias: [...DEFAULTS.noticias] };
      })().catch(() => {});
    },
    cloud: isFirebaseConfigured,
  }), [state]);

  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

export function useSite(): Ctx {
  const ctx = useContext(SiteCtx);
  if (!ctx) throw new Error("useSite fora do SiteProvider");
  return ctx;
}

export { uid };
