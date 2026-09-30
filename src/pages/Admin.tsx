import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/brand";
import { downloadBanner, MatchBannerArt, shareBanner } from "../components/MatchBanner";
import { uid, useSite, type GaleriaItem } from "../store/site";
import { useAuth } from "../store/auth";
import { processImageFile, processImageFiles } from "../store/image";

type Aba = "geral" | "escudo" | "atletas" | "agenda" | "jogos" | "noticias" | "galeria" | "parceiros" | "captacao" | "documentos" | "avisos" | "pin";

export type { Aba };

type AbaMeta = {
  id: Exclude<Aba, "geral">;
  label: string;
  desc: string;
  icon: Parameters<typeof Icon>[0]["name"];
  grupo: string;
};

const MENU_ADM: AbaMeta[] = [
  { id: "escudo", label: "Escudo e capa", desc: "Símbolo + fundo da home", icon: "shield", grupo: "EQUIPE" },
  { id: "atletas", label: "Atletas", desc: "Elenco, fotos e estatísticas", icon: "users", grupo: "EQUIPE" },
  { id: "agenda", label: "Eventos", desc: "Jogos e treinos do calendário", icon: "calendar", grupo: "FUTEBOL" },
  { id: "jogos", label: "Jogos", desc: "Confronto, banner e tabela", icon: "trophy", grupo: "FUTEBOL" },
  { id: "noticias", label: "Notícias", desc: "Publicações do clube", icon: "news", grupo: "FUTEBOL" },
  { id: "galeria", label: "Galeria", desc: "Fotos e vídeos", icon: "gallery", grupo: "FUTEBOL" },
  { id: "parceiros", label: "Parceiros", desc: "Patrocinadores e apoiadores", icon: "handshake", grupo: "CLUBE" },
  { id: "captacao", label: "Captação", desc: "Valores do projeto", icon: "chart", grupo: "CLUBE" },
  { id: "documentos", label: "Documentos", desc: "Transparência oficial", icon: "folder", grupo: "CLUBE" },
  { id: "avisos", label: "Avisos", desc: "Notificações push do app", icon: "bell", grupo: "SISTEMA" },
  { id: "pin", label: "Acesso", desc: "Conta, senha e saída", icon: "gear", grupo: "SISTEMA" },
];

const GRUPOS_ADM = ["EQUIPE", "FUTEBOL", "CLUBE", "SISTEMA"];

export { GRUPOS_ADM, MENU_ADM };

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl bg-black/40 p-2.5 text-sm outline-none ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-red-500 ${props.className ?? ""}`}
    />
  );
}

function Sec({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-[#151517] p-4 ring-1 ring-white/10">
      <p className="font-display text-lg font-bold italic tracking-wide">{title}</p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

/** Sanfona colapsável — resume a seção numa linha (ideal p/ telas longas). */
function Fold({ title, resumo, open, children }: { title: string; resumo?: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group rounded-2xl bg-[#151517] ring-1 ring-white/10">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold italic leading-tight tracking-wide">{title}</p>
          {resumo && <p className="truncate text-[11px] text-zinc-500">{resumo}</p>}
        </div>
        <Icon name="chevron" size={18} className="shrink-0 text-zinc-500 transition-transform group-open:rotate-90" />
      </summary>
      <div className="space-y-2 px-4 pb-4">{children}</div>
    </details>
  );
}

function Del({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="press rounded-lg bg-red-600/15 px-2.5 py-1.5 text-xs font-bold text-red-400 ring-1 ring-red-600/30">
      Excluir
    </button>
  );
}

/** Botão redondo de foto do atleta (galeria do celular). */
function FotoBtn({ foto, nome, onChange }: { foto: string; nome: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        disabled={busy}
        title="Trocar foto"
        className="press flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-sm font-extrabold ring-1 ring-white/15 disabled:opacity-60"
      >
        {foto ? (
          <img src={foto} alt={nome} className="h-full w-full object-cover" />
        ) : (
          nome.split(" ").map((p) => p[0]).slice(0, 2).join("")
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          void processImageFile(f, "atletas")
            .then(onChange)
            .catch(() => alert("Não foi possível ler essa foto."))
            .finally(() => setBusy(false));
        }}
      />
    </>
  );
}

/** Prévia + exportação do banner do confronto (1080x1350). */
function BannerTools() {
  const site = useSite();
  const capRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(300);
  const [busy, setBusy] = useState<"idle" | "dl" | "share">("idle");

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const scale = w / 1080;
  const nome = `confronto-${site.proximoJogo.casa}-x-${site.proximoJogo.fora}`.toLowerCase().replace(/\s+/g, "-") + ".png";

  async function baixar() {
    if (!capRef.current || busy !== "idle") return;
    setBusy("dl");
    try {
      await downloadBanner(capRef.current, nome);
    } catch {
      alert("Falha ao gerar a imagem. Tente de novo.");
    } finally {
      setBusy("idle");
    }
  }

  async function compartilhar() {
    if (!capRef.current || busy !== "idle") return;
    setBusy("share");
    try {
      const r = await shareBanner(capRef.current, nome);
      if (r === "downloaded") alert("Este aparelho não compartilha direto — a imagem foi baixada.");
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") alert("Falha ao compartilhar. Tente baixar.");
    } finally {
      setBusy("idle");
    }
  }

  return (
    <div>
      <div ref={wrapRef} className="w-full overflow-hidden rounded-2xl ring-1 ring-white/10" style={{ height: 1350 * scale }}>
        <div style={{ width: 1080, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <MatchBannerArt />
        </div>
      </div>
      {/* nó em tamanho real, fora da tela, só p/ gerar o PNG */}
      <div aria-hidden="true" style={{ position: "fixed", left: -12000, top: 0 }}>
        <MatchBannerArt innerRef={capRef} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={() => void baixar()} disabled={busy !== "idle"} className="press rounded-xl bg-red-600 py-2.5 text-sm font-extrabold disabled:opacity-60">
          {busy === "dl" ? "GERANDO..." : "BAIXAR PNG"}
        </button>
        <button onClick={() => void compartilhar()} disabled={busy !== "idle"} className="press rounded-xl bg-gold-500 py-2.5 text-sm font-extrabold text-black disabled:opacity-60">
          {busy === "share" ? "GERANDO..." : "COMPARTILHAR"}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-zinc-500">Gera imagem 1080x1350 pronta pro WhatsApp, Instagram e impressão.</p>
    </div>
  );
}

/** Campo de imagem: busca na galeria/câmera do celular, aceita URL ou remove. */
function ImageField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlMode, setUrlMode] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleFile(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await processImageFile(f, "site"));
    } catch {
      alert("Não foi possível ler essa imagem. Tente outra.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl bg-black/30 p-2.5 ring-1 ring-white/10">
      <p className="text-xs font-bold text-zinc-300">{label}</p>
      {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black/50 ring-1 ring-white/10">
          {value ? (
            <img src={value} alt="Prévia" className="h-full w-full object-cover" />
          ) : (
            <Icon name="gallery" size={22} className="text-zinc-600" />
          )}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-1.5">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="press flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-[11px] font-extrabold disabled:opacity-60"
          >
            <Icon name="gallery" size={15} />
            {busy ? "LENDO..." : "GALERIA"}
          </button>
          <button onClick={() => setUrlMode((v) => !v)} className="press rounded-xl bg-white/5 py-2.5 text-[11px] font-bold text-zinc-300 ring-1 ring-white/10">
            {urlMode ? "FECHAR URL" : "USAR URL"}
          </button>
        </div>
        {value && (
          <button onClick={() => onChange("")} className="press shrink-0 rounded-xl bg-white/5 px-2.5 py-2.5 text-[11px] font-bold text-red-400 ring-1 ring-white/10">
            X
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ""; }}
      />
      {urlMode && (
        <Field value={value.startsWith("data:") ? "" : value} onChange={(e) => onChange(e.target.value)} placeholder="https://... (ou mantenha a da galeria)" className="mt-2" />
      )}
      <p className="mt-1.5 text-[10px] text-zinc-600">No celular abre galeria e câmera. A foto é otimizada sozinha.</p>
    </div>
  );
}

export default function Admin({ onExit, aba, setAba }: { onExit: () => void; aba: Aba; setAba: (a: Aba) => void }) {
  const site = useSite();
  const auth = useAuth();

  // forms locais
  const [fAtleta, setFAtleta] = useState({ nome: "", posicao: "", nasc: "", numero: "" });
  const [fEvento, setFEvento] = useState({ dia: "", mes: "MAI", ano: String(new Date().getFullYear()), hora: "", titulo: "Treino no CT", detalhe: "", tipo: "TREINO" as "JOGO" | "TREINO", repetir: 1 });

const MESES_ADM = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

/** Soma dias a uma data (dia/mes/ano) e devolve o novo trio — para repetição semanal. */
function somarDias(dia: string, mes: string, ano: string, add: number): { dia: string; mes: string; ano: string } | null {
  const mi = MESES_ADM.indexOf(mes.toUpperCase().slice(0, 3));
  const a = Number(ano);
  const d = Number(dia);
  if (mi < 0 || !a || !d) return null;
  const dt = new Date(a, mi, d);
  if (dt.getDate() !== d || dt.getMonth() !== mi) return null; // ex: 31 de fevereiro
  dt.setDate(dt.getDate() + add);
  return { dia: String(dt.getDate()).padStart(2, "0"), mes: MESES_ADM[dt.getMonth()], ano: String(dt.getFullYear()) };
}
  const [fNoticia, setFNoticia] = useState({ titulo: "", data: "", categoria: "Clube", imagem: "", texto: "" });
  const [fParceiro, setFParceiro] = useState({ nome: "", tipo: "Apoiador", detalhe: "", nivel: "BRONZE" as "OURO" | "PRATA" | "BRONZE", logo: "", link: "" });
  const [fGaleria, setFGaleria] = useState({ url: "", tipo: "FOTO" as GaleriaItem["tipo"], link: "" });
  const [fDoc, setFDoc] = useState({ nome: "" });
  const [fAviso, setFAviso] = useState({ titulo: "" });
  const [fPin, setFPin] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [busyGal, setBusyGal] = useState(false);
  const galRef = useRef<HTMLInputElement>(null);

  const naoLidos = site.notificacoes.filter((n) => !n.lida).length;

  const contagem: Record<string, string | undefined> = {
    atletas: String(site.atletas.length),
    agenda: String(site.eventos.length),
    noticias: String(site.noticias.length),
    galeria: String(site.galeria.length),
    parceiros: String(site.parceiros.length),
    documentos: String(site.documentos.length),
    avisos: naoLidos > 0 ? `${naoLidos} novos` : undefined,
  };

  async function importarGaleria(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusyGal(true);
    try {
      const urls = await processImageFiles(files, "galeria");
      site.update({ galeria: [...urls.map((url) => ({ id: uid(), url, tipo: fGaleria.tipo, link: "" })), ...site.galeria] });
    } catch {
      alert("Alguma imagem não pôde ser lida.");
    } finally {
      setBusyGal(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-red-700 to-red-900 p-4">
        <div>
          <p className="font-display text-2xl font-extrabold italic leading-none">PAINEL ADM</p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-red-100">
            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider ${site.cloud ? "bg-green-500/25 text-green-200 ring-1 ring-green-400/40" : "bg-black/30 text-red-100 ring-1 ring-white/20"}`}>
              {site.cloud ? "NUVEM FIREBASE" : "MODO LOCAL"}
            </span>
            Tudo reflete no app na hora.
          </p>
        </div>
        <button onClick={onExit} className="press rounded-xl bg-black/30 px-3 py-2 text-xs font-bold ring-1 ring-white/20">
          Ver app
        </button>
      </div>

      <div className="mt-3 space-y-3 pb-4">
        {aba !== "geral" &&
          (() => {
            const meta = MENU_ADM.find((m) => m.id === aba);
            if (!meta) return null;
            const badge =
              aba === "atletas" ? String(site.atletas.length)
              : aba === "agenda" ? String(site.eventos.length)
              : aba === "noticias" ? String(site.noticias.length)
              : aba === "galeria" ? String(site.galeria.length)
              : aba === "parceiros" ? String(site.parceiros.length)
              : aba === "documentos" ? String(site.documentos.length)
              : aba === "avisos" && naoLidos > 0 ? `${naoLidos} novos`
              : undefined;
            return (
              <div className="flex items-center gap-3 rounded-2xl bg-[#151517] p-3 ring-1 ring-white/10">
                <button
                  onClick={() => setAba("geral")}
                  aria-label="Voltar ao painel"
                  className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-zinc-300"
                >
                  <Icon name="back" size={20} />
                </button>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/15 text-red-400">
                  <Icon name={meta.icon} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl font-bold italic leading-none">{meta.label}</p>
                  <p className="truncate text-[11px] text-zinc-500">{meta.desc}</p>
                </div>
                {badge && (
                  <span className="shrink-0 rounded-lg bg-red-600/20 px-2 py-1 text-[11px] font-extrabold text-red-300">
                    {badge}
                  </span>
                )}
              </div>
            );
          })()}
        {aba === "geral" && (
          <>
            <Sec title="Resumo do clube" sub={site.cloud ? "Sincronizando com a nuvem Firebase." : "Modo local — conecte o Firebase para sincronizar."}>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  [String(site.atletas.length), "ATLETAS"],
                  [String(site.eventos.length), "EVENTOS"],
                  [String(site.noticias.length), "NOTÍCIAS"],
                  [String(site.galeria.length), "MÍDIAS"],
                ].map(([n, l]) => (
                  <div key={l} className="rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
                    <p className="font-display text-2xl font-extrabold italic leading-none">{n}</p>
                    <p className="mt-1 text-[9px] font-bold tracking-widest text-zinc-500">{l}</p>
                  </div>
                ))}
              </div>
            </Sec>
            {GRUPOS_ADM.map((g) => (
              <div key={g}>
                <p className="px-1 text-[10px] font-extrabold tracking-[0.25em] text-zinc-500">{g === "FUTEBOL" ? "COMPETIÇÃO" : g}</p>
                <div className="mt-1.5 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {MENU_ADM.filter((m) => m.grupo === g).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setAba(m.id)}
                      className="press flex items-center gap-3 rounded-2xl bg-[#151517] p-3.5 text-left ring-1 ring-white/10"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600/15 text-red-400">
                        <Icon name={m.icon} size={21} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-[14px] font-bold">
                          {m.label}
                          {contagem[m.id] && (
                            <span className="rounded-md bg-red-600/20 px-1.5 py-0.5 text-[10px] font-extrabold text-red-300">
                              {contagem[m.id]}
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-[11px] text-zinc-500">
                          {m.id === "pin" && !site.cloud ? "PIN de acesso" : m.desc}
                        </span>
                      </span>
                      <Icon name="chevron" size={17} className="shrink-0 text-zinc-600" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <details className="rounded-2xl bg-[#151517] ring-1 ring-white/10">
              <summary className="cursor-pointer list-none p-4 text-sm font-bold text-zinc-400 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between">
                  Zona de segurança
                  <Icon name="chevron" size={16} className="text-zinc-600" />
                </span>
              </summary>
              <div className="px-4 pb-4">
                <p className="mb-2 text-[11px] text-zinc-500">Restaurar apaga tudo que foi personalizado e volta ao padrão.</p>
                <button
                  onClick={() => { if (confirm("Restaurar todo o conteúdo padrão?")) site.reset(); }}
                  className="press w-full rounded-xl bg-white/5 py-2.5 text-xs font-bold text-zinc-400 ring-1 ring-white/10"
                >
                  Restaurar conteúdo padrão
                </button>
              </div>
            </details>
          </>
        )}

        {aba === "escudo" && (
          <>
            <Sec title="Escudo do time" sub="Foto oficial, nome, sigla e cores.">
              <ImageField
                label="Foto do escudo oficial"
                hint="Busque na galeria do celular (PNG com fundo transparente fica melhor)."
                value={site.escudo.imagemUrl}
                onChange={(v) => site.update({ escudo: { ...site.escudo, imagemUrl: v } })}
              />
              <Field value={site.escudo.nome} onChange={(e) => site.update({ escudo: { ...site.escudo, nome: e.target.value.toUpperCase() } })} placeholder="Nome — ex: SPARTAX" />
              <Field value={site.escudo.sigla} maxLength={4} onChange={(e) => site.update({ escudo: { ...site.escudo, sigla: e.target.value.toUpperCase() } })} placeholder="Sigla — SPX" />
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 rounded-xl bg-black/40 p-2.5 ring-1 ring-white/10">
                  <input type="color" value={site.escudo.primaria} onChange={(e) => site.update({ escudo: { ...site.escudo, primaria: e.target.value } })} className="h-8 w-10 cursor-pointer bg-transparent" />
                  <span className="text-xs text-zinc-400">Cor principal</span>
                </label>
                <label className="flex items-center gap-2 rounded-xl bg-black/40 p-2.5 ring-1 ring-white/10">
                  <input type="color" value={site.escudo.secundaria} onChange={(e) => site.update({ escudo: { ...site.escudo, secundaria: e.target.value } })} className="h-8 w-10 cursor-pointer bg-transparent" />
                  <span className="text-xs text-zinc-400">Cor escura</span>
                </label>
              </div>
            </Sec>
            <Sec title="Fundo da tela inicial" sub="Capa do splash, topo do menu e faixa de boas-vindas da home.">
              <ImageField
                label="Imagem de fundo"
                hint="Use foto do estádio, da torcida ou do time. Vale imagem wide (deitada)."
                value={site.heroImagem}
                onChange={(v) => site.update({ heroImagem: v })}
              />
              {site.heroImagem.startsWith("data:") && (
                <button
                  onClick={() => site.update({ heroImagem: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=900&auto=format&fit=crop" })}
                  className="press w-full rounded-xl bg-white/5 py-2.5 text-xs font-bold text-zinc-400 ring-1 ring-white/10"
                >
                  Voltar ao fundo padrão
                </button>
              )}
            </Sec>
          </>
        )}

        {aba === "atletas" && (
          <>
            <Fold title="Novo atleta" resumo="Cadastrar no elenco" open>
            <div className="grid grid-cols-2 gap-2">
              <Field value={fAtleta.nome} onChange={(e) => setFAtleta({ ...fAtleta, nome: e.target.value.toUpperCase() })} placeholder="Nome completo" />
              <Field value={fAtleta.posicao} onChange={(e) => setFAtleta({ ...fAtleta, posicao: e.target.value })} placeholder="Posição" />
              <Field value={fAtleta.nasc} onChange={(e) => setFAtleta({ ...fAtleta, nasc: e.target.value })} placeholder="Nasc. 01/01/2011" />
              <Field value={fAtleta.numero} inputMode="numeric" onChange={(e) => setFAtleta({ ...fAtleta, numero: e.target.value })} placeholder="Nº camisa" />
            </div>
            <button
              onClick={() => {
                if (!fAtleta.nome.trim()) return alert("Informe o nome do atleta.");
                site.update({ atletas: [...site.atletas, { id: uid(), nome: fAtleta.nome.trim(), posicao: fAtleta.posicao || "—", nasc: fAtleta.nasc || "—", numero: Number(fAtleta.numero) || 0, foto: "", gols: 0, assistencias: 0, jogos: 0, amarelos: 0, vermelhos: 0 }] });
                setFAtleta({ nome: "", posicao: "", nasc: "", numero: "" });
              }}
              className="press w-full rounded-xl bg-red-600 py-2.5 text-sm font-extrabold"
            >
              ADICIONAR ATLETA
            </button>
            </Fold>
            {[...site.atletas].sort((a, b) => a.numero - b.numero).map((a) => (
              <Fold key={a.id} title={a.nome} resumo={`#${a.numero} • ${a.posicao} • ${a.nasc}`}>
                <div className="flex items-center gap-2">
                  <FotoBtn foto={a.foto ?? ""} nome={a.nome} onChange={(v) => site.update({ atletas: site.atletas.map((x) => (x.id === a.id ? { ...x, foto: v } : x)) })} />
                  <input value={a.numero} inputMode="numeric" title="Número da camisa" onChange={(e) => site.update({ atletas: site.atletas.map((x) => (x.id === a.id ? { ...x, numero: Number(e.target.value) || 0 } : x)) })} className="w-12 rounded-lg bg-black/50 p-1.5 text-center text-sm font-extrabold outline-none ring-1 ring-white/10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{a.nome}</p>
                    <p className="truncate text-[11px] text-zinc-500">{a.posicao} • {a.nasc}</p>
                  </div>
                  <Del onClick={() => site.update({ atletas: site.atletas.filter((x) => x.id !== a.id) })} />
                </div>
                <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                  {(["jogos", "gols", "assistencias", "amarelos", "vermelhos"] as const).map((k) => (
                    <label key={k} className="text-center">
                      <span className="text-[9px] font-extrabold text-zinc-500">{k === "jogos" ? "JOG" : k === "gols" ? "GOL" : k === "assistencias" ? "ASS" : k === "amarelos" ? "AMA" : "VER"}</span>
                      <input value={a[k] ?? 0} inputMode="numeric" onChange={(e) => site.update({ atletas: site.atletas.map((x) => (x.id === a.id ? { ...x, [k]: Number(e.target.value) || 0 } : x)) })} className="w-full rounded-lg bg-black/50 p-1.5 text-center text-sm font-bold outline-none ring-1 ring-white/10" />
                    </label>
                  ))}
                </div>
              </Fold>
            ))}
          </>
        )}

        {aba === "agenda" && (
          <>
            <Fold title="Novo evento" resumo="Jogo ou treino no calendário" open>
            <div className="grid grid-cols-4 gap-2">
              <Field value={fEvento.dia} inputMode="numeric" maxLength={2} onChange={(e) => setFEvento({ ...fEvento, dia: e.target.value })} placeholder="Dia" />
              <Field value={fEvento.mes} maxLength={3} onChange={(e) => setFEvento({ ...fEvento, mes: e.target.value.toUpperCase() })} placeholder="Mês" />
              <Field value={fEvento.ano} inputMode="numeric" maxLength={4} onChange={(e) => setFEvento({ ...fEvento, ano: e.target.value.replace(/\D/g, "") })} placeholder="Ano" />
              <Field value={fEvento.hora} onChange={(e) => setFEvento({ ...fEvento, hora: e.target.value })} placeholder="Hora" />
            </div>
            <Field value={fEvento.detalhe} onChange={(e) => setFEvento({ ...fEvento, detalhe: e.target.value })} placeholder="Ex: Spartax x A.E. Clube — Estádio Municipal" />
            <div className="grid grid-cols-2 gap-2">
              {(["JOGO", "TREINO"] as const).map((t) => (
                <button key={t} onClick={() => setFEvento({ ...fEvento, tipo: t })} className={`rounded-xl py-2 text-xs font-extrabold ${fEvento.tipo === t ? "bg-red-600" : "bg-black/40 text-zinc-400 ring-1 ring-white/10"}`}>{t}</button>
              ))}
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-bold text-zinc-400">Repetir toda semana (treino fixo):</p>
              <div className="grid grid-cols-4 gap-2">
                {([1, 4, 8, 12] as const).map((n) => (
                  <button key={n} onClick={() => setFEvento({ ...fEvento, repetir: n })} className={`rounded-xl py-2 text-xs font-extrabold ${fEvento.repetir === n ? "bg-red-600" : "bg-black/40 text-zinc-400 ring-1 ring-white/10"}`}>
                    {n === 1 ? "1×" : `${n}×`}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                if (!fEvento.dia || !fEvento.hora) return alert("Informe dia e hora.");
                const base = somarDias(fEvento.dia, fEvento.mes || "MAI", fEvento.ano || String(new Date().getFullYear()), 0);
                if (!base) return alert("Data inválida. Confira dia, mês e ano.");
                const novos = Array.from({ length: fEvento.repetir }, (_, i) => {
                  const dt = somarDias(base.dia, base.mes, base.ano, i * 7)!;
                  return {
                    id: uid(), dia: dt.dia, mes: dt.mes, ano: dt.ano, hora: fEvento.hora,
                    titulo: fEvento.tipo,
                    detalhe: fEvento.detalhe || (fEvento.tipo === "JOGO" ? "Jogo" : "Treino no CT"),
                    tipo: fEvento.tipo,
                  };
                });
                site.update({ eventos: [...site.eventos, ...novos] });
                setFEvento({ dia: "", mes: "MAI", ano: String(new Date().getFullYear()), hora: "", titulo: "Treino no CT", detalhe: "", tipo: "TREINO", repetir: 1 });
              }}
              className="press w-full rounded-xl bg-red-600 py-2.5 text-sm font-extrabold"
            >
              {fEvento.repetir === 1 ? "CRIAR EVENTO" : `CRIAR ${fEvento.repetir} EVENTOS SEMANAIS`}
            </button>
            </Fold>
            <p className="px-1 text-[10px] font-extrabold tracking-[0.25em] text-zinc-500">{site.eventos.length} EVENTOS NO CALENDÁRIO</p>
            {[...site.eventos].sort((a, b) => (a.ano + a.mes + a.dia).localeCompare(b.ano + b.mes + b.dia)).map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-xl bg-black/30 p-2 ring-1 ring-white/10">
                <span className={`rounded-md px-2 py-1 text-[10px] font-extrabold ${e.tipo === "JOGO" ? "bg-red-600" : "bg-white/10 text-zinc-300"}`}>{e.tipo}</span>
                <p className="min-w-0 flex-1 truncate text-xs"><b>{e.dia}/{e.mes}/{e.ano ?? "—"} {e.hora}</b> — {e.detalhe}</p>
                <Del onClick={() => site.update({ eventos: site.eventos.filter((x) => x.id !== e.id) })} />
              </div>
            ))}
          </>
        )}

        {aba === "jogos" && (
          <>
            <Fold title="Próximo jogo" resumo={`${site.proximoJogo.casa} x ${site.proximoJogo.fora} • ${site.proximoJogo.data} ${site.proximoJogo.hora}`} open>
              <Field value={site.proximoJogo.casa} onChange={(e) => site.update({ proximoJogo: { ...site.proximoJogo, casa: e.target.value.toUpperCase() } })} placeholder="Time casa" />
              <Field value={site.proximoJogo.fora} onChange={(e) => site.update({ proximoJogo: { ...site.proximoJogo, fora: e.target.value.toUpperCase() } })} placeholder="Visitante" />
              <div className="grid grid-cols-2 gap-2">
                <Field value={site.proximoJogo.data} onChange={(e) => site.update({ proximoJogo: { ...site.proximoJogo, data: e.target.value } })} placeholder="Data" />
                <Field value={site.proximoJogo.hora} onChange={(e) => site.update({ proximoJogo: { ...site.proximoJogo, hora: e.target.value } })} placeholder="Hora" />
              </div>
              <Field value={site.proximoJogo.local} onChange={(e) => site.update({ proximoJogo: { ...site.proximoJogo, local: e.target.value } })} placeholder="Local" />
              <div className="grid grid-cols-2 gap-2">
                <Field value={site.proximoJogo.competicao} onChange={(e) => site.update({ proximoJogo: { ...site.proximoJogo, competicao: e.target.value.toUpperCase() } })} placeholder="Competição" />
                <Field value={site.proximoJogo.rodada} onChange={(e) => site.update({ proximoJogo: { ...site.proximoJogo, rodada: e.target.value.toUpperCase() } })} placeholder="Rodada" />
              </div>
            </Fold>
            <Fold title="Escudos do confronto" resumo="Mandante + adversário (galeria do celular)">
              <ImageField
                label="Escudo do mandante (casa)"
                hint="Vazio = usa o escudo do clube."
                value={site.proximoJogo.casaEscudo}
                onChange={(v) => site.update({ proximoJogo: { ...site.proximoJogo, casaEscudo: v } })}
              />
              <ImageField
                label="Escudo do adversário (visitante)"
                hint="Busque na galeria do celular ao criar o confronto."
                value={site.proximoJogo.foraEscudo}
                onChange={(v) => site.update({ proximoJogo: { ...site.proximoJogo, foraEscudo: v } })}
              />
            </Fold>
            <Fold title="Banner do confronto" resumo="Arte 1080×1350 pronta para compartilhar">
              <BannerTools />
            </Fold>
            <Fold title="Último resultado" resumo={`${site.ultimoJogo.casa} ${site.ultimoJogo.golsCasa}×${site.ultimoJogo.golsFora} ${site.ultimoJogo.fora} • ${site.ultimoJogo.data}`}>
              <div className="grid grid-cols-2 gap-2">
                <Field value={site.ultimoJogo.casa} onChange={(e) => site.update({ ultimoJogo: { ...site.ultimoJogo, casa: e.target.value.toUpperCase() } })} placeholder="Casa (sigla)" />
                <Field value={site.ultimoJogo.fora} onChange={(e) => site.update({ ultimoJogo: { ...site.ultimoJogo, fora: e.target.value.toUpperCase() } })} placeholder="Fora (sigla)" />
                <Field value={String(site.ultimoJogo.golsCasa)} inputMode="numeric" onChange={(e) => site.update({ ultimoJogo: { ...site.ultimoJogo, golsCasa: Number(e.target.value) || 0 } })} placeholder="Gols casa" />
                <Field value={String(site.ultimoJogo.golsFora)} inputMode="numeric" onChange={(e) => site.update({ ultimoJogo: { ...site.ultimoJogo, golsFora: Number(e.target.value) || 0 } })} placeholder="Gols fora" />
              </div>
              <Field value={site.ultimoJogo.data} onChange={(e) => site.update({ ultimoJogo: { ...site.ultimoJogo, data: e.target.value } })} placeholder="Data — ex: 18 MAI" />
            </Fold>
            <Fold title="Classificação" resumo={`${site.classificacao.length} times • pontos calculados sozinhos`}>
              {site.classificacao.map((t) => (
                <div key={t.id} className="rounded-xl bg-black/30 p-2.5 ring-1 ring-white/10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-[52px] shrink-0">
                      <Field value={t.sigla} maxLength={3} onChange={(e) => site.update({ classificacao: site.classificacao.map((x) => (x.id === t.id ? { ...x, sigla: e.target.value.toUpperCase() } : x)) })} placeholder="SIG" className="px-1 text-center font-extrabold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Field value={t.time} onChange={(e) => site.update({ classificacao: site.classificacao.map((x) => (x.id === t.id ? { ...x, time: e.target.value } : x)) })} placeholder="Nome do time" />
                    </div>
                    <button
                      onClick={() => { if (confirm(`Excluir ${t.time} da tabela?`)) site.update({ classificacao: site.classificacao.filter((x) => x.id !== t.id) }); }}
                      aria-label={`Excluir ${t.time}`}
                      className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/15 text-2xl font-black leading-none text-red-400 ring-1 ring-red-600/30"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                    {(["j", "v", "e", "d"] as const).map((k) => (
                      <label key={k} className="text-center">
                        <span className="text-[9px] font-extrabold text-zinc-500">{k.toUpperCase()}</span>
                        <input value={t[k]} inputMode="numeric" onChange={(e) => site.update({ classificacao: site.classificacao.map((x) => (x.id === t.id ? { ...x, [k]: Number(e.target.value) || 0 } : x)) })} className="w-full rounded-lg bg-black/50 p-2 text-center text-sm font-bold outline-none ring-1 ring-white/10" />
                      </label>
                    ))}
                  </div>
                  <div className="mt-1.5 grid grid-cols-[1fr_1fr_1.5fr] gap-1.5">
                    {(["gp", "gc"] as const).map((k) => (
                      <label key={k} className="text-center">
                        <span className="text-[9px] font-extrabold text-zinc-500">{k.toUpperCase()}</span>
                        <input value={t[k]} inputMode="numeric" onChange={(e) => site.update({ classificacao: site.classificacao.map((x) => (x.id === t.id ? { ...x, [k]: Number(e.target.value) || 0 } : x)) })} className="w-full rounded-lg bg-black/50 p-2 text-center text-sm font-bold outline-none ring-1 ring-white/10" />
                      </label>
                    ))}
                    <label className="text-center">
                      <span className="text-[9px] font-extrabold text-zinc-500">FORMA</span>
                      <input value={t.forma} maxLength={5} onChange={(e) => site.update({ classificacao: site.classificacao.map((x) => (x.id === t.id ? { ...x, forma: e.target.value.toUpperCase().replace(/[^VED]/g, "") } : x)) })} placeholder="VVVVV" className="w-full rounded-lg bg-black/50 p-2 text-center text-sm font-bold outline-none ring-1 ring-white/10 placeholder:text-zinc-700" />
                    </label>
                  </div>
                  <p className="mt-1.5 truncate text-right text-[11px] font-bold text-zinc-400">{t.v * 3 + t.e} pts • saldo {t.gp - t.gc > 0 ? `+${t.gp - t.gc}` : t.gp - t.gc}</p>
                </div>
              ))}
              <button
                onClick={() => site.update({ classificacao: [...site.classificacao, { id: uid(), time: "Novo time", sigla: "NOV", j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, forma: "" }] })}
                className="press w-full rounded-xl bg-white/5 py-2.5 text-xs font-bold ring-1 ring-white/10"
              >
                + Adicionar time
              </button>
            </Fold>
          </>
        )}

        {aba === "noticias" && (
          <Sec title="Notícias" sub="Foto da galeria ou URL. A primeira vira destaque da home.">
            <Field value={fNoticia.titulo} onChange={(e) => setFNoticia({ ...fNoticia, titulo: e.target.value })} placeholder="Título da notícia" />
            <div className="grid grid-cols-2 gap-2">
              <Field value={fNoticia.data} onChange={(e) => setFNoticia({ ...fNoticia, data: e.target.value })} placeholder="Data 21/05/2026" />
              <Field value={fNoticia.categoria} onChange={(e) => setFNoticia({ ...fNoticia, categoria: e.target.value })} placeholder="Categoria" />
            </div>
            <ImageField label="Foto da notícia" value={fNoticia.imagem} onChange={(v) => setFNoticia({ ...fNoticia, imagem: v })} />
            <div>
              <textarea
                value={fNoticia.texto}
                onChange={(e) => setFNoticia({ ...fNoticia, texto: e.target.value })}
                rows={4}
                placeholder="Texto da matéria (parágrafos separados por linha em branco)..."
                className="w-full rounded-xl bg-black/40 p-2.5 text-sm outline-none ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-red-500"
              />
              <p className="mt-1 text-right text-[10px] text-zinc-600">{fNoticia.texto.split(/\s+/).filter(Boolean).length} palavras</p>
            </div>
            <button
              onClick={() => {
                if (!fNoticia.titulo.trim()) return alert("Informe o título.");
                site.update({ noticias: [{ id: uid(), titulo: fNoticia.titulo, data: fNoticia.data || "hoje", categoria: fNoticia.categoria || "Clube", imagem: fNoticia.imagem || site.heroImagem, texto: fNoticia.texto }, ...site.noticias] });
                setFNoticia({ titulo: "", data: "", categoria: "Clube", imagem: "", texto: "" });
              }}
              className="press w-full rounded-xl bg-red-600 py-2.5 text-sm font-extrabold"
            >
              PUBLICAR NOTÍCIA
            </button>
            {site.noticias.map((n) => (
              <div key={n.id} className="flex items-center gap-2 rounded-xl bg-black/30 p-2 ring-1 ring-white/10">
                <img src={n.imagem} alt="" className="h-9 w-12 shrink-0 rounded-lg bg-zinc-800 object-cover" />
                <p className="min-w-0 flex-1 truncate text-xs"><b>{n.categoria}</b> — {n.titulo}</p>
                <Del onClick={() => site.update({ noticias: site.noticias.filter((x) => x.id !== n.id) })} />
              </div>
            ))}
          </Sec>
        )}

        {aba === "galeria" && (
          <Sec title="Galeria" sub="Importe várias fotos da galeria do celular de uma vez.">
            <input
              ref={galRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { void importarGaleria(e.target.files); e.target.value = ""; }}
            />
            <div className="grid grid-cols-2 gap-2">
              {(["FOTO", "VIDEO"] as const).map((t) => (
                <button key={t} onClick={() => setFGaleria({ ...fGaleria, tipo: t })} className={`rounded-xl py-2 text-xs font-extrabold ${fGaleria.tipo === t ? "bg-red-600" : "bg-black/40 text-zinc-400 ring-1 ring-white/10"}`}>{t === "FOTO" ? "FOTO" : "VÍDEO"}</button>
              ))}
            </div>
            <button
              onClick={() => galRef.current?.click()}
              disabled={busyGal}
              className="press flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-extrabold disabled:opacity-60"
            >
              <Icon name="gallery" size={17} />
              {busyGal ? "IMPORTANDO..." : `IMPORTAR DA GALERIA (${fGaleria.tipo === "FOTO" ? "FOTOS" : "VÍDEOS"})`}
            </button>
            <Field value={fGaleria.url} onChange={(e) => setFGaleria({ ...fGaleria, url: e.target.value })} placeholder="...ou cole URL https:// e some abaixo" />
            {fGaleria.tipo === "VIDEO" && (
              <Field value={fGaleria.link} onChange={(e) => setFGaleria({ ...fGaleria, link: e.target.value })} placeholder="Link do vídeo (YouTube, Instagram...) — abre ao tocar" />
            )}
            <button
              onClick={() => {
                if (!fGaleria.url.trim()) return;
                site.update({ galeria: [{ id: uid(), url: fGaleria.url.trim(), tipo: fGaleria.tipo, link: fGaleria.link.trim() }, ...site.galeria] });
                setFGaleria({ url: "", tipo: "FOTO", link: "" });
              }}
              className="press w-full rounded-xl bg-white/5 py-2.5 text-xs font-bold ring-1 ring-white/10"
            >
              ADICIONAR POR URL
            </button>
            <div className="grid grid-cols-3 gap-1.5">
              {site.galeria.map((g) => (
                <div key={g.id} className="relative aspect-square overflow-hidden rounded-xl bg-zinc-800">
                  <img src={g.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold">{g.tipo === "FOTO" ? "FOTO" : "VÍDEO"}</span>
                  <button onClick={() => site.update({ galeria: site.galeria.filter((x) => x.id !== g.id) })} className="absolute right-1 top-1 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-bold text-red-400">X</button>
                </div>
              ))}
            </div>
          </Sec>
        )}

        {aba === "parceiros" && (
          <Sec title="Parceiros / Patrocinadores" sub="Nível OURO aparece em destaque.">
            <Field value={fParceiro.nome} onChange={(e) => setFParceiro({ ...fParceiro, nome: e.target.value.toUpperCase() })} placeholder="Nome — ex: COPEL" />
            <div className="grid grid-cols-2 gap-2">
              <Field value={fParceiro.tipo} onChange={(e) => setFParceiro({ ...fParceiro, tipo: e.target.value })} placeholder="Tipo" />
              <Field value={fParceiro.detalhe} onChange={(e) => setFParceiro({ ...fParceiro, detalhe: e.target.value })} placeholder="Detalhe" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["OURO", "PRATA", "BRONZE"] as const).map((n) => (
                <button key={n} onClick={() => setFParceiro({ ...fParceiro, nivel: n })} className={`rounded-xl py-2 text-xs font-extrabold ${fParceiro.nivel === n ? "bg-red-600" : "bg-black/40 text-zinc-400 ring-1 ring-white/10"}`}>{n}</button>
              ))}
            </div>
            <ImageField label="Logo do parceiro" hint="Busque na galeria (PNG com fundo branco fica melhor)." value={fParceiro.logo} onChange={(v) => setFParceiro({ ...fParceiro, logo: v })} />
            <Field value={fParceiro.link} onChange={(e) => setFParceiro({ ...fParceiro, link: e.target.value })} placeholder="Site — ex: empresa.com.br (opcional)" />
            <button
              onClick={() => {
                if (!fParceiro.nome.trim()) return alert("Informe o nome.");
                site.update({ parceiros: [...site.parceiros, { id: uid(), nome: fParceiro.nome.trim(), tipo: fParceiro.tipo || "Apoiador", detalhe: fParceiro.detalhe || "", cor: "bg-red-600", nivel: fParceiro.nivel, logo: fParceiro.logo, link: fParceiro.link.trim() }] });
                setFParceiro({ nome: "", tipo: "Apoiador", detalhe: "", nivel: "BRONZE", logo: "", link: "" });
              }}
              className="press w-full rounded-xl bg-red-600 py-2.5 text-sm font-extrabold"
            >
              ADICIONAR PARCEIRO
            </button>
            {site.parceiros.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl bg-black/30 p-2 ring-1 ring-white/10">
                <FotoBtn foto={p.logo ?? ""} nome={p.nome} onChange={(v) => site.update({ parceiros: site.parceiros.map((x) => (x.id === p.id ? { ...x, logo: v } : x)) })} />
                <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-extrabold">{p.nivel}</span>
                <p className="min-w-0 flex-1 truncate text-xs"><b>{p.nome}</b> — {p.tipo}</p>
                <Del onClick={() => site.update({ parceiros: site.parceiros.filter((x) => x.id !== p.id) })} />
              </div>
            ))}
          </Sec>
        )}

        {aba === "captacao" && (
          <Sec title="Projeto de captação" sub="Valores e patrocinadores confirmados.">
            <Field value={site.projeto.titulo} onChange={(e) => site.update({ projeto: { ...site.projeto, titulo: e.target.value.toUpperCase() } })} placeholder="Título" />
            <Field value={site.projeto.subtitulo} onChange={(e) => site.update({ projeto: { ...site.projeto, subtitulo: e.target.value.toUpperCase() } })} placeholder="Subtítulo" />
            <div className="grid grid-cols-2 gap-2">
              <Field value={site.projeto.valorTotal} onChange={(e) => site.update({ projeto: { ...site.projeto, valorTotal: e.target.value } })} placeholder="Valor total" />
              <Field value={site.projeto.captado} onChange={(e) => site.update({ projeto: { ...site.projeto, captado: e.target.value } })} placeholder="Captado" />
              <Field value={site.projeto.aCaptar} onChange={(e) => site.update({ projeto: { ...site.projeto, aCaptar: e.target.value } })} placeholder="A captar" />
              <Field value={site.projeto.percentual} onChange={(e) => site.update({ projeto: { ...site.projeto, percentual: e.target.value } })} placeholder="% — ex: 11,71%" />
            </div>
            <p className="text-xs font-bold text-zinc-400">Confirmados (edite nome/valor direto):</p>
            {site.projeto.confirmados.map((c, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
                <Field value={c.nome} onChange={(e) => site.update({ projeto: { ...site.projeto, confirmados: site.projeto.confirmados.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) } })} />
                <Field value={c.valor} onChange={(e) => site.update({ projeto: { ...site.projeto, confirmados: site.projeto.confirmados.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)) } })} />
                <button onClick={() => site.update({ projeto: { ...site.projeto, confirmados: site.projeto.confirmados.filter((_, j) => j !== i) } })} className="rounded-xl bg-red-600/15 px-3 text-xs font-bold text-red-400 ring-1 ring-red-600/30">X</button>
              </div>
            ))}
            <button onClick={() => site.update({ projeto: { ...site.projeto, confirmados: [...site.projeto.confirmados, { nome: "NOVO", detalhe: "Apoiador", valor: "—" }] } })} className="press w-full rounded-xl bg-white/5 py-2.5 text-xs font-bold ring-1 ring-white/10">
              + Adicionar confirmado
            </button>
          </Sec>
        )}

        {aba === "documentos" && (
          <Sec title="Documentos" sub="Transparência do clube.">
            <Field value={fDoc.nome} onChange={(e) => setFDoc({ nome: e.target.value })} placeholder="Nome — ex: Estatuto 2026" />
            <button
              onClick={() => {
                if (!fDoc.nome.trim()) return alert("Informe o nome.");
                site.update({ documentos: [...site.documentos, { id: uid(), nome: fDoc.nome, atualizado: "hoje", tamanho: "1.0 MB" }] });
                setFDoc({ nome: "" });
              }}
              className="press w-full rounded-xl bg-red-600 py-2.5 text-sm font-extrabold"
            >
              ADICIONAR DOCUMENTO
            </button>
            {site.documentos.map((d) => (
              <div key={d.id} className="flex items-center gap-2 rounded-xl bg-black/30 p-2 ring-1 ring-white/10">
                <p className="min-w-0 flex-1 truncate text-xs font-bold">{d.nome}</p>
                <Del onClick={() => site.update({ documentos: site.documentos.filter((x) => x.id !== d.id) })} />
              </div>
            ))}
          </Sec>
        )}

        {aba === "avisos" && (
          <Sec title="Avisos / Notificações" sub="Publicar dispara badge no app.">
            <Field value={fAviso.titulo} onChange={(e) => setFAviso({ titulo: e.target.value })} placeholder="Ex: Jogo domingo às 15:30!" />
            <button
              onClick={() => {
                if (!fAviso.titulo.trim()) return alert("Escreva o aviso.");
                site.update({ notificacoes: [{ id: uid(), titulo: fAviso.titulo, data: "agora", lida: false }, ...site.notificacoes] });
                setFAviso({ titulo: "" });
              }}
              className="press w-full rounded-xl bg-red-600 py-2.5 text-sm font-extrabold"
            >
              PUBLICAR AVISO
            </button>
            {site.notificacoes.map((n) => (
              <div key={n.id} className="flex items-center gap-2 rounded-xl bg-black/30 p-2 ring-1 ring-white/10">
                <p className="min-w-0 flex-1 truncate text-xs">{n.titulo} <span className="text-zinc-500">• {n.data}</span></p>
                <Del onClick={() => site.update({ notificacoes: site.notificacoes.filter((x) => x.id !== n.id) })} />
              </div>
            ))}
          </Sec>
        )}

        {aba === "pin" && (
          site.cloud ? (
            <Sec title="Conta da diretoria" sub="Login Firebase — só quem tem conta edita o clube.">
              <div className="flex items-center gap-3 rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/15 text-sm font-extrabold text-gold-400 ring-1 ring-gold-500/40">
                  {(auth.user?.email ?? "?")[0].toUpperCase()}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-bold">{auth.user?.email}</p>
              </div>
              <Field value={novaSenha} type="password" autoComplete="new-password" onChange={(e) => setNovaSenha(e.target.value)} placeholder="Nova senha (mínimo 6 caracteres)" />
              <button
                onClick={() => {
                  if (novaSenha.length < 6) return alert("Senha precisa de ao menos 6 caracteres.");
                  void auth.trocarSenha(novaSenha).then(() => { setNovaSenha(""); alert("Senha atualizada!"); }).catch(() => alert("Saia e entre de novo antes de trocar a senha."));
                }}
                className="press w-full rounded-xl bg-white/5 py-2.5 text-xs font-bold ring-1 ring-white/10"
              >
                TROCAR SENHA
              </button>
              <button
                onClick={() => void auth.logout()}
                className="press w-full rounded-xl bg-red-600 py-2.5 text-sm font-extrabold"
              >
                SAIR DO PAINEL
              </button>
            </Sec>
          ) : (
            <Sec title="PIN de acesso" sub="Código para abrir o painel ADM (4 dígitos).">
              <Field value={fPin} inputMode="numeric" maxLength={4} onChange={(e) => setFPin(e.target.value.replace(/\D/g, ""))} placeholder={`Atual: ${site.pin}`} />
              <button
                onClick={() => {
                  if (fPin.length < 4) return alert("PIN precisa de 4 dígitos.");
                  site.update({ pin: fPin });
                  setFPin("");
                  alert("PIN atualizado!");
                }}
                className="press w-full rounded-xl bg-red-600 py-2.5 text-sm font-extrabold"
              >
                TROCAR PIN
              </button>
            </Sec>
          )
        )}
      </div>
    </div>
  );
}
