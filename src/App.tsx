import { useEffect, useMemo, useState } from "react";
import { Icon, Shield } from "./components/brand";
import Admin, { GRUPOS_ADM, MENU_ADM, type Aba as AbaAdm } from "./pages/Admin";
import { RouteErrorBoundary } from "./components/ErrorBoundary";
import { useSite } from "./store/site";
import { authErroPt, useAuth } from "./store/auth";
import type { Route as MockRoute } from "./data/mock";

type Route = MockRoute | "adm";

const MENU: { id: Route; label: string; icon: Parameters<typeof Icon>[0]["name"]; grupo: string }[] = [
  { id: "inicio", label: "Início", icon: "home", grupo: "CLUBE" },
  { id: "atletas", label: "Atletas", icon: "users", grupo: "CLUBE" },
  { id: "agenda", label: "Agenda", icon: "calendar", grupo: "CLUBE" },
  { id: "jogos", label: "Jogos", icon: "trophy", grupo: "CLUBE" },
  { id: "noticias", label: "Notícias", icon: "news", grupo: "CLUBE" },
  { id: "galeria", label: "Galeria", icon: "gallery", grupo: "CLUBE" },
  { id: "parceiros", label: "Parceiros", icon: "handshake", grupo: "APOIO" },
  { id: "projetos", label: "Projetos e Captação", icon: "chart", grupo: "APOIO" },
  { id: "documentos", label: "Documentos", icon: "folder", grupo: "APOIO" },
  { id: "notificacoes", label: "Notificações", icon: "bell", grupo: "SUPORTE" },
  { id: "fale", label: "Fale Conosco", icon: "chat", grupo: "SUPORTE" },
  { id: "config", label: "Configurações", icon: "gear", grupo: "SUPORTE" },
  { id: "adm", label: "Administração", icon: "shield", grupo: "SUPORTE" },
];

const TITULOS: Record<Route, { titulo: string; sub: string }> = {
  inicio: { titulo: "SPARTAX", sub: "ASSOCIAÇÃO DESPORTIVA" },
  atletas: { titulo: "ATLETAS", sub: "ELENCO OFICIAL • SUB-15" },
  agenda: { titulo: "AGENDA", sub: "JOGOS & TREINOS" },
  jogos: { titulo: "JOGOS", sub: "TEMPORADA 2026" },
  noticias: { titulo: "NOTÍCIAS", sub: "DO CLUBE" },
  galeria: { titulo: "GALERIA", sub: "FOTOS & VÍDEOS" },
  parceiros: { titulo: "PARCEIROS", sub: "QUEM APOIA O SPARTAX" },
  projetos: { titulo: "CAPTAÇÃO", sub: "LEI DE INCENTIVO AO ESPORTE" },
  documentos: { titulo: "DOCUMENTOS", sub: "TRANSPARÊNCIA" },
  notificacoes: { titulo: "NOTIFICAÇÕES", sub: "AVISOS DO CLUBE" },
  fale: { titulo: "FALE CONOSCO", sub: "ATENDIMENTO" },
  config: { titulo: "AJUSTES", sub: "PREFERÊNCIAS DO APP" },
  adm: { titulo: "ADM", sub: "PAINEL DO CLUBE" },
};

function idadeDe(nasc: string): string {
  const m = nasc.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return "—";
  const nd = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const hoje = new Date();
  let idade = hoje.getFullYear() - nd.getFullYear();
  if (hoje.getMonth() < nd.getMonth() || (hoje.getMonth() === nd.getMonth() && hoje.getDate() < nd.getDate())) idade--;
  return `${idade} anos`;
}

function setorDe(posicao: string): "GOL" | "DEF" | "MEI" | "ATA" | "—" {
  const p = posicao.toLowerCase();
  if (/goleiro/.test(p)) return "GOL";
  if (/zagueiro|lateral/.test(p)) return "DEF";
  if (/volante|meia/.test(p)) return "MEI";
  if (/atacante|ponta|centroavante/.test(p)) return "ATA";
  return "—";
}

function iniciais(nome: string): string {
  return nome.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

const MESES_PT = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const MESES_NOME = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function mesIdx(mes: string): number {
  const i = MESES_PT.indexOf(mes.toUpperCase().slice(0, 3));
  return i < 0 ? new Date().getMonth() : i;
}

function splitDetalhe(detalhe: string): [string, string] {
  const p = detalhe.split("—");
  if (p.length < 2) return [detalhe, ""];
  return [p[0].trim(), p.slice(1).join("—").trim()];
}

function dataEvento(e: { dia: string; mes: string; ano?: string }, anoPadrao: number): Date {
  return new Date(Number(e.ano) || anoPadrao, mesIdx(e.mes), Number(e.dia) || 1);
}

function diasAte(data: Date): number {
  const h = new Date();
  h.setHours(0, 0, 0, 0);
  const t = new Date(data);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - h.getTime()) / 86400000);
}

function textoCountdown(diff: number): string {
  if (diff === 0) return "É HOJE";
  if (diff === 1) return "AMANHÃ";
  if (diff > 1) return `EM ${diff} DIAS`;
  if (diff === -1) return "ONTEM";
  return `HÁ ${Math.abs(diff)} DIAS`;
}

/** Lê "25 de maio de 2026" + "15:30" e devolve a Date (ou null). */
function parseDataJogo(data: string, hora: string): Date | null {
  const m = data.match(/(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})/i);
  if (!m) return null;
  const meses = ["janeiro", "fevereiro", "março", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const mi = meses.indexOf(m[2].toLowerCase());
  if (mi < 0) return null;
  const [h, min] = hora.split(":").map(Number);
  return new Date(Number(m[3]), mi, Number(m[1]), h || 0, min || 0);
}

function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-sparta-500" />
        <h3 className="font-display text-lg font-bold italic tracking-wide">{title}</h3>
      </div>
      {action && (
        <button onClick={onAction} className="press flex items-center gap-0.5 text-[11px] font-bold tracking-wider text-zinc-400">
          {action} <Icon name="chevron" size={14} />
        </button>
      )}
    </div>
  );
}

/** Escudo dinâmico: usa imagem oficial se cadastrada no ADM, senão SVG com cores/nome do clube. */
function Crest({ size }: { size: number }) {
  const { escudo } = useSite();
  if (escudo.imagemUrl) {
    return (
      <img
        src={escudo.imagemUrl}
        alt={`Escudo ${escudo.nome}`}
        width={size}
        height={size}
        className="rounded-full bg-white object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return <Shield size={size} primaria={escudo.primaria} secundaria={escudo.secundaria} nome={escudo.nome} />;
}

/** Porta do ADM: login Firebase (nuvem) ou PIN (modo local). */
function AdmArea({ onExit, pinOk, setPinOk, adminAba, setAdminAba }: {
  onExit: () => void;
  pinOk: boolean;
  setPinOk: (v: boolean) => void;
  adminAba: AbaAdm;
  setAdminAba: (a: AbaAdm) => void;
}) {
  const site = useSite();
  const auth = useAuth();
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }
    setBusy(true);
    setErro("");
    try {
      await auth.login(email, senha);
    } catch (e) {
      setErro(authErroPt((e as { code?: string })?.code ?? ""));
    } finally {
      setBusy(false);
    }
  }

  // Sem Firebase: trava local por PIN
  if (!site.cloud) {
    if (pinOk) return <Admin onExit={onExit} aba={adminAba} setAba={setAdminAba} />;
    return (
      <div className="p-4">
        <div className="carbon-texture rounded-3xl bg-[#151517] p-6 text-center ring-1 ring-gold-500/30">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/40">
            <Icon name="shield" size={26} />
          </span>
          <p className="font-display mt-3 text-2xl font-extrabold italic">ÁREA RESTRITA</p>
          <p className="mt-1 text-xs text-zinc-400">Digite o PIN de administração (padrão: 1234).</p>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onKeyDown={(e) => { if (e.key === "Enter" && pin === site.pin) { setPinOk(true); setPin(""); } }}
            inputMode="numeric"
            type="password"
            placeholder="••••"
            className="mx-auto mt-4 w-40 rounded-2xl bg-black/50 p-3 text-center text-2xl font-extrabold tracking-[0.5em] outline-none ring-1 ring-white/15 placeholder:text-zinc-700 focus:ring-gold-500"
          />
          <button
            onClick={() => {
              if (pin === site.pin) { setPinOk(true); setPin(""); }
              else alert("PIN incorreto.");
            }}
            className="press mt-3 w-full rounded-2xl bg-gold-500 py-3 text-sm font-extrabold text-black"
          >
            DESBLOQUEAR PAINEL
          </button>
        </div>
      </div>
    );
  }

  if (auth.loading) {
    return (
      <div className="p-4">
        <div className="rounded-3xl bg-[#151517] p-10 text-center ring-1 ring-white/10">
          <p className="font-display text-xl font-bold italic tracking-wide">VERIFICANDO SESSÃO...</p>
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="p-4">
        <div className="carbon-texture rounded-3xl bg-[#151517] p-6 ring-1 ring-gold-500/30">
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/40">
              <Icon name="shield" size={26} />
            </span>
            <p className="font-display mt-3 text-2xl font-extrabold italic">LOGIN DO CLUBE</p>
            <p className="mt-1 text-xs text-zinc-400">Acesso da diretoria — conta criada no Firebase.</p>
          </div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void entrar(); }}
            inputMode="email"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="E-mail da diretoria"
            className="mt-4 w-full rounded-xl bg-black/40 p-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-gold-500"
          />
          <input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void entrar(); }}
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
            className="mt-2 w-full rounded-xl bg-black/40 p-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-gold-500"
          />
          {erro && <p className="mt-2 rounded-xl bg-red-600/15 p-2.5 text-center text-xs font-bold text-red-300 ring-1 ring-red-600/30">{erro}</p>}
          <button
            onClick={() => void entrar()}
            disabled={busy}
            className="press mt-3 w-full rounded-2xl bg-gold-500 py-3 text-sm font-extrabold text-black disabled:opacity-60"
          >
            {busy ? "ENTRANDO..." : "ENTRAR NO PAINEL"}
          </button>
        </div>
      </div>
    );
  }

  return <Admin onExit={onExit} aba={adminAba} setAba={setAdminAba} />;
}

export default function App() {
  const site = useSite();
  const auth = useAuth();
  const [pinOk, setPinOk] = useState(false);
  const [adminAba, setAdminAba] = useState<AbaAdm>("geral");
  const [route, setRoute] = useState<Route>("inicio");
  const [drawer, setDrawer] = useState(false);
  const [splash, setSplash] = useState(true);
  const [busca, setBusca] = useState("");
  const [atletaSel, setAtletaSel] = useState<string | null>(null);
  const [filtroSetor, setFiltroSetor] = useState<"TODOS" | "GOL" | "DEF" | "MEI" | "ATA">("TODOS");
  const [ordem, setOrdem] = useState<"numero" | "gols">("numero");
  const [calAno, setCalAno] = useState(() => new Date().getFullYear());
  const [calMes, setCalMes] = useState(() => new Date().getMonth());
  const [diaSel, setDiaSel] = useState<number | null>(() => new Date().getDate());
  const [filtroEv, setFiltroEv] = useState<"TODOS" | "JOGO" | "TREINO">("TODOS");
  const [evAberto, setEvAberto] = useState<string | null>(null);
  const [notCat, setNotCat] = useState("TODAS");
  const [notSel, setNotSel] = useState<string | null>(null);
  const [parcSel, setParcSel] = useState<string | null>(null);
  const [luz, setLuz] = useState<number | null>(null);
  const [aba, setAba] = useState<"FOTOS" | "VÍDEOS">("FOTOS");

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const lista = useMemo(() => {
    const q = busca.toLowerCase();
    return site.atletas
      .filter((a) => a.nome.toLowerCase().includes(q) && (filtroSetor === "TODOS" || setorDe(a.posicao) === filtroSetor))
      .sort((x, y) => (ordem === "gols" ? (y.gols ?? 0) - (x.gols ?? 0) : x.numero - y.numero));
  }, [site.atletas, busca, filtroSetor, ordem]);
  const artilheiros = useMemo(
    () => [...site.atletas].sort((x, y) => (y.gols ?? 0) - (x.gols ?? 0)).slice(0, 3),
    [site.atletas]
  );
  const midias = useMemo(
    () => site.galeria.filter((g) => (aba === "FOTOS" ? g.tipo === "FOTO" : g.tipo === "VIDEO")),
    [site.galeria, aba]
  );
  const naoLidas = site.notificacoes.filter((n) => !n.lida).length;
  const hero = site.heroImagem;
  const head = TITULOS[route];
  const nomeClube = site.escudo.nome;
  const percWidth = Math.min(100, Math.max(0, parseFloat(site.projeto.percentual.replace(",", ".")) || 0));
  const pjDiff = useMemo(() => {
    const d = parseDataJogo(site.proximoJogo.data, site.proximoJogo.hora);
    return d ? diasAte(d) : null;
  }, [site.proximoJogo.data, site.proximoJogo.hora]);

  function go(r: Route) {
    setRoute(r);
    setDrawer(false);
    setAtletaSel(null);
    setNotSel(null);
    setParcSel(null);
  }

  function goAdm(a: AbaAdm) {
    setAdminAba(a);
    setRoute("adm");
    setDrawer(false);
    setAtletaSel(null);
  }

  /** Logado no painel? Aí o menu lateral vira o menu do ADM. */
  const admAtivo = route === "adm" && (site.cloud ? auth.user != null : pinOk);

  function marcarLida(id: string) {
    site.update({ notificacoes: site.notificacoes.map((n) => (n.id === id ? { ...n, lida: true } : n)) });
  }

  if (splash) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center overflow-hidden bg-black px-8 text-center">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-sparta-900/70 to-black" />
        <div className="absolute inset-0 stripe-texture opacity-60" />
        <div className="relative">
          <div className="gold-ring mx-auto w-fit rounded-full">
            <Crest size={148} />
          </div>
          <p className="mt-7 text-[11px] font-bold tracking-[0.45em] text-gold-400">APP OFICIAL</p>
          <h1 className="font-display mt-1 text-6xl font-extrabold italic leading-none tracking-tight">
            {nomeClube}
          </h1>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
          <p className="mt-4 text-[11px] font-semibold tracking-[0.25em] text-zinc-300">
            TRADIÇÃO • FAMÍLIA
            <br />
            DISCIPLINA • RESPEITO
          </p>
          <div className="mx-auto mt-8 h-1 w-36 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-sparta-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-x-clip bg-[#0B0B0C] shadow-2xl ring-1 ring-zinc-800/60 md:mx-0 md:max-w-none md:ring-0">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b-2 border-sparta-600 bg-[#0B0B0C]/95 backdrop-blur">
        <div className="flex items-center justify-between px-2 py-2 md:px-6">
          {route === "inicio" ? (
            <button onClick={() => setDrawer(true)} className="press rounded-lg p-2.5 md:hidden" aria-label="Menu">
              <Icon name="menu" size={22} />
            </button>
          ) : (
            <button onClick={() => go("inicio")} className="press rounded-lg p-2.5" aria-label="Voltar">
              <Icon name="back" size={22} />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <Crest size={34} />
            <div className="leading-none">
              <p className="font-display text-xl font-extrabold italic tracking-wide">{route === "inicio" ? nomeClube : head.titulo}</p>
              <p className="text-[9px] font-bold tracking-[0.22em] text-zinc-400">{head.sub}</p>
            </div>
          </div>
          <button onClick={() => go("notificacoes")} className="press relative rounded-lg p-2.5" aria-label="Notificações">
            <Icon name="bell" size={22} />
            {naoLidas > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sparta-500 px-1 text-[10px] font-extrabold">
                {naoLidas}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* DRAWER */}
      {drawer && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDrawer(false)} />
          <aside className="absolute left-1/2 top-0 h-full w-full max-w-[430px] -translate-x-1/2">
            <div className="carbon-texture flex h-full w-[86%] flex-col bg-[#111113]">
              <div className="relative overflow-hidden">
                <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[#111113]/60 to-transparent" />
                <div className="relative flex items-center gap-3 p-5 pb-6">
                  <Crest size={56} />
                  <div>
                    <p className="font-display text-2xl font-extrabold italic leading-none">{admAtivo ? "PAINEL ADM" : nomeClube}</p>
                    <p className="text-[10px] font-bold tracking-[0.25em] text-zinc-300">{admAtivo ? "GERENCIAR CLUBE" : "ASSOCIAÇÃO DESPORTIVA"}</p>
                    {!admAtivo && (
                    <p className="mt-1.5 w-fit rounded-full bg-gold-500/15 px-2.5 py-0.5 text-[10px] font-bold text-gold-400 ring-1 ring-gold-500/40">
                      SÓCIO TORCEDOR • 2026
                    </p>
                    )}
                  </div>
                </div>
              </div>
              {admAtivo ? (
              <>
              <button
                onClick={() => go("inicio")}
                className="press mx-2 mt-2 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-left text-[13px] font-bold text-zinc-300 ring-1 ring-white/10"
              >
                <Icon name="back" size={18} /> Voltar ao app
              </button>
              <nav className="flex-1 overflow-y-auto px-2 py-2">
                {GRUPOS_ADM.map((g) => (
                  <div key={g} className="mt-1">
                    <p className="px-3 pb-1 pt-3 text-[10px] font-extrabold tracking-[0.25em] text-zinc-500">{g === "FUTEBOL" ? "COMPETIÇÃO" : g}</p>
                    {MENU_ADM.filter((m) => m.grupo === g).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => goAdm(m.id)}
                        className={`press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] ${
                          adminAba === m.id ? "bg-gold-500/15 font-bold text-white" : "text-zinc-300"
                        }`}
                      >
                        <span className={adminAba === m.id ? "text-gold-400" : "text-zinc-500"}>
                          <Icon name={m.icon} size={20} />
                        </span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
              <div className="border-t border-white/10 p-4">
                {site.cloud ? (
                  <button
                    onClick={() => { void auth.logout().then(() => go("inicio")); }}
                    className="press w-full rounded-xl bg-red-600/15 py-2.5 text-xs font-extrabold text-red-300 ring-1 ring-red-600/30"
                  >
                    SAIR DO PAINEL
                  </button>
                ) : (
                  <p className="font-display text-center text-lg font-bold italic tracking-wide">
                    SOMOS TODOS <span className="text-sparta-400">{nomeClube}</span>
                  </p>
                )}
              </div>
              </>
              ) : (
              <>
              <nav className="flex-1 overflow-y-auto px-2 pb-2">
                {(["CLUBE", "APOIO", "SUPORTE"] as const).map((g) => (
                  <div key={g} className="mt-1">
                    <p className="px-3 pb-1 pt-3 text-[10px] font-extrabold tracking-[0.25em] text-zinc-500">{g}</p>
                    {MENU.filter((m) => m.grupo === g).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => go(m.id)}
                        className={`press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] ${
                          route === m.id ? "bg-sparta-600/15 font-bold text-white" : "text-zinc-300"
                        }`}
                      >
                        <span className={route === m.id ? "text-sparta-400" : "text-zinc-500"}>
                          <Icon name={m.icon} size={20} />
                        </span>
                        {m.label}
                        {m.id === "notificacoes" && naoLidas > 0 && (
                          <span className="ml-auto rounded-full bg-sparta-500 px-2 py-0.5 text-[10px] font-extrabold">
                            {naoLidas}
                          </span>
                        )}
                        {m.id === "adm" && (
                          <span className="ml-auto rounded-md bg-gold-500/15 px-2 py-0.5 text-[10px] font-extrabold text-gold-400 ring-1 ring-gold-500/40">
                            {site.cloud ? "LOGIN" : "PIN"}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
              <div className="border-t border-white/10 p-4">
                <p className="font-display text-center text-lg font-bold italic tracking-wide">
                  SOMOS TODOS <span className="text-sparta-400">{nomeClube}</span>
                </p>
                <p className="mt-0.5 text-center text-[10px] tracking-[0.2em] text-zinc-500">v1.0 • WEB + MOBILE</p>
              </div>
              </>
              )}
            </div>
          </aside>
        </div>
      )}

      <div className="md:flex md:flex-1 md:items-start">
        {/* Sidebar fixa — só no desktop */}
        <aside className="carbon-texture hidden w-72 shrink-0 flex-col border-r border-white/10 bg-[#111113] md:sticky md:top-[60px] md:flex md:h-[calc(100dvh-60px)]">
          <div className="flex items-center gap-3 border-b border-white/10 p-5">
            <Crest size={48} />
            <div>
              <p className="font-display text-xl font-extrabold italic leading-none">{admAtivo ? "PAINEL ADM" : nomeClube}</p>
              <p className="text-[9px] font-bold tracking-[0.25em] text-zinc-400">{admAtivo ? "GERENCIAR CLUBE" : "ASSOCIAÇÃO DESPORTIVA"}</p>
            </div>
          </div>
          {admAtivo ? (
            <>
              <button
                onClick={() => go("inicio")}
                className="press mx-2 mt-2 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-left text-[13px] font-bold text-zinc-300 ring-1 ring-white/10"
              >
                <Icon name="back" size={18} /> Voltar ao app
              </button>
              <nav className="flex-1 overflow-y-auto px-2 py-2">
                {GRUPOS_ADM.map((g) => (
                  <div key={g} className="mt-1">
                    <p className="px-3 pb-1 pt-3 text-[10px] font-extrabold tracking-[0.25em] text-zinc-500">{g === "FUTEBOL" ? "COMPETIÇÃO" : g}</p>
                    {MENU_ADM.filter((m) => m.grupo === g).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => goAdm(m.id)}
                        className={`press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] ${
                          adminAba === m.id ? "bg-gold-500/15 font-bold text-white" : "text-zinc-300"
                        }`}
                      >
                        <span className={adminAba === m.id ? "text-gold-400" : "text-zinc-500"}>
                          <Icon name={m.icon} size={20} />
                        </span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
              <div className="border-t border-white/10 p-4">
                {site.cloud ? (
                  <button
                    onClick={() => { void auth.logout().then(() => go("inicio")); }}
                    className="press w-full rounded-xl bg-red-600/15 py-2.5 text-xs font-extrabold text-red-300 ring-1 ring-red-600/30"
                  >
                    SAIR DO PAINEL
                  </button>
                ) : (
                  <p className="font-display text-center text-base font-bold italic tracking-wide">
                    SOMOS TODOS <span className="text-sparta-400">{nomeClube}</span>
                  </p>
                )}
              </div>
            </>
          ) : (
          <>
          <nav className="flex-1 overflow-y-auto px-2 py-2">
            {(["CLUBE", "APOIO", "SUPORTE"] as const).map((g) => (
              <div key={g} className="mt-1">
                <p className="px-3 pb-1 pt-3 text-[10px] font-extrabold tracking-[0.25em] text-zinc-500">{g}</p>
                {MENU.filter((m) => m.grupo === g).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => go(m.id)}
                    className={`press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] ${
                      route === m.id ? "bg-sparta-600/15 font-bold text-white" : "text-zinc-300"
                    }`}
                  >
                    <span className={route === m.id ? "text-sparta-400" : "text-zinc-500"}>
                      <Icon name={m.icon} size={20} />
                    </span>
                    {m.label}
                    {m.id === "notificacoes" && naoLidas > 0 && (
                      <span className="ml-auto rounded-full bg-sparta-500 px-2 py-0.5 text-[10px] font-extrabold">
                        {naoLidas}
                      </span>
                    )}
                    {m.id === "adm" && (
                      <span className="ml-auto rounded-md bg-gold-500/15 px-2 py-0.5 text-[10px] font-extrabold text-gold-400 ring-1 ring-gold-500/40">
                        {site.cloud ? "LOGIN" : "PIN"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="border-t border-white/10 p-4">
            <p className="font-display text-center text-base font-bold italic tracking-wide">
              SOMOS TODOS <span className="text-sparta-400">{nomeClube}</span>
            </p>
          </div>
          </>
          )}
        </aside>

        <div className="min-w-0 flex-1">
      <main className="min-w-0 flex-1 pb-28 md:pb-10 md:[&>div]:mx-auto md:[&>div]:w-full md:[&>div]:max-w-7xl md:[&>div]:px-8">
      <RouteErrorBoundary key={route} route={route} onHome={() => go("inicio")}>
        {route === "adm" && <AdmArea onExit={() => go("inicio")} pinOk={pinOk} setPinOk={setPinOk} adminAba={adminAba} setAdminAba={setAdminAba} />}

        {route === "inicio" && (
          <div>
            {/* HERO */}
            <div className="relative overflow-hidden">
              <img src={hero} alt="Estádio" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-sparta-900/60 to-[#0B0B0C]" />
              <div className="absolute inset-0 stripe-texture opacity-50" />
              <div className="relative px-5 pb-5 pt-6 text-center">
                <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-extrabold tracking-[0.25em] text-gold-400 ring-1 ring-gold-500/50">
                  TEMPORADA 2026
                </span>
                <div className="mx-auto mt-4 w-fit rounded-full bg-black/30 p-1">
                  <Crest size={104} />
                </div>
                <h2 className="font-display mt-3 text-4xl font-extrabold italic leading-[0.95]">
                  BEM-VINDO AO
                  <br />
                  {nomeClube}
                </h2>
                <p className="mx-auto mt-1 max-w-[280px] text-xs text-zinc-300">
                  Tudo do clube na palma da mão: jogos, elenco, notícias e projetos.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    [String(site.atletas.length).padStart(2, "0"), "ATLETAS"],
                    [String(site.eventos.length).padStart(2, "0"), "EVENTOS"],
                    [String(site.parceiros.length).padStart(2, "0"), "PARCEIROS"],
                  ].map(([n, l]) => (
                    <div key={l} className="rounded-2xl bg-white/[0.07] p-2.5 ring-1 ring-white/10 backdrop-blur">
                      <p className="font-display text-2xl font-extrabold italic leading-none">{n}</p>
                      <p className="mt-0.5 text-[9px] font-bold tracking-[0.2em] text-zinc-400">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PRÓXIMO JOGO */}
            <div className="px-4 md:px-8">
              <div className="card-shadow relative -mt-1 overflow-hidden rounded-3xl bg-[#0d0d0f] ring-1 ring-white/10">
                <div className="h-2 bg-[repeating-linear-gradient(-45deg,#C8102E_0_16px,#0d0d0f_16px_32px)]" />
                <div className="relative px-4 pb-4 pt-4">
                  <img src={hero} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-25" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-sparta-900/50 to-[#0d0d0f]" />
                  <div className="relative text-center">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-extrabold tracking-[0.2em] text-sparta-400">
                        PRÓXIMO JOGO • {site.proximoJogo.competicao || "AMISTOSO"}
                      </p>
                      <p className="text-[10px] font-bold text-zinc-400">{site.proximoJogo.rodada}</p>
                    </div>
                    <h3 className="font-display mt-1 text-4xl font-extrabold italic leading-none tracking-wide">
                      CONFRONTO
                    </h3>
                    {pjDiff != null && pjDiff >= 0 && (
                      <p className="mx-auto mt-2 w-fit rounded-full bg-gold-500/15 px-3 py-1 text-[10px] font-extrabold tracking-[0.2em] text-gold-400 ring-1 ring-gold-500/40">
                        {pjDiff === 0 ? "É HOJE" : pjDiff === 1 ? "AMANHÃ" : `FALTAM ${pjDiff} DIAS`}
                      </p>
                    )}
                    <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
                      <div className="rounded-2xl bg-white px-2 py-3 text-center">
                        <div className="flex justify-center">
                          {site.proximoJogo.casaEscudo ? (
                            <img src={site.proximoJogo.casaEscudo} alt={site.proximoJogo.casa} className="h-16 w-16 object-contain" />
                          ) : (
                            <Crest size={64} />
                          )}
                        </div>
                        <p className="font-display mt-1.5 truncate text-lg font-extrabold italic leading-tight text-zinc-900">{site.proximoJogo.casa}</p>
                        <p className="text-[9px] font-bold tracking-[0.2em] text-zinc-500">CASA</p>
                      </div>
                      <div className="flex items-center">
                        <span className="font-display flex h-11 w-11 items-center justify-center rounded-full bg-sparta-600 text-base font-extrabold italic shadow-lg">VS</span>
                      </div>
                      <div className="rounded-2xl bg-white px-2 py-3 text-center">
                        <div className="flex justify-center">
                          {site.proximoJogo.foraEscudo ? (
                            <img src={site.proximoJogo.foraEscudo} alt={site.proximoJogo.fora} className="h-16 w-16 object-contain" />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
                              <span className="font-display text-lg font-extrabold italic text-white">
                                {site.proximoJogo.fora.split(" ").map((p) => p[0]).join("").slice(0, 3)}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="font-display mt-1.5 truncate text-lg font-extrabold italic leading-tight text-zinc-900">{site.proximoJogo.fora}</p>
                        <p className="text-[9px] font-bold tracking-[0.2em] text-zinc-500">VISITANTE</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl bg-sparta-600 px-4 py-2.5">
                      <span className="font-display text-base font-extrabold italic">{site.proximoJogo.data}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.proximoJogo.local)}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir no mapa"
                        className="truncate text-center text-xs font-bold underline-offset-2 hover:underline"
                      >
                        {site.proximoJogo.local}
                      </a>
                      <span className="font-display text-base font-extrabold italic">{site.proximoJogo.hora}</span>
                    </div>
                    {site.proximoJogo.info && (
                      <p className="relative mt-2 rounded-xl bg-gold-500/10 px-3 py-2 text-center text-[11px] font-semibold text-gold-400 ring-1 ring-gold-500/30">
                        {site.proximoJogo.info}
                      </p>
                    )}
                  </div>
                </div>
                <div className="relative flex gap-2 p-3 pt-0">
                  <button onClick={() => go("agenda")} className="press flex flex-1 items-center justify-center gap-1 rounded-2xl bg-sparta-600 py-3 text-[13px] font-extrabold tracking-wide text-white">
                    VER AGENDA COMPLETA <Icon name="chevron" size={16} />
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`PRÓXIMO CONFRONTO: ${site.proximoJogo.casa} x ${site.proximoJogo.fora} — ${site.proximoJogo.data} às ${site.proximoJogo.hora} • ${site.proximoJogo.local}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Compartilhar confronto"
                    aria-label="Compartilhar confronto"
                    className="press flex w-[52px] shrink-0 items-center justify-center rounded-2xl bg-green-700"
                  >
                    <Icon name="chat" size={19} />
                  </a>
                </div>
              </div>

              {/* NOTÍCIAS */}
              <div className="mt-6">
                <SectionHead title="ÚLTIMAS NOTÍCIAS" action="VER TODAS" onAction={() => go("noticias")} />
                <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
                  {site.noticias.slice(0, 3).map((n) => (
                    <button key={n.id} onClick={() => go("noticias")} className="press w-60 shrink-0 snap-start overflow-hidden rounded-2xl bg-[#151517] text-left ring-1 ring-white/10 md:w-auto">
                      <div className="relative h-32 bg-zinc-800">
                        <img src={n.imagem} alt="" loading="lazy" className="h-full w-full object-cover" />
                        <span className="absolute left-2 top-2 rounded-md bg-sparta-600 px-2 py-0.5 text-[10px] font-extrabold">
                          {n.categoria.toUpperCase()}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-2 text-[13px] font-semibold leading-snug">{n.titulo}</p>
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-500">
                          <Icon name="clock" size={12} /> {n.data}
                        </p>
                      </div>
                    </button>
                  ))}
                  {site.noticias.length === 0 && (
                    <p className="w-full rounded-2xl bg-[#151517] p-6 text-center text-xs text-zinc-500 ring-1 ring-white/10">
                      Nenhuma notícia publicada ainda.
                    </p>
                  )}
                </div>
              </div>

              {/* ACESSO RÁPIDO */}
              <div className="mt-6 pb-2">
                <SectionHead title="ACESSO RÁPIDO" />
                <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                  {(
                    [
                      ["users", "Elenco", "Ver atletas", "atletas"],
                      ["calendar", "Agenda", "Jogos e treinos", "agenda"],
                      ["handshake", "Parceiros", "Apoie o clube", "parceiros"],
                      ["gallery", "Galeria", "Fotos e vídeos", "galeria"],
                    ] as const
                  ).map(([icon, t, s, id]) => (
                    <button
                      key={id}
                      onClick={() => go(id)}
                      className="press carbon-texture flex items-center gap-3 rounded-2xl bg-[#151517] p-3.5 text-left ring-1 ring-white/10"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sparta-600/15 text-sparta-400">
                        <Icon name={icon} size={20} />
                      </span>
                      <span>
                        <span className="block text-[13px] font-bold">{t}</span>
                        <span className="block text-[11px] text-zinc-500">{s}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {route === "atletas" && (() => {
          const sel = site.atletas.find((a) => a.id === atletaSel);
          if (sel) {
            const stats: [string, string, string][] = [
              ["JOGOS", String(sel.jogos ?? 0), "text-white"],
              ["GOLS", String(sel.gols ?? 0), "text-gold-400"],
              ["ASSIST.", String(sel.assistencias ?? 0), "text-white"],
              ["PARTICIP.", String((sel.gols ?? 0) + (sel.assistencias ?? 0)), "text-white"],
              ["AMARELOS", String(sel.amarelos ?? 0), "text-amber-400"],
              ["VERMELHOS", String(sel.vermelhos ?? 0), "text-red-400"],
            ];
            return (
              <div className="p-4 md:p-8">
                <button onClick={() => setAtletaSel(null)} className="press flex items-center gap-1 text-xs font-extrabold tracking-wider text-zinc-400">
                  <Icon name="back" size={16} /> VOLTAR AO ELENCO
                </button>
                <div className="card-shadow relative mt-3 overflow-hidden rounded-3xl bg-[#151517] ring-1 ring-white/10">
                  <div className="stripe-texture absolute inset-0 opacity-40" />
                  <span className="font-display pointer-events-none absolute -right-2 -top-10 select-none text-[160px] font-extrabold italic leading-none text-white/[0.06]">
                    {sel.numero}
                  </span>
                  <div className="relative flex items-center gap-4 p-5">
                    {sel.foto ? (
                      <img src={sel.foto} alt={sel.nome} className="h-20 w-20 shrink-0 rounded-2xl bg-zinc-800 object-cover ring-2 ring-gold-500/60" />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-600 to-zinc-800 text-2xl font-extrabold ring-1 ring-white/15">
                        {iniciais(sel.nome)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-sparta-600 px-2 py-0.5 font-display text-sm font-extrabold italic">#{sel.numero}</span>
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-zinc-300">{setorDe(sel.posicao)}</span>
                      </div>
                      <p className="font-display mt-1.5 truncate text-3xl font-extrabold italic leading-none tracking-wide">{sel.nome}</p>
                      <p className="mt-1 text-xs text-zinc-400">{sel.posicao} • {idadeDe(sel.nasc)} • Nasc. {sel.nasc}</p>
                    </div>
                  </div>
                  <div className="relative grid grid-cols-3 gap-2 p-4 pt-0">
                    {stats.map(([l, v, c]) => (
                      <div key={l} className="rounded-2xl bg-black/30 p-3 text-center ring-1 ring-white/10">
                        <p className={`font-display text-3xl font-extrabold italic leading-none ${c}`}>{v}</p>
                        <p className="mt-1 text-[9px] font-bold tracking-[0.2em] text-zinc-500">{l}</p>
                      </div>
                    ))}
                  </div>
                  <p className="relative border-t border-white/10 px-4 py-2.5 text-center text-[10px] font-bold tracking-[0.25em] text-zinc-500">
                    TEMPORADA 2026
                  </p>
                </div>
              </div>
            );
          }
          return (
          <div className="p-4 md:p-8">
            <div className="flex items-center gap-2 rounded-2xl bg-[#151517] p-1.5 pl-3 ring-1 ring-white/10">
              <Icon name="search" size={18} className="shrink-0 text-zinc-500" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar atleta por nome..."
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-500"
              />
              <button
                onClick={() => setOrdem((o) => (o === "numero" ? "gols" : "numero"))}
                title="Alternar ordenação"
                className={`press mr-1 flex h-9 shrink-0 items-center gap-1 rounded-xl px-2.5 text-[10px] font-extrabold tracking-wider ${ordem === "gols" ? "bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/40" : "bg-white/5 text-zinc-400"}`}
              >
                <Icon name="filter" size={15} /> {ordem === "gols" ? "GOLS" : "Nº"}
              </button>
            </div>
            <div className="no-scrollbar -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
              {(["TODOS", "GOL", "DEF", "MEI", "ATA"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroSetor(f)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-[11px] font-extrabold tracking-widest ${filtroSetor === f ? "bg-sparta-600 text-white" : "bg-[#151517] text-zinc-500 ring-1 ring-white/10"}`}
                >
                  {f === "TODOS" ? "TODOS" : f === "GOL" ? "GOLEIROS" : f === "DEF" ? "DEFESA" : f === "MEI" ? "MEIO" : "ATAQUE"}
                </button>
              ))}
            </div>
            {busca === "" && filtroSetor === "TODOS" && artilheiros.some((a) => (a.gols ?? 0) > 0) && (
              <div className="mt-3">
                <SectionHead title="ARTILHARIA" />
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {artilheiros.map((a, i) => (
                    <button key={a.id} onClick={() => setAtletaSel(a.id)} className="press carbon-texture rounded-2xl bg-[#151517] p-3 text-center ring-1 ring-white/10">
                      <span className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${i === 0 ? "bg-gold-500 text-black" : i === 1 ? "bg-zinc-300 text-black" : "bg-amber-700 text-white"}`}>
                        {i + 1}
                      </span>
                      <p className="font-display mt-1.5 truncate text-base font-bold italic leading-tight">{a.nome.split(" ")[0]} {a.nome.split(" ")[1] ?? ""}</p>
                      <p className="font-display text-2xl font-extrabold italic leading-none text-gold-400">{a.gols ?? 0} <span className="text-xs not-italic text-zinc-500">gols</span></p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-4 text-[11px] font-bold tracking-[0.2em] text-zinc-500">
              {lista.length} ATLETAS • ELENCO OFICIAL
            </p>
            <div className="mt-2 space-y-2 md:grid md:grid-cols-2 md:gap-2.5 md:space-y-0">
              {lista.map((a) => (
                <button key={a.id} onClick={() => setAtletaSel(a.id)} className="press flex w-full items-center gap-3 rounded-2xl bg-[#151517] p-3 text-left ring-1 ring-white/10">
                  <div className="flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-b from-sparta-500 to-sparta-700">
                    <span className="font-display text-lg font-extrabold italic leading-none text-white">{a.numero}</span>
                  </div>
                  {a.foto ? (
                    <img src={a.foto} alt={a.nome} loading="lazy" className="h-11 w-11 shrink-0 rounded-full bg-zinc-800 object-cover ring-1 ring-white/15" />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-sm font-extrabold ring-1 ring-white/15">
                      {iniciais(a.nome)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-lg font-bold italic leading-tight tracking-wide">{a.nome}</p>
                    <p className="truncate text-xs text-zinc-400">{a.posicao} • {idadeDe(a.nasc)}</p>
                  </div>
                  {(a.gols ?? 0) > 0 && (
                    <span className="shrink-0 rounded-lg bg-gold-500/15 px-2 py-1 text-[11px] font-extrabold text-gold-400 ring-1 ring-gold-500/30">
                      {a.gols} {a.gols === 1 ? "gol" : "gols"}
                    </span>
                  )}
                  <Icon name="chevron" size={18} className="shrink-0 text-zinc-600" />
                </button>
              ))}
              {lista.length === 0 && (
                <p className="rounded-2xl bg-[#151517] p-8 text-center text-sm text-zinc-500 ring-1 ring-white/10">
                  Nenhum atleta encontrado.
                </p>
              )}
            </div>
          </div>
          );
        })()}

        {route === "agenda" && (() => {
          const anoHoje = new Date().getFullYear();
          const hojeD = new Date();
          const ehMesAtual = calAno === hojeD.getFullYear() && calMes === hojeD.getMonth();
          const primeiro = new Date(calAno, calMes, 1).getDay();
          const diasNoMes = new Date(calAno, calMes + 1, 0).getDate();
          const diasAnt = new Date(calAno, calMes, 0).getDate();
          const cells: { dia: number; fora: boolean }[] = [];
          for (let i = primeiro - 1; i >= 0; i--) cells.push({ dia: diasAnt - i, fora: true });
          for (let d = 1; d <= diasNoMes; d++) cells.push({ dia: d, fora: false });
          let proxFill = 1;
          while (cells.length % 7 !== 0) cells.push({ dia: proxFill++, fora: true });

          const porDia = new Map<number, typeof site.eventos>();
          for (const e of site.eventos) {
            if (mesIdx(e.mes) !== calMes || (Number(e.ano) || calAno) !== calAno) continue;
            const arr = porDia.get(Number(e.dia)) ?? [];
            arr.push(e);
            porDia.set(Number(e.dia), arr);
          }
          const dia = diaSel ?? (ehMesAtual ? hojeD.getDate() : 0);
          const evsDia = (porDia.get(dia) ?? []).filter((e) => filtroEv === "TODOS" || e.tipo === filtroEv);
          const futuros = [...site.eventos]
            .map((e) => ({ e, diff: diasAte(dataEvento(e, anoHoje)) }))
            .filter((x) => x.diff >= 0)
            .sort((a, b) => a.diff - b.diff);
          const proxEv = futuros[0];

          function mudaMes(dir: 1 | -1) {
            let m = calMes + dir;
            let a = calAno;
            if (m < 0) { m = 11; a--; }
            if (m > 11) { m = 0; a++; }
            setCalMes(m);
            setCalAno(a);
            setDiaSel(null);
            setEvAberto(null);
          }
          function irPara(e: { dia: string; mes: string; ano?: string }) {
            setCalAno(Number(e.ano) || anoHoje);
            setCalMes(mesIdx(e.mes));
            setDiaSel(Number(e.dia));
            setEvAberto(null);
          }

          function chipCount(diff: number) {
            return diff === 0
              ? "bg-green-600 text-white"
              : diff > 0
                ? "bg-sparta-600 text-white"
                : "bg-white/10 text-zinc-500";
          }

          return (
          <div className="space-y-3 p-4 md:p-8">
            {/* próximo compromisso */}
            {proxEv && (() => {
              const [titulo, local] = splitDetalhe(proxEv.e.detalhe);
              return (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sparta-600 via-sparta-700 to-[#2b060d] p-5 ring-1 ring-sparta-500/40 md:p-8">
                <div className="stripe-texture absolute inset-0 opacity-40" />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold tracking-[0.25em] text-red-100">
                      PRÓXIMO COMPROMISSO • {proxEv.e.tipo}
                    </p>
                    <p className="font-display mt-1 truncate text-3xl font-extrabold italic leading-none md:text-4xl">{titulo}</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-100/90">
                      <Icon name="calendar" size={14} /> {proxEv.e.dia} de {MESES_NOME[mesIdx(proxEv.e.mes)].toLowerCase()} • {proxEv.e.hora}
                    </p>
                    {local && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-red-100/90">
                      <Icon name="pin" size={14} /> <span className="truncate">{local}</span>
                    </p>
                    )}
                  </div>
                  <div className="shrink-0 rounded-2xl bg-black/30 px-4 py-3 text-center ring-1 ring-white/20">
                    {proxEv.diff === 0 ? (
                      <p className="font-display text-3xl font-extrabold italic leading-none">HOJE</p>
                    ) : (
                      <>
                        <p className="font-display text-4xl font-extrabold italic leading-none md:text-5xl">{proxEv.diff}</p>
                        <p className="mt-0.5 text-[9px] font-bold tracking-[0.2em] text-red-100/80">{proxEv.diff === 1 ? "DIA" : "DIAS"}</p>
                      </>
                    )}
                  </div>
                </div>
                <button onClick={() => irPara(proxEv.e)} className="press relative mt-3 w-full rounded-xl bg-black/30 py-2.5 text-xs font-extrabold tracking-wider ring-1 ring-white/20">
                  VER NO CALENDÁRIO
                </button>
              </div>
              );
            })()}

            <div className="md:grid md:grid-cols-[400px_1fr] md:items-start md:gap-4 lg:grid-cols-[480px_1fr]">
              {/* calendário real */}
              <div className="card-shadow overflow-hidden rounded-3xl bg-white text-zinc-900">
                <div className="flex items-center justify-between px-3 py-3 md:px-5 md:py-4">
                  <button onClick={() => mudaMes(-1)} aria-label="Mês anterior" className="press rounded-lg p-2 text-zinc-400 hover:bg-zinc-100">
                    <Icon name="back" size={18} />
                  </button>
                  <div className="text-center">
                    <p className="font-display text-xl font-extrabold italic leading-none tracking-widest md:text-2xl">
                      {MESES_NOME[calMes].toUpperCase()} {calAno}
                    </p>
                    {!(ehMesAtual) && (
                      <button onClick={() => { setCalAno(hojeD.getFullYear()); setCalMes(hojeD.getMonth()); setDiaSel(hojeD.getDate()); }} className="mt-0.5 text-[10px] font-extrabold tracking-widest text-sparta-600">
                        VOLTAR A HOJE
                      </button>
                    )}
                  </div>
                  <button onClick={() => mudaMes(1)} aria-label="Próximo mês" className="press rounded-lg p-2 text-zinc-400 hover:bg-zinc-100">
                    <Icon name="chevron" size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 px-4 text-center text-[10px] font-extrabold text-zinc-400 md:gap-2 md:px-6 md:text-xs">
                  {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 p-4 pt-2 text-center md:gap-2 md:p-6 md:pt-3">
                  {cells.map((c, i) => {
                    const evs = c.fora ? [] : porDia.get(c.dia) ?? [];
                    const temJogo = evs.some((e) => e.tipo === "JOGO");
                    const sel = !c.fora && c.dia === dia;
                    const ehHoje = ehMesAtual && !c.fora && c.dia === hojeD.getDate();
                    return (
                      <button
                        key={i}
                        disabled={c.fora}
                        onClick={() => { setDiaSel(c.dia); setEvAberto(null); }}
                        className={`press flex flex-col items-center rounded-full py-1.5 text-[13px] font-semibold md:py-2.5 md:text-[15px] ${
                          c.fora ? "text-zinc-300" : sel ? "bg-sparta-600 font-extrabold text-white shadow" : ehHoje ? "font-extrabold text-sparta-600 ring-1 ring-sparta-600" : "text-zinc-800"
                        }`}
                      >
                        {c.dia}
                        <span className="flex h-1.5 gap-0.5">
                          {evs.slice(0, 3).map((e) => (
                            <span key={e.id} className={`h-1 w-1 rounded-full ${e.tipo === "JOGO" ? "bg-red-500" : "bg-zinc-400"}`} style={sel ? { backgroundColor: "#fff" } : undefined} />
                          ))}
                          {temJogo && evs.length === 0 && null}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 border-t border-zinc-100 px-4 py-2.5 text-[10px] font-bold text-zinc-500">
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Jogo</span>
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-zinc-400" /> Treino</span>
                </div>
              </div>

              {/* eventos do dia */}
              <div className="mt-3 md:mt-0">
                <div className="flex items-center justify-between">
                  <SectionHead title={dia > 0 ? `DIA ${dia} • ${MESES_PT[calMes]}` : "EVENTOS"} />
                  <div className="flex gap-1.5">
                    {(["TODOS", "JOGO", "TREINO"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFiltroEv(f)}
                        className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold tracking-wider ${filtroEv === f ? "bg-sparta-600 text-white" : "bg-[#151517] text-zinc-500 ring-1 ring-white/10"}`}
                      >
                        {f === "TODOS" ? "TODOS" : f === "JOGO" ? "JOGOS" : "TREINOS"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-2 space-y-2.5">
                  {evsDia.map((e) => {
                    const [titulo, local] = splitDetalhe(e.detalhe);
                    const diff = diasAte(dataEvento(e, Number(e.ano) || calAno));
                    const aberto = evAberto === e.id;
                    return (
                      <div key={e.id} className="overflow-hidden rounded-2xl bg-[#151517] ring-1 ring-white/10">
                        <button onClick={() => setEvAberto(aberto ? null : e.id)} className="press flex w-full items-center gap-3 p-3.5 text-left md:gap-4 md:p-5">
                          <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-white/[0.06] py-2 md:w-14 md:py-2.5">
                            <span className="font-display text-2xl font-extrabold italic leading-none text-sparta-400 md:text-3xl">{e.dia}</span>
                            <span className="text-[9px] font-extrabold tracking-widest text-zinc-400">{e.mes}</span>
                            <span className="mt-1 text-[10px] font-bold text-zinc-300">{e.hora}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider ${e.tipo === "JOGO" ? "bg-sparta-600 text-white" : "bg-white/10 text-zinc-300"}`}>
                                {e.tipo}
                              </span>
                              <p className="truncate text-[13px] font-bold md:text-sm">{titulo}</p>
                            </div>
                            {local && (
                            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-zinc-400">
                              <Icon name="pin" size={13} className="shrink-0" /> {local}
                            </p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${chipCount(diff)}`}>
                              {textoCountdown(diff)}
                            </span>
                            <Icon name="chevron" size={16} className={`text-zinc-600 transition ${aberto ? "rotate-90" : ""}`} />
                          </div>
                        </button>
                        {aberto && (
                          <div className="space-y-2 border-t border-white/10 px-4 py-3 text-[13px]">
                            <p className="flex items-center gap-2 text-zinc-300">
                              <Icon name="calendar" size={15} className="shrink-0 text-sparta-400" />
                              {e.dia} de {MESES_NOME[mesIdx(e.mes)].toLowerCase()} de {e.ano || calAno} • {e.hora}
                            </p>
                            {local && (
                            <p className="flex items-center gap-2 text-zinc-300">
                              <Icon name="pin" size={15} className="shrink-0 text-sparta-400" /> {local}
                            </p>
                            )}
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(`${e.tipo === "JOGO" ? "JOGO" : "TREINO"} ${nomeClube}: ${titulo} — ${e.dia}/${e.mes} às ${e.hora}${local ? ` • ${local}` : ""}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="press flex items-center justify-center gap-2 rounded-xl bg-green-700 py-2.5 text-xs font-extrabold tracking-wide"
                            >
                              COMPARTILHAR NO WHATSAPP
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {evsDia.length === 0 && (
                    <p className="rounded-2xl bg-[#151517] p-6 text-center text-xs text-zinc-500 ring-1 ring-white/10">
                      Nenhum evento neste dia — toque num dia marcado no calendário.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* próximos compromissos */}
            {futuros.length > 1 && (
              <div>
                <SectionHead title="PRÓXIMOS COMPROMISSOS" />
                <div className="mt-2 space-y-2 md:grid md:grid-cols-2 md:gap-2.5 md:space-y-0">
                  {futuros.slice(1, 5).map(({ e, diff }) => {
                    const [titulo] = splitDetalhe(e.detalhe);
                    return (
                      <button key={e.id} onClick={() => irPara(e)} className="press flex w-full items-center gap-3 rounded-2xl bg-[#151517] p-3 text-left ring-1 ring-white/10">
                        <div className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-white/[0.06] py-1.5">
                          <span className="font-display text-lg font-extrabold italic leading-none">{e.dia}</span>
                          <span className="text-[8px] font-extrabold tracking-widest text-zinc-400">{e.mes}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold">{titulo}</p>
                          <p className="text-[11px] text-zinc-500">{e.hora} • {e.tipo}</p>
                        </div>
                        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold ${chipCount(diff)}`}>
                          {textoCountdown(diff)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {site.eventos.length === 0 && (
              <p className="rounded-2xl bg-[#151517] p-6 text-center text-xs text-zinc-500 ring-1 ring-white/10">
                Nenhum evento — crie no painel ADM.
              </p>
            )}
          </div>
          );
        })()}

        {route === "jogos" && (() => {
          const tabela = [...site.classificacao]
            .map((t) => ({ ...t, p: t.v * 3 + t.e, sg: t.gp - t.gc }))
            .sort((a, b) => b.p - a.p || b.v - a.v || b.sg - a.sg || b.gp - a.gp);
          const meuIdx = Math.max(0, tabela.findIndex((t) => t.time.toUpperCase() === nomeClube.toUpperCase() || t.sigla === site.escudo.sigla));
          const meu = tabela[meuIdx];
          const ap = meu && meu.j > 0 ? Math.round((meu.p / (meu.j * 3)) * 100) : 0;
          const ult = site.ultimoJogo;
          const res = ult.golsCasa > ult.golsFora ? ["VITÓRIA", "text-green-400"] : ult.golsCasa === ult.golsFora ? ["EMPATE", "text-zinc-400"] : ["DERROTA", "text-red-400"];
          return (
          <div className="space-y-3 p-4 md:p-8">
            {/* faixa de status */}
            <div className="grid grid-cols-3 gap-2">
              {[
                [`${String(meuIdx + 1).padStart(2, "0")}º`, "POSIÇÃO"],
                [`${meu?.p ?? 0}`, "PONTOS"],
                [`${ap}%`, "APROVEIT."],
              ].map(([n, l]) => (
                <div key={l} className="carbon-texture rounded-2xl bg-[#151517] p-3 text-center ring-1 ring-white/10">
                  <p className="font-display text-3xl font-extrabold italic leading-none">{n}</p>
                  <p className="mt-1 text-[9px] font-bold tracking-[0.2em] text-zinc-500">{l}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 md:grid md:grid-cols-2 md:items-start md:gap-3 md:space-y-0">
              {/* último resultado */}
              <div className="carbon-texture overflow-hidden rounded-3xl bg-[#151517] ring-1 ring-white/10">
                <div className="flex items-center justify-between px-4 pt-3">
                  <p className="text-[10px] font-extrabold tracking-[0.25em] text-zinc-500">ÚLTIMO RESULTADO</p>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider ${res[1]} bg-white/5 ring-1 ring-white/10`}>{res[0]}</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex w-16 flex-col items-center gap-1.5">
                    <Crest size={52} />
                    <span className="font-display text-sm font-bold italic">{ult.casa}</span>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-6xl font-extrabold italic leading-none">{ult.golsCasa}<span className="mx-1.5 text-2xl not-italic text-zinc-600">–</span>{ult.golsFora}</p>
                    <p className="mt-1.5 text-[10px] font-bold tracking-widest text-zinc-500">{ult.data} • {ult.local}</p>
                  </div>
                  <div className="flex w-16 flex-col items-center gap-1.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 font-display text-sm font-extrabold italic">{ult.fora}</div>
                    <span className="font-display text-sm font-bold italic text-zinc-400">{ult.fora}</span>
                  </div>
                </div>
                {(ult.gols?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-white/10 px-4 py-2.5">
                    {ult.gols!.map((g) => (
                      <p key={g.minuto + g.autor} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-black text-black">●</span>
                        <span className="font-extrabold text-white">{g.minuto}</span> {g.autor}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* próximo jogo */}
              <button onClick={() => go("agenda")} className="press block w-full overflow-hidden rounded-3xl bg-gradient-to-br from-sparta-600 to-sparta-700 p-[1px] text-left">
                <div className="rounded-3xl bg-[#151517] p-4">
                  <p className="text-[10px] font-extrabold tracking-[0.25em] text-sparta-400">PRÓXIMO JOGO • {site.proximoJogo.competicao}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex flex-1 flex-col items-center gap-1">
                      {site.proximoJogo.casaEscudo ? (
                        <img src={site.proximoJogo.casaEscudo} alt="" className="h-12 w-12 object-contain" />
                      ) : (
                        <Crest size={48} />
                      )}
                      <span className="font-display text-sm font-bold italic">{site.proximoJogo.casa}</span>
                    </div>
                    <span className="font-display px-2 text-2xl font-extrabold italic text-zinc-500">VS</span>
                    <div className="flex flex-1 flex-col items-center gap-1">
                      {site.proximoJogo.foraEscudo ? (
                        <img src={site.proximoJogo.foraEscudo} alt="" className="h-12 w-12 object-contain" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 font-display text-xs font-extrabold italic">{site.proximoJogo.fora.slice(0, 3)}</div>
                      )}
                      <span className="font-display text-sm font-bold italic">{site.proximoJogo.fora}</span>
                    </div>
                  </div>
                  <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 text-xs font-bold ring-1 ring-white/10">
                    <Icon name="calendar" size={14} className="text-sparta-400" /> {site.proximoJogo.data} • {site.proximoJogo.hora}
                  </p>
                </div>
              </button>
            </div>

            {/* classificação completa */}
            <div className="overflow-hidden rounded-3xl bg-[#151517] ring-1 ring-white/10">
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-[10px] font-extrabold tracking-[0.25em] text-zinc-400">CLASSIFICAÇÃO • GRUPO B</p>
                <span className="rounded-md bg-sparta-600/15 px-2 py-0.5 text-[10px] font-extrabold text-sparta-400 ring-1 ring-sparta-600/30">TEMPORADA 2026</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-center text-[13px]">
                  <thead>
                    <tr className="border-y border-white/10 text-[10px] font-extrabold tracking-wider text-zinc-500">
                      <th className="py-2 pl-4 pr-1 font-extrabold">#</th>
                      <th className="px-2 py-2 text-left font-extrabold">TIME</th>
                      {(["P", "J", "V", "E", "D", "GP", "GC", "SG"] as const).map((c) => (
                        <th key={c} className={`px-2 py-2 font-extrabold ${c === "P" ? "text-white" : ""}`}>{c}</th>
                      ))}
                      <th className="py-2 pl-2 pr-4 font-extrabold">FORMA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabela.map((t, i) => {
                      const isMeu = i === meuIdx;
                      return (
                        <tr key={t.id} className={`border-b border-white/5 ${isMeu ? "bg-sparta-600/[0.08]" : ""}`}>
                          <td className="py-2.5 pl-4 pr-1">
                            <span className={`inline-block w-1.5 rounded-full ${i < 2 ? "bg-green-500" : i === tabela.length - 1 ? "bg-red-500" : "bg-zinc-700"}`} style={{ height: 22 }} />
                            <span className="font-display ml-1.5 text-base font-extrabold italic text-zinc-300">{i + 1}</span>
                          </td>
                          <td className="px-2 py-2.5 text-left">
                            <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 align-middle text-[10px] font-extrabold">{t.sigla}</span>
                            <span className={`font-bold ${isMeu ? "text-white" : "text-zinc-300"}`}>{t.time}</span>
                          </td>
                          <td className="px-2 py-2.5 font-extrabold text-white">{t.p}</td>
                          <td className="px-2 py-2.5 text-zinc-400">{t.j}</td>
                          <td className="px-2 py-2.5 text-zinc-400">{t.v}</td>
                          <td className="px-2 py-2.5 text-zinc-400">{t.e}</td>
                          <td className="px-2 py-2.5 text-zinc-400">{t.d}</td>
                          <td className="px-2 py-2.5 text-zinc-400">{t.gp}</td>
                          <td className="px-2 py-2.5 text-zinc-400">{t.gc}</td>
                          <td className="px-2 py-2.5 text-zinc-400">{t.sg > 0 ? `+${t.sg}` : t.sg}</td>
                          <td className="py-2.5 pl-2 pr-4">
                            <span className="flex justify-end gap-1 md:justify-center">
                              {t.forma.slice(-5).split("").map((f, k) => (
                                <span key={k} className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black ${f === "V" ? "bg-green-500 text-black" : f === "E" ? "bg-zinc-500 text-black" : "bg-red-500 text-white"}`}>
                                  {f}
                                </span>
                              ))}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-[10px] font-bold text-zinc-500">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-1 rounded-full bg-green-500" /> Zona de classificação</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-1 rounded-full bg-red-500" /> Rebaixamento</span>
                <span className="ml-auto">P pontos • J jogos • SG saldo de gols</span>
              </div>
            </div>
          </div>
          );
        })()}

        {route === "noticias" && (() => {
          const cats = ["TODAS", ...Array.from(new Set(site.noticias.map((n) => n.categoria)))];
          const filtradas = notCat === "TODAS" ? site.noticias : site.noticias.filter((n) => n.categoria === notCat);
          const sel = site.noticias.find((n) => n.id === notSel);
          const tempoLeitura = (t: string) => Math.max(1, Math.round(t.split(/\s+/).filter(Boolean).length / 200));
          if (sel) {
            const outros = site.noticias.filter((n) => n.id !== sel.id).slice(0, 3);
            return (
              <div className="p-4 md:p-8">
                <button onClick={() => setNotSel(null)} className="press flex items-center gap-1 text-xs font-extrabold tracking-wider text-zinc-400">
                  <Icon name="back" size={16} /> TODAS AS NOTÍCIAS
                </button>
                <article className="card-shadow mt-3 overflow-hidden rounded-3xl bg-[#151517] ring-1 ring-white/10">
                  <div className="relative h-64 bg-zinc-800 md:h-96">
                    <img src={sel.imagem} alt={sel.titulo} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute left-4 top-4 flex gap-1.5">
                      <span className="rounded-md bg-sparta-600 px-2.5 py-1 text-[10px] font-extrabold tracking-wider">{sel.categoria.toUpperCase()}</span>
                      <span className="rounded-md bg-black/60 px-2.5 py-1 text-[10px] font-bold text-zinc-300">{tempoLeitura(sel.texto ?? sel.titulo)} MIN DE LEITURA</span>
                    </div>
                  </div>
                  <div className="p-5 md:p-8">
                    <h1 className="font-display text-3xl font-extrabold italic leading-tight md:text-4xl">{sel.titulo}</h1>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                      <Icon name="clock" size={13} /> {sel.data} • Por Assessoria {nomeClube}
                    </p>
                    <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                      {(sel.texto?.trim() ? sel.texto.split("\n\n") : ["Matéria em breve com todos os detalhes."]).map((p, i) => (
                        <p key={i} className="text-[15px] leading-relaxed text-zinc-200">{p}</p>
                      ))}
                    </div>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${sel.titulo} — ${nomeClube} (${sel.data})`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="press mt-5 flex items-center justify-center gap-2 rounded-2xl bg-green-700 py-3 text-xs font-extrabold tracking-wide"
                    >
                      COMPARTILHAR NO WHATSAPP
                    </a>
                  </div>
                </article>
                {outros.length > 0 && (
                  <div className="mt-6">
                    <SectionHead title="OUTRAS NOTÍCIAS" />
                    <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                      {outros.map((n) => (
                        <button key={n.id} onClick={() => { setNotSel(n.id); window.scrollTo(0, 0); }} className="press overflow-hidden rounded-2xl bg-[#151517] text-left ring-1 ring-white/10">
                          <img src={n.imagem} alt="" loading="lazy" className="h-28 w-full bg-zinc-800 object-cover" />
                          <div className="p-3">
                            <span className="rounded bg-sparta-600/15 px-1.5 py-0.5 text-[10px] font-extrabold text-sparta-400">{n.categoria.toUpperCase()}</span>
                            <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug">{n.titulo}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }
          const destaque = notCat === "TODAS" ? filtradas[0] : undefined;
          const resto = notCat === "TODAS" ? filtradas.slice(1) : filtradas;
          return (
          <div className="p-4 md:p-8">
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
              {cats.map((c) => {
                const qtd = c === "TODAS" ? site.noticias.length : site.noticias.filter((n) => n.categoria === c).length;
                return (
                  <button
                    key={c}
                    onClick={() => setNotCat(c)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-extrabold tracking-widest ${notCat === c ? "bg-sparta-600 text-white" : "bg-[#151517] text-zinc-500 ring-1 ring-white/10"}`}
                  >
                    {c.toUpperCase()}
                    <span className={`rounded-md px-1.5 text-[10px] ${notCat === c ? "bg-black/30" : "bg-white/5"}`}>{qtd}</span>
                  </button>
                );
              })}
            </div>
            {destaque && (
              <button onClick={() => setNotSel(destaque.id)} className="press mt-3 block overflow-hidden rounded-3xl bg-[#151517] text-left ring-1 ring-white/10">
                <div className="relative h-52 bg-zinc-800 md:h-80">
                  <img src={destaque.imagem} alt="" loading="lazy" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-md bg-sparta-600 px-2 py-0.5 text-[10px] font-extrabold">DESTAQUE</span>
                  <p className="absolute bottom-3 left-3 right-3 font-display text-2xl font-extrabold italic leading-tight md:text-4xl">
                    {destaque.titulo}
                  </p>
                </div>
                <p className="flex items-center gap-1.5 px-4 py-3 text-[11px] text-zinc-500">
                  <Icon name="clock" size={13} /> {destaque.data} • Por Assessoria {nomeClube} • {tempoLeitura(destaque.texto ?? destaque.titulo)} min
                </p>
              </button>
            )}
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {resto.map((n) => (
                <button key={n.id} onClick={() => setNotSel(n.id)} className="press flex gap-3 rounded-2xl bg-[#151517] p-2.5 text-left ring-1 ring-white/10">
                  <img src={n.imagem} alt="" loading="lazy" className="h-20 w-24 shrink-0 rounded-xl bg-zinc-800 object-cover" />
                  <div className="min-w-0 flex-1">
                    <span className="rounded bg-sparta-600/15 px-1.5 py-0.5 text-[10px] font-extrabold text-sparta-400">{n.categoria.toUpperCase()}</span>
                    <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug">{n.titulo}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">{n.data} • {tempoLeitura(n.texto ?? n.titulo)} min</p>
                  </div>
                </button>
              ))}
              {filtradas.length === 0 && (
                <p className="rounded-2xl bg-[#151517] p-6 text-center text-xs text-zinc-500 ring-1 ring-white/10 sm:col-span-full">
                  {site.noticias.length === 0 ? "Nenhuma notícia publicada." : "Nada nesta categoria."}
                </p>
              )}
            </div>
          </div>
          );
        })()}

        {route === "galeria" && (() => {
          const item = luz != null ? midias[luz] : undefined;
          async function baixarMidia(url: string) {
            try {
              const r = await fetch(url);
              const b = await r.blob();
              const u = URL.createObjectURL(b);
              const a = document.createElement("a");
              a.href = u;
              a.download = `spartax-${Date.now()}.jpg`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(u), 5000);
            } catch {
              window.open(url, "_blank");
            }
          }
          async function compartilharMidia(url: string) {
            try {
              const r = await fetch(url);
              const b = await r.blob();
              const f = new File([b], `spartax-${Date.now()}.jpg`, { type: b.type || "image/jpeg" });
              if (navigator.canShare?.({ files: [f] })) {
                await navigator.share({ files: [f], title: nomeClube });
                return;
              }
            } catch (e) {
              if ((e as Error)?.name === "AbortError") return;
            }
            await baixarMidia(url);
          }
          const qtdFotos = site.galeria.filter((g) => g.tipo === "FOTO").length;
          const qtdVideos = site.galeria.filter((g) => g.tipo === "VIDEO").length;
          return (
          <div className="p-4 md:p-8">
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#151517] p-1 ring-1 ring-white/10">
              {(["FOTOS", "VÍDEOS"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => { setAba(a); setLuz(null); }}
                  className={`font-display flex items-center justify-center gap-2 rounded-xl py-2 text-base font-bold italic tracking-widest ${aba === a ? "bg-sparta-600 text-white shadow" : "text-zinc-500"}`}
                >
                  {a}
                  <span className={`rounded-md px-1.5 text-[11px] not-italic ${aba === a ? "bg-black/30" : "bg-white/5"}`}>
                    {a === "FOTOS" ? qtdFotos : qtdVideos}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5 md:grid-cols-6">
              {midias.map((g, i) => (
                <button
                  key={g.id}
                  onClick={() => (g.tipo === "VIDEO" && g.link ? window.open(g.link, "_blank") : setLuz(i))}
                  className={`press group relative overflow-hidden rounded-xl bg-zinc-800 ${i === 0 ? "aspect-square col-span-2 row-span-2 md:col-span-2 md:row-span-2" : "aspect-square"}`}
                >
                  <img src={g.url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                  {g.tipo === "VIDEO" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sparta-600 shadow-lg transition group-hover:scale-110">
                        <Icon name="play" size={17} className="ml-0.5 text-white" />
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </div>
            {midias.length === 0 && (
              <p className="mt-3 rounded-2xl bg-[#151517] p-6 text-center text-xs text-zinc-500 ring-1 ring-white/10">
                Nada por aqui ainda — adicione no painel ADM.
              </p>
            )}
            {/* lightbox */}
            {item && (
              <div className="fixed inset-0 z-50 flex flex-col bg-black/95" onClick={() => setLuz(null)}>
                <div className="flex items-center justify-between px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-extrabold tracking-widest">
                    {(luz ?? 0) + 1} / {midias.length}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => void compartilharMidia(item.url)} aria-label="Compartilhar" className="press flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <Icon name="chat" size={18} />
                    </button>
                    <button onClick={() => void baixarMidia(item.url)} aria-label="Baixar" className="press flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 font-extrabold">
                      ↓
                    </button>
                    <button onClick={() => setLuz(null)} aria-label="Fechar" className="press flex h-10 w-10 items-center justify-center rounded-xl bg-sparta-600 text-lg font-black">
                      ×
                    </button>
                  </div>
                </div>
                <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4" onClick={(e) => e.stopPropagation()}>
                  <img src={item.url.replace("w=400", "w=1200")} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
                  {midias.length > 1 && (
                    <>
                      <button
                        onClick={() => setLuz(((luz ?? 0) - 1 + midias.length) % midias.length)}
                        aria-label="Anterior"
                        className="press absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-xl ring-1 ring-white/20"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setLuz(((luz ?? 0) + 1) % midias.length)}
                        aria-label="Próxima"
                        className="press absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-xl ring-1 ring-white/20"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {route === "parceiros" && (() => {
          const NIVEIS = {
            OURO: { titulo: "PATROCINADOR MASTER", selo: "bg-gold-500/15 text-gold-400 ring-gold-500/40", dot: "bg-gold-400" },
            PRATA: { titulo: "APOIADOR OFICIAL", selo: "bg-white/10 text-zinc-200 ring-white/20", dot: "bg-zinc-300" },
            BRONZE: { titulo: "APOIADOR", selo: "bg-amber-700/20 text-amber-500 ring-amber-700/40", dot: "bg-amber-600" },
          } as const;
          const grupos = (["OURO", "PRATA", "BRONZE"] as const)
            .map((nivel) => ({ nivel, itens: site.parceiros.filter((p) => p.nivel === nivel) }))
            .filter((g) => g.itens.length > 0);
          const sel = site.parceiros.find((p) => p.id === parcSel);
          const logoDe = (p: (typeof site.parceiros)[number], cls: string) =>
            p.logo ? (
              <img src={p.logo} alt={p.nome} loading="lazy" className={`${cls} bg-white object-contain p-1.5`} />
            ) : (
              <div className={`${cls} font-display flex items-center justify-center font-extrabold italic text-white ${p.cor}`}>
                {p.nome[0]}
              </div>
            );
          return (
          <div className="space-y-4 p-4 md:p-8">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-2xl bg-[#151517] p-3 ring-1 ring-white/10">
                <p className="font-display text-3xl font-extrabold italic leading-none">{site.parceiros.length}</p>
                <p className="mt-1 text-[9px] font-bold tracking-[0.2em] text-zinc-500">PARCEIROS ATIVOS</p>
              </div>
              <div className="rounded-2xl bg-[#151517] p-3 ring-1 ring-gold-500/30">
                <p className="font-display text-3xl font-extrabold italic leading-none text-gold-400">{site.parceiros.filter((p) => p.nivel === "OURO").length}</p>
                <p className="mt-1 text-[9px] font-bold tracking-[0.2em] text-zinc-500">PATROCÍNIO OURO</p>
              </div>
            </div>
            {grupos.map((g) => (
              <div key={g.nivel}>
                <div className="flex items-center gap-2 px-1">
                  <span className={`h-2 w-2 rounded-full ${NIVEIS[g.nivel].dot}`} />
                  <p className="text-[11px] font-extrabold tracking-[0.25em] text-zinc-400">
                    {g.nivel} • {NIVEIS[g.nivel].titulo}
                  </p>
                  <span className="ml-auto rounded-md bg-white/5 px-1.5 text-[10px] font-extrabold text-zinc-500">{g.itens.length}</span>
                </div>
                <div className={`mt-2 grid gap-2.5 ${g.nivel === "BRONZE" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
                  {g.itens.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setParcSel(p.id)}
                      className={`press flex items-center gap-3 rounded-2xl bg-[#151517] text-left ring-1 ${g.nivel === "OURO" ? "border border-gold-500/50 p-4 ring-gold-500/30" : "p-3.5 ring-white/10"}`}
                    >
                      {logoDe(p, g.nivel === "OURO" ? "h-16 w-16 shrink-0 rounded-2xl text-2xl" : "h-12 w-12 shrink-0 rounded-xl text-xl")}
                      <span className="min-w-0 flex-1">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider ring-1 ${NIVEIS[g.nivel].selo}`}>
                          {g.nivel}
                        </span>
                        <span className={`font-display block truncate leading-tight ${g.nivel === "OURO" ? "mt-1 text-2xl font-extrabold italic" : "mt-0.5 text-lg font-bold italic tracking-wide"}`}>
                          {p.nome}
                        </span>
                        <span className="block truncate text-[11px] text-zinc-400">{p.tipo}{p.detalhe ? ` • ${p.detalhe}` : ""}</span>
                      </span>
                      <Icon name="chevron" size={17} className="shrink-0 text-zinc-600" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {site.parceiros.length === 0 && (
              <p className="rounded-2xl bg-[#151517] p-6 text-center text-xs text-zinc-500 ring-1 ring-white/10">
                Nenhum parceiro cadastrado ainda.
              </p>
            )}
            <button onClick={() => go("fale")} className="press block w-full overflow-hidden rounded-3xl bg-gradient-to-r from-gold-500 via-[#8a6d1c] to-gold-500 p-[1px] text-left">
              <div className="carbon-texture rounded-3xl bg-[#121210] p-5 text-center">
                <p className="text-[10px] font-extrabold tracking-[0.3em] text-gold-400">SUA MARCA AQUI</p>
                <p className="font-display mt-1 text-2xl font-extrabold italic">SEJA UM PATROCINADOR</p>
                <p className="mx-auto mt-1 max-w-xs text-xs text-zinc-400">Apareça para toda a torcida e fortaleça o clube.</p>
                <span className="mt-3 inline-block rounded-xl bg-gold-500 px-6 py-2.5 text-sm font-extrabold text-black">
                  FALAR COM O CLUBE
                </span>
              </div>
            </button>
            {/* detalhe do parceiro */}
            {sel && (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center" onClick={() => setParcSel(null)}>
                <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-[#151517] ring-1 ring-white/15" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col items-center p-6 text-center">
                    {logoDe(sel, "h-24 w-24 rounded-3xl text-4xl")}
                    <span className={`mt-3 rounded px-2 py-0.5 text-[10px] font-extrabold tracking-wider ring-1 ${NIVEIS[sel.nivel].selo}`}>
                      {sel.nivel} • {NIVEIS[sel.nivel].titulo}
                    </span>
                    <p className="font-display mt-2 text-3xl font-extrabold italic leading-none">{sel.nome}</p>
                    <p className="mt-1 text-sm text-zinc-400">{sel.tipo}{sel.detalhe ? ` • ${sel.detalhe}` : ""}</p>
                    {sel.link && (
                      <a href={sel.link.startsWith("http") ? sel.link : `https://${sel.link}`} target="_blank" rel="noreferrer" className="press mt-4 w-full rounded-2xl bg-white py-3 text-sm font-extrabold text-black">
                        VISITAR SITE
                      </a>
                    )}
                    <button onClick={() => setParcSel(null)} className="press mt-2 w-full rounded-2xl bg-white/5 py-3 text-sm font-bold text-zinc-300 ring-1 ring-white/10">
                      FECHAR
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {route === "projetos" && (
          <div className="space-y-3 p-4">
            <div className="carbon-texture overflow-hidden rounded-3xl bg-[#151517] p-5 ring-1 ring-gold-500/30">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold tracking-[0.25em] text-gold-400">{site.projeto.titulo}</p>
                <Icon name="shield" size={18} className="text-gold-400" />
              </div>
              <p className="mt-1 text-[11px] text-zinc-400">{site.projeto.subtitulo}</p>
              <p className="font-display mt-2 text-4xl font-extrabold italic">{site.projeto.valorTotal}</p>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-sparta-500 to-gold-500" style={{ width: `${percWidth}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  [site.projeto.captado, "CAPTADO", "text-green-400"],
                  [site.projeto.aCaptar, "A CAPTAR", "text-amber-400"],
                  [site.projeto.percentual, "DO TOTAL", "text-white"],
                ].map(([v, l, c]) => (
                  <div key={l as string} className="rounded-xl bg-white/[0.05] p-2 ring-1 ring-white/10">
                    <p className={`text-[13px] font-extrabold ${c}`}>{v}</p>
                    <p className="text-[9px] font-bold tracking-widest text-zinc-500">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="pt-1 text-[10px] font-extrabold tracking-[0.25em] text-zinc-500">PATROCINADORES CONFIRMADOS</p>
            {site.projeto.confirmados.map((c) => (
              <div key={c.nome} className="flex items-center justify-between rounded-2xl bg-[#151517] p-3.5 ring-1 ring-white/10">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/15 text-gold-400">
                    <Icon name="check" size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold">{c.nome}</p>
                    <p className="text-[11px] text-zinc-500">{c.detalhe}</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-zinc-300">{c.valor}</p>
              </div>
            ))}
          </div>
        )}

        {route === "documentos" && (
          <div className="space-y-2 p-4">
            <div className="flex items-center gap-2 rounded-2xl bg-sparta-600/10 p-3 ring-1 ring-sparta-600/30">
              <Icon name="shield" size={18} className="text-sparta-400" />
              <p className="text-xs text-zinc-300">Portal da transparência — documentos oficiais do clube.</p>
            </div>
            {site.documentos.map((d) => (
              <button key={d.id} className="press flex w-full items-center gap-3 rounded-2xl bg-[#151517] p-3.5 text-left ring-1 ring-white/10">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sparta-600/15 text-sparta-400">
                  <Icon name="folder" size={19} />
                </span>
                <span className="flex-1">
                  <span className="block text-[13px] font-bold">{d.nome}</span>
                  <span className="block text-[11px] text-zinc-500">PDF • Atualizado em {d.atualizado} • {d.tamanho}</span>
                </span>
                <Icon name="chevron" size={17} className="text-zinc-600" />
              </button>
            ))}
          </div>
        )}

        {route === "notificacoes" && (
          <div className="space-y-2 p-4">
            {site.notificacoes.map((n) => (
              <button
                key={n.id}
                onClick={() => marcarLida(n.id)}
                className={`press flex w-full items-start gap-3 rounded-2xl p-3.5 text-left ring-1 ${n.lida ? "bg-[#151517] ring-white/10" : "bg-sparta-600/[0.08] ring-sparta-600/30"}`}
              >
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${n.lida ? "bg-white/5 text-zinc-500" : "bg-sparta-600 text-white"}`}>
                  <Icon name="bell" size={17} />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 text-[13px] font-bold">
                    {n.titulo}
                    {!n.lida && <span className="h-2 w-2 rounded-full bg-sparta-500" />}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-zinc-500">{n.data}</span>
                </span>
              </button>
            ))}
            <button
              onClick={() => site.update({ notificacoes: site.notificacoes.map((o) => ({ ...o, lida: true })) })}
              className="press w-full rounded-2xl bg-sparta-600 py-3.5 text-[13px] font-extrabold tracking-wide"
            >
              MARCAR TODAS COMO LIDAS
            </button>
          </div>
        )}

        {route === "fale" && (
          <div className="space-y-3 p-4">
            {[
              ["chat", "WhatsApp do clube", "(44) 99900-0000"],
              ["news", "E-mail oficial", "contato@spartax.com.br"],
              ["pin", `CT ${nomeClube}`, "Waiporã • Paraná"],
            ].map(([icon, t, s]) => (
              <div key={t as string} className="flex items-center gap-3 rounded-2xl bg-[#151517] p-3.5 ring-1 ring-white/10">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sparta-600/15 text-sparta-400">
                  <Icon name={icon as "chat"} size={19} />
                </span>
                <div>
                  <p className="text-[13px] font-bold">{t}</p>
                  <p className="text-xs text-zinc-400">{s}</p>
                </div>
              </div>
            ))}
            <div className="rounded-3xl bg-[#151517] p-4 ring-1 ring-white/10">
              <p className="font-display text-xl font-bold italic">ENVIE UMA MENSAGEM</p>
              <input placeholder="Seu nome" className="mt-3 w-full rounded-xl bg-black/40 p-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-sparta-500" />
              <input placeholder="WhatsApp ou e-mail" className="mt-2 w-full rounded-xl bg-black/40 p-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-sparta-500" />
              <textarea placeholder="Como podemos ajudar?" rows={4} className="mt-2 w-full rounded-xl bg-black/40 p-3 text-sm outline-none ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-sparta-500" />
              <button className="press mt-2 w-full rounded-2xl bg-sparta-600 py-3.5 text-sm font-extrabold">ENVIAR MENSAGEM</button>
            </div>
          </div>
        )}

        {route === "config" && (
          <div className="space-y-2 p-4">
            {[
              ["Notificações de jogos", "Gols, escalação e resultado", true],
              ["Lembrete de treinos", "Avisar 2h antes", true],
              ["Notícias do clube", "Resumo diário", false],
            ].map(([t, s, on]) => (
              <div key={t as string} className="flex items-center justify-between rounded-2xl bg-[#151517] p-4 ring-1 ring-white/10">
                <div>
                  <p className="text-[13px] font-bold">{t}</p>
                  <p className="text-[11px] text-zinc-500">{s}</p>
                </div>
                <span className={`relative h-7 w-12 rounded-full p-1 ${on ? "bg-sparta-600" : "bg-zinc-700"}`}>
                  <span className={`block h-5 w-5 rounded-full bg-white shadow ${on ? "ml-auto" : ""}`} />
                </span>
              </div>
            ))}
            <button
              onClick={() => go("adm")}
              className="press flex w-full items-center gap-3 rounded-2xl bg-gold-500/10 p-4 text-left ring-1 ring-gold-500/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400">
                <Icon name="shield" size={19} />
              </span>
              <span className="flex-1">
                <span className="block text-[13px] font-bold">Administração do clube</span>
                <span className="block text-[11px] text-zinc-500">Gerenciar conteúdo • acesso com PIN</span>
              </span>
              <Icon name="chevron" size={17} className="text-gold-400" />
            </button>
            <div className="carbon-texture mt-2 rounded-3xl p-5 text-center ring-1 ring-white/10">
              <div className="mx-auto w-fit"><Crest size={52} /></div>
              <p className="font-display mt-2 text-xl font-extrabold italic">{nomeClube} v1.0</p>
              <p className="text-[10px] tracking-[0.25em] text-zinc-500">TRADIÇÃO • FAMÍLIA • DISCIPLINA • RESPEITO</p>
            </div>
          </div>
        )}
      </RouteErrorBoundary>
      </main>
        </div>
      </div>

      {/* BOTTOM NAV — só no mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-20 md:hidden">
        <div className="mx-auto max-w-[430px] border-t border-white/10 bg-[#0B0B0C]/95 backdrop-blur">
          <div className="pb-safe grid grid-cols-5 px-1 pt-1">
            {(
              [
                ["inicio", "INÍCIO", "home"],
                ["atletas", "ATLETAS", "users"],
                ["agenda", "AGENDA", "calendar"],
                ["notificacoes", "AVISOS", "bell"],
                ["__menu", "MENU", "menu"],
              ] as const
            ).map(([id, label, icon]) => {
              const active = route === id;
              return (
                <button
                  key={id}
                  onClick={() => (id === "__menu" ? setDrawer(true) : go(id as Route))}
                  className="press relative flex flex-col items-center gap-1 py-2"
                >
                  {active && <span className="absolute -top-[5px] h-0.5 w-10 rounded-full bg-sparta-500" />}
                  <span className="relative">
                    <Icon name={icon as "home"} size={22} className={active ? "text-sparta-400" : "text-zinc-500"} />
                    {id === "notificacoes" && naoLidas > 0 && (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sparta-500 px-1 text-[9px] font-extrabold">
                        {naoLidas}
                      </span>
                    )}
                  </span>
                  <span className={`text-[9px] font-extrabold tracking-[0.15em] ${active ? "text-white" : "text-zinc-500"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
