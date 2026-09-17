import { useEffect, useMemo, useState } from "react";
import { Icon, Shield } from "./components/brand";
import Admin from "./pages/Admin";
import { useSite } from "./store/site";
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

export default function App() {
  const site = useSite();
  const [route, setRoute] = useState<Route>("inicio");
  const [drawer, setDrawer] = useState(false);
  const [splash, setSplash] = useState(true);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<"FOTOS" | "VÍDEOS">("FOTOS");
  const [admAuth, setAdmAuth] = useState(false);
  const [pinInput, setPinInput] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const lista = useMemo(
    () => site.atletas.filter((a) => a.nome.toLowerCase().includes(busca.toLowerCase())),
    [site.atletas, busca]
  );
  const midias = useMemo(
    () => site.galeria.filter((g) => (aba === "FOTOS" ? g.tipo === "FOTO" : g.tipo === "VIDEO")),
    [site.galeria, aba]
  );
  const naoLidas = site.notificacoes.filter((n) => !n.lida).length;
  const hero = site.heroImagem;
  const head = TITULOS[route];
  const nomeClube = site.escudo.nome;
  const ouro = site.parceiros.find((p) => p.nivel === "OURO") ?? site.parceiros[0];
  const demaisParceiros = site.parceiros.filter((p) => p !== ouro);
  const percWidth = Math.min(100, Math.max(0, parseFloat(site.projeto.percentual.replace(",", ".")) || 0));
  const diasDestaque = new Set(site.eventos.map((e) => e.dia));

  function go(r: Route) {
    setRoute(r);
    setDrawer(false);
  }

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
                    <p className="font-display text-2xl font-extrabold italic leading-none">{nomeClube}</p>
                    <p className="text-[10px] font-bold tracking-[0.25em] text-zinc-300">ASSOCIAÇÃO DESPORTIVA</p>
                    <p className="mt-1.5 w-fit rounded-full bg-gold-500/15 px-2.5 py-0.5 text-[10px] font-bold text-gold-400 ring-1 ring-gold-500/40">
                      SÓCIO TORCEDOR • 2026
                    </p>
                  </div>
                </div>
              </div>
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
                            PIN
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
              <p className="font-display text-xl font-extrabold italic leading-none">{nomeClube}</p>
              <p className="text-[9px] font-bold tracking-[0.25em] text-zinc-400">ASSOCIAÇÃO DESPORTIVA</p>
            </div>
          </div>
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
                        PIN
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
        </aside>

        <div className="min-w-0 flex-1">
      <main className="min-w-0 flex-1 pb-28 md:pb-10 md:[&>div]:mx-auto md:[&>div]:w-full md:[&>div]:max-w-6xl md:[&>div]:px-8">
        {route === "adm" && !admAuth && (
          <div className="p-4">
            <div className="carbon-texture rounded-3xl bg-[#151517] p-6 text-center ring-1 ring-gold-500/30">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/40">
                <Icon name="shield" size={26} />
              </span>
              <p className="font-display mt-3 text-2xl font-extrabold italic">ÁREA RESTRITA</p>
              <p className="mt-1 text-xs text-zinc-400">Digite o PIN de administração (padrão: 1234).</p>
              <input
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                onKeyDown={(e) => { if (e.key === "Enter" && pinInput === site.pin) { setAdmAuth(true); setPinInput(""); } }}
                inputMode="numeric"
                type="password"
                placeholder="••••"
                className="mx-auto mt-4 w-40 rounded-2xl bg-black/50 p-3 text-center text-2xl font-extrabold tracking-[0.5em] outline-none ring-1 ring-white/15 placeholder:text-zinc-700 focus:ring-gold-500"
              />
              <button
                onClick={() => {
                  if (pinInput === site.pin) { setAdmAuth(true); setPinInput(""); }
                  else alert("PIN incorreto.");
                }}
                className="press mt-3 w-full rounded-2xl bg-gold-500 py-3 text-sm font-extrabold text-black"
              >
                DESBLOQUEAR PAINEL
              </button>
            </div>
          </div>
        )}

        {route === "adm" && admAuth && <Admin onExit={() => go("inicio")} />}

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
                      <span className="truncate text-center text-xs font-bold">{site.proximoJogo.local}</span>
                      <span className="font-display text-base font-extrabold italic">{site.proximoJogo.hora}</span>
                    </div>
                  </div>
                </div>
                <div className="relative flex gap-2 p-3 pt-0">
                  <button onClick={() => go("agenda")} className="press flex flex-1 items-center justify-center gap-1 rounded-2xl bg-sparta-600 py-3 text-[13px] font-extrabold tracking-wide text-white">
                    VER AGENDA COMPLETA <Icon name="chevron" size={16} />
                  </button>
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

        {route === "atletas" && (
          <div className="p-4">
            <div className="flex items-center gap-2 rounded-2xl bg-[#151517] p-1.5 pl-3 ring-1 ring-white/10">
              <Icon name="search" size={18} className="shrink-0 text-zinc-500" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar atleta por nome..."
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-500"
              />
              <span className="mr-1 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                <Icon name="filter" size={17} />
              </span>
            </div>
            <p className="mt-3 text-[11px] font-bold tracking-[0.2em] text-zinc-500">
              {lista.length} ATLETAS • ELENCO OFICIAL
            </p>
            <div className="mt-2 space-y-2 md:grid md:grid-cols-2 md:gap-2.5 md:space-y-0">
              {lista.map((a) => (
                <div key={a.id} className="press flex items-center gap-3 rounded-2xl bg-[#151517] p-3 ring-1 ring-white/10">
                  <div className="flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-b from-sparta-500 to-sparta-700">
                    <span className="font-display text-lg font-extrabold italic leading-none text-white">{a.numero}</span>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 text-sm font-extrabold ring-1 ring-white/15">
                    {a.nome.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-lg font-bold italic leading-tight tracking-wide">{a.nome}</p>
                    <p className="truncate text-xs text-zinc-400">{a.posicao} • Nasc. {a.nasc}</p>
                  </div>
                  <Icon name="chevron" size={18} className="shrink-0 text-zinc-600" />
                </div>
              ))}
              {lista.length === 0 && (
                <p className="rounded-2xl bg-[#151517] p-8 text-center text-sm text-zinc-500 ring-1 ring-white/10">
                  Nenhum atleta encontrado para “{busca}”.
                </p>
              )}
            </div>
          </div>
        )}

        {route === "agenda" && (
          <div className="p-4">
            <div className="card-shadow overflow-hidden rounded-3xl bg-white text-zinc-900">
              <div className="flex items-center justify-between px-4 py-3">
                <Icon name="back" size={18} className="text-zinc-300" />
                <p className="font-display text-lg font-extrabold italic tracking-widest">
                  {site.eventos[0]?.mes ?? "MAI"} 2026
                </p>
                <Icon name="chevron" size={18} className="text-zinc-300" />
              </div>
              <div className="grid grid-cols-7 gap-1 px-4 text-center text-[10px] font-extrabold text-zinc-400">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 p-4 pt-2 text-center text-[13px] font-semibold">
                {Array.from({ length: 4 }).map((_, i) => (
                  <span key={`b${i}`} className="py-1.5 text-zinc-300">{28 + i}</span>
                ))}
                {Array.from({ length: 27 }).map((_, i) => {
                  const d = String(i + 1);
                  const has = diasDestaque.has(d);
                  const isJogo = site.eventos.some((e) => e.dia === d && e.tipo === "JOGO");
                  return (
                    <span
                      key={d}
                      className={`py-1.5 ${isJogo ? "rounded-full bg-sparta-600 font-extrabold text-white shadow" : has ? "rounded-full bg-zinc-100 font-bold" : ""}`}
                    >
                      {d}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 space-y-2.5 md:grid md:grid-cols-2 md:gap-2.5 md:space-y-0">
              {site.eventos.map((e) => (
                <div key={e.id} className="flex gap-3 rounded-2xl bg-[#151517] p-3.5 ring-1 ring-white/10">
                  <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-white/[0.06] py-2">
                    <span className="font-display text-2xl font-extrabold italic leading-none text-sparta-400">{e.dia}</span>
                    <span className="text-[9px] font-extrabold tracking-widest text-zinc-400">{e.mes}</span>
                    <span className="mt-1 text-[10px] font-bold text-zinc-300">{e.hora}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider ${e.tipo === "JOGO" ? "bg-sparta-600 text-white" : "bg-white/10 text-zinc-300"}`}>
                        {e.tipo}
                      </span>
                      <p className="truncate text-[13px] font-bold">{e.detalhe}</p>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                      <Icon name="pin" size={13} /> {e.detalhe}
                    </p>
                  </div>
                </div>
              ))}
              {site.eventos.length === 0 && (
                <p className="rounded-2xl bg-[#151517] p-6 text-center text-xs text-zinc-500 ring-1 ring-white/10">
                  Nenhum evento — crie no painel ADM.
                </p>
              )}
            </div>
          </div>
        )}

        {route === "jogos" && (
          <div className="space-y-3 p-4 md:grid md:grid-cols-2 md:items-start md:p-8">
            <div className="carbon-texture overflow-hidden rounded-3xl bg-[#151517] ring-1 ring-white/10">
              <p className="px-4 pt-3 text-[10px] font-extrabold tracking-[0.25em] text-zinc-500">ÚLTIMO RESULTADO • REGIONAL</p>
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex flex-col items-center gap-1">
                  <Crest size={48} />
                  <span className="font-display text-sm font-bold italic">{site.ultimoJogo.casa}</span>
                </div>
                <div className="text-center">
                  <p className="font-display text-5xl font-extrabold italic leading-none">{site.ultimoJogo.golsCasa}<span className="mx-1 text-2xl text-zinc-600">—</span>{site.ultimoJogo.golsFora}</p>
                  <p className="mt-1 text-[10px] font-bold tracking-widest text-green-400">
                    {site.ultimoJogo.golsCasa > site.ultimoJogo.golsFora ? "VITÓRIA" : site.ultimoJogo.golsCasa === site.ultimoJogo.golsFora ? "EMPATE" : "DERROTA"} • {site.ultimoJogo.data}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 font-display text-sm font-extrabold italic">{site.ultimoJogo.fora}</div>
                  <span className="font-display text-sm font-bold italic text-zinc-400">{site.ultimoJogo.fora}</span>
                </div>
              </div>
              {(site.ultimoJogo.gols?.length ?? 0) > 0 && (
                <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 text-center">
                  {site.ultimoJogo.gols!.map((g) => (
                    <p key={g.minuto + g.autor} className="py-2.5 text-[11px] text-zinc-400">
                      <span className="font-extrabold text-white">{g.minuto}</span> {g.autor}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-3xl bg-white text-zinc-900">
              <p className="bg-zinc-100 px-4 py-2 text-[10px] font-extrabold tracking-[0.25em] text-sparta-600">CLASSIFICAÇÃO • GRUPO B</p>
              {[
                ["1", nomeClube, "18", true],
                ["2", site.proximoJogo.fora, "15", false],
                ["3", "Grêmio Regional", "12", false],
                ["4", "União Norte", "9", false],
              ].map(([pos, time, pts, me]) => (
                <div key={time as string} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${me ? "bg-sparta-600/[0.07] font-extrabold" : "border-t border-zinc-100"}`}>
                  <span className={`w-5 text-center font-display text-base font-extrabold italic ${pos === "1" ? "text-sparta-600" : "text-zinc-400"}`}>{pos}</span>
                  <span className="flex-1">{time}</span>
                  <span className="font-extrabold">{pts} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {route === "noticias" && (
          <div className="p-4">
            {site.noticias[0] && (
              <button onClick={() => {}} className="press block overflow-hidden rounded-3xl bg-[#151517] text-left ring-1 ring-white/10">
                <div className="relative h-52 bg-zinc-800">
                  <img src={site.noticias[0].imagem} alt="" loading="lazy" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-md bg-sparta-600 px-2 py-0.5 text-[10px] font-extrabold">DESTAQUE</span>
                  <p className="absolute bottom-3 left-3 right-3 font-display text-2xl font-extrabold italic leading-tight">
                    {site.noticias[0].titulo}
                  </p>
                </div>
                <p className="flex items-center gap-1.5 px-4 py-3 text-[11px] text-zinc-500">
                  <Icon name="clock" size={13} /> {site.noticias[0].data} • Por Assessoria {nomeClube}
                </p>
              </button>
            )}
            <div className="mt-3 space-y-2.5 md:grid md:grid-cols-2 md:gap-2.5 md:space-y-0">
              {site.noticias.slice(1).map((n) => (
                <article key={n.id} className="press flex gap-3 rounded-2xl bg-[#151517] p-2.5 ring-1 ring-white/10">
                  <img src={n.imagem} alt="" loading="lazy" className="h-20 w-24 shrink-0 rounded-xl bg-zinc-800 object-cover" />
                  <div className="min-w-0">
                    <span className="rounded bg-sparta-600/15 px-1.5 py-0.5 text-[10px] font-extrabold text-sparta-400">{n.categoria.toUpperCase()}</span>
                    <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug">{n.titulo}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">{n.data}</p>
                  </div>
                </article>
              ))}
              {site.noticias.length === 0 && (
                <p className="rounded-2xl bg-[#151517] p-6 text-center text-xs text-zinc-500 ring-1 ring-white/10">
                  Nenhuma notícia publicada.
                </p>
              )}
            </div>
          </div>
        )}

        {route === "galeria" && (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#151517] p-1 ring-1 ring-white/10">
              {(["FOTOS", "VÍDEOS"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAba(a)}
                  className={`font-display rounded-xl py-2 text-base font-bold italic tracking-widest ${aba === a ? "bg-sparta-600 text-white shadow" : "text-zinc-500"}`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5 md:grid-cols-6">
              {midias.map((g) => (
                <div key={g.id} className="press relative aspect-square overflow-hidden rounded-xl bg-zinc-800">
                  <img src={g.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  {aba === "VÍDEOS" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sparta-600 shadow-lg">
                        <Icon name="play" size={15} className="ml-0.5 text-white" />
                      </span>
                    </span>
                  )}
                </div>
              ))}
            </div>
            {midias.length === 0 && (
              <p className="mt-3 rounded-2xl bg-[#151517] p-6 text-center text-xs text-zinc-500 ring-1 ring-white/10">
                Nada por aqui ainda — adicione no painel ADM.
              </p>
            )}
          </div>
        )}

        {route === "parceiros" && (
          <div className="space-y-3 p-4">
            {ouro && (
              <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-gold-500 via-[#8a6d1c] to-[#3d2f08] p-[1px]">
                <div className="carbon-texture rounded-3xl bg-[#121210] p-4">
                  <p className="text-[10px] font-extrabold tracking-[0.25em] text-gold-400">PATROCINADOR OURO</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl font-display text-2xl font-extrabold italic ${ouro.cor}`}>{ouro.nome[0]}</div>
                    <div>
                      <p className="font-display text-2xl font-extrabold italic leading-none">{ouro.nome}</p>
                      <p className="text-xs text-zinc-400">{ouro.detalhe}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {demaisParceiros.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-[#151517] p-3.5 ring-1 ring-white/10">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-display text-xl font-extrabold italic text-white ${p.cor}`}>
                  {p.nome[0]}
                </div>
                <div className="flex-1">
                  <p className="font-display text-lg font-bold italic leading-none tracking-wide">{p.nome}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">{p.tipo} • {p.detalhe}</p>
                </div>
                <Icon name="chevron" size={17} className="text-zinc-600" />
              </div>
            ))}
            <button onClick={() => go("fale")} className="press w-full rounded-2xl bg-sparta-600 py-3.5 text-sm font-extrabold tracking-wide">
              SEJA UM PATROCINADOR
            </button>
          </div>
        )}

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
