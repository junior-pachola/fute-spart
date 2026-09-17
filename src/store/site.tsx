import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
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
export interface ProximoJogo { casa: string; fora: string; data: string; hora: string; local: string; competicao: string; rodada: string }
export interface Noticia { id: string; titulo: string; data: string; categoria: string; imagem: string; destaque?: boolean }
export interface Parceiro { id: string; nome: string; tipo: string; detalhe: string; cor: string; nivel: "OURO" | "PRATA" | "BRONZE" }
export interface GaleriaItem { id: string; url: string; tipo: "FOTO" | "VIDEO" }
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
  proximoJogo: { casa: "SPARTAX", fora: "A.E. CLUBE", data: "25 de maio de 2026", hora: "15:30", local: "Estádio Municipal — Waiporã, PR", competicao: "CAMPEONATO REGIONAL", rodada: "RODADA 8" },
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

export function SiteProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SiteState>(load);
  /** JSON do último conteúdo confirmado na nuvem — evita loop de escrita. */
  const cloudJsonRef = useRef<string | null>(null);
  /** Só escreve na nuvem depois da 1ª leitura (não sobrescreve a nuvem com padrão). */
  const syncedRef = useRef(!isFirebaseConfigured);

  // Leitura inicial + tempo real (quando Firebase configurado)
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    const ref = doc(db, SITE_DOC_PATH);
    void getDoc(ref)
      .then((snap) => {
        if (snap.exists()) {
          const data = { ...DEFAULTS, ...(snap.data() as Partial<SiteState>) };
          cloudJsonRef.current = JSON.stringify(data);
          setState(data);
        } else {
          // Primeira vez: publica o conteúdo atual como semente
          void setDoc(ref, load()).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => {
        syncedRef.current = true;
      });
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = { ...DEFAULTS, ...(snap.data() as Partial<SiteState>) };
        const json = JSON.stringify(data);
        if (json !== cloudJsonRef.current) {
          cloudJsonRef.current = json;
          syncedRef.current = true;
          setState(data);
        }
      },
      () => {}
    );
    return unsub;
  }, []);

  // Persistência: sempre no aparelho + nuvem (com debounce) quando configurada
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
    if (!isFirebaseConfigured || !db || !syncedRef.current) return;
    const json = JSON.stringify(state);
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
    update: (patch) => setState((s) => ({ ...s, ...patch })),
    reset: () => setState(DEFAULTS),
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
