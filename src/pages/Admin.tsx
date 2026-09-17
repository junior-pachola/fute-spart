import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/brand";
import { downloadBanner, MatchBannerArt, shareBanner } from "../components/MatchBanner";
import { uid, useSite, type GaleriaItem } from "../store/site";
import { processImageFile, processImageFiles } from "../store/image";

type Aba = "geral" | "escudo" | "atletas" | "agenda" | "jogos" | "noticias" | "galeria" | "parceiros" | "captacao" | "documentos" | "avisos" | "pin";

const ABAS: { id: Aba; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "escudo", label: "Escudo" },
  { id: "atletas", label: "Atletas" },
  { id: "agenda", label: "Eventos" },
  { id: "jogos", label: "Jogos" },
  { id: "noticias", label: "Notícias" },
  { id: "galeria", label: "Galeria" },
  { id: "parceiros", label: "Parceiros" },
  { id: "captacao", label: "Captação" },
  { id: "documentos", label: "Documentos" },
  { id: "avisos", label: "Avisos" },
  { id: "pin", label: "PIN" },
];

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

function Del({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="press rounded-lg bg-red-600/15 px-2.5 py-1.5 text-xs font-bold text-red-400 ring-1 ring-red-600/30">
      Excluir
    </button>
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

export default function Admin({ onExit }: { onExit: () => void }) {
  const site = useSite();
  const [aba, setAba] = useState<Aba>("geral");

  // forms locais
  const [fAtleta, setFAtleta] = useState({ nome: "", posicao: "", nasc: "", numero: "" });
  const [fEvento, setFEvento] = useState({ dia: "", mes: "MAI", hora: "", titulo: "Treino no CT", detalhe: "", tipo: "TREINO" as "JOGO" | "TREINO" });
  const [fNoticia, setFNoticia] = useState({ titulo: "", data: "", categoria: "Clube", imagem: "" });
  const [fParceiro, setFParceiro] = useState({ nome: "", tipo: "Apoiador", detalhe: "", nivel: "BRONZE" as "OURO" | "PRATA" | "BRONZE" });
  const [fGaleria, setFGaleria] = useState({ url: "", tipo: "FOTO" as GaleriaItem["tipo"] });
  const [fDoc, setFDoc] = useState({ nome: "" });
  const [fAviso, setFAviso] = useState({ titulo: "" });
  const [fPin, setFPin] = useState("");
  const [busyGal, setBusyGal] = useState(false);
  const galRef = useRef<HTMLInputElement>(null);

  const naoLidos = site.notificacoes.filter((n) => !n.lida).length;

  const atalhos: { aba: Exclude<Aba, "geral">; titulo: string; desc: string; badge?: string }[] = [
    { aba: "escudo", titulo: "Escudo e capa", desc: "Símbolo + fundo da home" },
    { aba: "atletas", titulo: "Atletas", desc: "Elenco oficial", badge: String(site.atletas.length) },
    { aba: "agenda", titulo: "Eventos", desc: "Jogos e treinos", badge: String(site.eventos.length) },
    { aba: "jogos", titulo: "Jogos", desc: "Próximo + resultado" },
    { aba: "noticias", titulo: "Notícias", desc: "Publicar novidades", badge: String(site.noticias.length) },
    { aba: "galeria", titulo: "Galeria", desc: "Fotos e vídeos", badge: String(site.galeria.length) },
    { aba: "parceiros", titulo: "Parceiros", desc: "Patrocinadores", badge: String(site.parceiros.length) },
    { aba: "captacao", titulo: "Captação", desc: "Valores do projeto" },
    { aba: "documentos", titulo: "Documentos", desc: "Transparência", badge: String(site.documentos.length) },
    { aba: "avisos", titulo: "Avisos", desc: "Notificações push", badge: naoLidos > 0 ? `${naoLidos} novos` : undefined },
    { aba: "pin", titulo: "PIN", desc: "Código de acesso" },
  ];

  async function importarGaleria(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusyGal(true);
    try {
      const urls = await processImageFiles(files, "galeria");
      site.update({ galeria: [...urls.map((url) => ({ id: uid(), url, tipo: fGaleria.tipo })), ...site.galeria] });
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

      <div className="no-scrollbar -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-extrabold tracking-wide ${aba === a.id ? "bg-red-600 text-white" : "bg-[#151517] text-zinc-400 ring-1 ring-white/10"}`}
          >
            {a.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-3 pb-4">
        {aba === "geral" && (
          <>
            <Sec title="Atalhos rápidos" sub="Toque para ir direto à área que quer mexer.">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {atalhos.map((a) => (
                  <button
                    key={a.aba}
                    onClick={() => setAba(a.aba)}
                    className="press flex items-center gap-2.5 rounded-xl bg-black/30 p-3 text-left ring-1 ring-white/10"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[13px] font-bold">
                        {a.titulo}
                        {a.badge && (
                          <span className="rounded-md bg-red-600/20 px-1.5 py-0.5 text-[10px] font-extrabold text-red-300">
                            {a.badge}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-[11px] text-zinc-500">{a.desc}</span>
                    </span>
                    <Icon name="chevron" size={16} className="shrink-0 text-zinc-600" />
                  </button>
                ))}
              </div>
            </Sec>
            <Sec title="Zona de segurança" sub="Cuidado: apaga tudo que foi personalizado.">
              <button
                onClick={() => { if (confirm("Restaurar todo o conteúdo padrão?")) site.reset(); }}
                className="press w-full rounded-xl bg-white/5 py-2.5 text-xs font-bold text-zinc-400 ring-1 ring-white/10"
              >
                Restaurar conteúdo padrão
              </button>
            </Sec>
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
          <Sec title="Atletas" sub="Cadastrar, editar número/posição e excluir.">
            <div className="grid grid-cols-2 gap-2">
              <Field value={fAtleta.nome} onChange={(e) => setFAtleta({ ...fAtleta, nome: e.target.value.toUpperCase() })} placeholder="Nome completo" />
              <Field value={fAtleta.posicao} onChange={(e) => setFAtleta({ ...fAtleta, posicao: e.target.value })} placeholder="Posição" />
              <Field value={fAtleta.nasc} onChange={(e) => setFAtleta({ ...fAtleta, nasc: e.target.value })} placeholder="Nasc. 01/01/2011" />
              <Field value={fAtleta.numero} inputMode="numeric" onChange={(e) => setFAtleta({ ...fAtleta, numero: e.target.value })} placeholder="Nº camisa" />
            </div>
            <button
              onClick={() => {
                if (!fAtleta.nome.trim()) return alert("Informe o nome do atleta.");
                site.update({ atletas: [...site.atletas, { id: uid(), nome: fAtleta.nome.trim(), posicao: fAtleta.posicao || "—", nasc: fAtleta.nasc || "—", numero: Number(fAtleta.numero) || 0 }] });
                setFAtleta({ nome: "", posicao: "", nasc: "", numero: "" });
              }}
              className="press w-full rounded-xl bg-red-600 py-2.5 text-sm font-extrabold"
            >
              ADICIONAR ATLETA
            </button>
            {site.atletas.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-xl bg-black/30 p-2 ring-1 ring-white/10">
                <input value={a.numero} inputMode="numeric" onChange={(e) => site.update({ atletas: site.atletas.map((x) => (x.id === a.id ? { ...x, numero: Number(e.target.value) || 0 } : x)) })} className="w-12 rounded-lg bg-black/50 p-1.5 text-center text-sm font-extrabold outline-none ring-1 ring-white/10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold">{a.nome}</p>
                  <p className="truncate text-[11px] text-zinc-500">{a.posicao} • {a.nasc}</p>
                </div>
                <Del onClick={() => site.update({ atletas: site.atletas.filter((x) => x.id !== a.id) })} />
              </div>
            ))}
          </Sec>
        )}

        {aba === "agenda" && (
          <Sec title="Eventos da agenda" sub="Jogos e treinos exibidos no calendário.">
            <div className="grid grid-cols-3 gap-2">
              <Field value={fEvento.dia} inputMode="numeric" maxLength={2} onChange={(e) => setFEvento({ ...fEvento, dia: e.target.value })} placeholder="Dia" />
              <Field value={fEvento.mes} onChange={(e) => setFEvento({ ...fEvento, mes: e.target.value.toUpperCase() })} placeholder="Mês" />
              <Field value={fEvento.hora} onChange={(e) => setFEvento({ ...fEvento, hora: e.target.value })} placeholder="Hora" />
            </div>
            <Field value={fEvento.detalhe} onChange={(e) => setFEvento({ ...fEvento, detalhe: e.target.value })} placeholder="Ex: Spartax x A.E. Clube — Estádio Municipal" />
            <div className="grid grid-cols-2 gap-2">
              {(["JOGO", "TREINO"] as const).map((t) => (
                <button key={t} onClick={() => setFEvento({ ...fEvento, tipo: t })} className={`rounded-xl py-2 text-xs font-extrabold ${fEvento.tipo === t ? "bg-red-600" : "bg-black/40 text-zinc-400 ring-1 ring-white/10"}`}>{t}</button>
              ))}
            </div>
            <button
              onClick={() => {
                if (!fEvento.dia || !fEvento.hora) return alert("Informe dia e hora.");
                site.update({ eventos: [...site.eventos, { id: uid(), dia: fEvento.dia, mes: fEvento.mes || "MAI", hora: fEvento.hora, titulo: fEvento.tipo, detalhe: fEvento.detalhe || (fEvento.tipo === "JOGO" ? "Jogo" : "Treino no CT"), tipo: fEvento.tipo }] });
                setFEvento({ dia: "", mes: "MAI", hora: "", titulo: "Treino no CT", detalhe: "", tipo: "TREINO" });
              }}
              className="press w-full rounded-xl bg-red-600 py-2.5 text-sm font-extrabold"
            >
              CRIAR EVENTO
            </button>
            {site.eventos.map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-xl bg-black/30 p-2 ring-1 ring-white/10">
                <span className={`rounded-md px-2 py-1 text-[10px] font-extrabold ${e.tipo === "JOGO" ? "bg-red-600" : "bg-white/10 text-zinc-300"}`}>{e.tipo}</span>
                <p className="min-w-0 flex-1 truncate text-xs"><b>{e.dia}/{e.mes} {e.hora}</b> — {e.detalhe}</p>
                <Del onClick={() => site.update({ eventos: site.eventos.filter((x) => x.id !== e.id) })} />
              </div>
            ))}
          </Sec>
        )}

        {aba === "jogos" && (
          <>
            <Sec title="Próximo jogo" sub="Card destaque da home.">
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
            </Sec>
            <Sec title="Banner do confronto" sub="Arte estilo flyer gerada com os dados acima.">
              <BannerTools />
            </Sec>
            <Sec title="Último resultado" sub="Placar exibido na tela Jogos.">
              <div className="grid grid-cols-2 gap-2">
                <Field value={site.ultimoJogo.casa} onChange={(e) => site.update({ ultimoJogo: { ...site.ultimoJogo, casa: e.target.value.toUpperCase() } })} placeholder="Casa (sigla)" />
                <Field value={site.ultimoJogo.fora} onChange={(e) => site.update({ ultimoJogo: { ...site.ultimoJogo, fora: e.target.value.toUpperCase() } })} placeholder="Fora (sigla)" />
                <Field value={String(site.ultimoJogo.golsCasa)} inputMode="numeric" onChange={(e) => site.update({ ultimoJogo: { ...site.ultimoJogo, golsCasa: Number(e.target.value) || 0 } })} placeholder="Gols casa" />
                <Field value={String(site.ultimoJogo.golsFora)} inputMode="numeric" onChange={(e) => site.update({ ultimoJogo: { ...site.ultimoJogo, golsFora: Number(e.target.value) || 0 } })} placeholder="Gols fora" />
              </div>
              <Field value={site.ultimoJogo.data} onChange={(e) => site.update({ ultimoJogo: { ...site.ultimoJogo, data: e.target.value } })} placeholder="Data — ex: 18 MAI" />
            </Sec>
            <Sec title="Classificação" sub="Pontos e saldo calculados sozinhos (P = V×3 + E). Forma: letras V/E/D, ex VVEVD.">
              {site.classificacao.map((t) => (
                <div key={t.id} className="rounded-xl bg-black/30 p-2 ring-1 ring-white/10">
                  <div className="flex items-center gap-1.5">
                    <Field value={t.sigla} maxLength={3} onChange={(e) => site.update({ classificacao: site.classificacao.map((x) => (x.id === t.id ? { ...x, sigla: e.target.value.toUpperCase() } : x)) })} placeholder="SIG" className="w-14 text-center font-extrabold" />
                    <Field value={t.time} onChange={(e) => site.update({ classificacao: site.classificacao.map((x) => (x.id === t.id ? { ...x, time: e.target.value } : x)) })} placeholder="Nome do time" />
                    <Del onClick={() => site.update({ classificacao: site.classificacao.filter((x) => x.id !== t.id) })} />
                  </div>
                  <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                    {(["j", "v", "e", "d", "gp", "gc"] as const).map((k) => (
                      <label key={k} className="text-center">
                        <span className="text-[9px] font-extrabold text-zinc-500">{k.toUpperCase()}</span>
                        <input value={t[k]} inputMode="numeric" onChange={(e) => site.update({ classificacao: site.classificacao.map((x) => (x.id === t.id ? { ...x, [k]: Number(e.target.value) || 0 } : x)) })} className="w-full rounded-lg bg-black/50 p-1.5 text-center text-sm font-bold outline-none ring-1 ring-white/10" />
                      </label>
                    ))}
                    <label className="text-center">
                      <span className="text-[9px] font-extrabold text-zinc-500">FORMA</span>
                      <input value={t.forma} maxLength={5} onChange={(e) => site.update({ classificacao: site.classificacao.map((x) => (x.id === t.id ? { ...x, forma: e.target.value.toUpperCase().replace(/[^VED]/g, "") } : x)) })} className="w-full rounded-lg bg-black/50 p-1.5 text-center text-sm font-bold outline-none ring-1 ring-white/10" />
                    </label>
                  </div>
                  <p className="mt-1 text-right text-[11px] text-zinc-500">{t.v * 3 + t.e} pts • saldo {t.gp - t.gc > 0 ? `+${t.gp - t.gc}` : t.gp - t.gc}</p>
                </div>
              ))}
              <button
                onClick={() => site.update({ classificacao: [...site.classificacao, { id: uid(), time: "Novo time", sigla: "NOV", j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, forma: "" }] })}
                className="press w-full rounded-xl bg-white/5 py-2.5 text-xs font-bold ring-1 ring-white/10"
              >
                + Adicionar time
              </button>
            </Sec>
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
            <button
              onClick={() => {
                if (!fNoticia.titulo.trim()) return alert("Informe o título.");
                site.update({ noticias: [{ id: uid(), titulo: fNoticia.titulo, data: fNoticia.data || "hoje", categoria: fNoticia.categoria || "Clube", imagem: fNoticia.imagem || site.heroImagem }, ...site.noticias] });
                setFNoticia({ titulo: "", data: "", categoria: "Clube", imagem: "" });
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
            <button
              onClick={() => {
                if (!fGaleria.url.trim()) return;
                site.update({ galeria: [{ id: uid(), url: fGaleria.url.trim(), tipo: fGaleria.tipo }, ...site.galeria] });
                setFGaleria({ url: "", tipo: "FOTO" });
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
            <button
              onClick={() => {
                if (!fParceiro.nome.trim()) return alert("Informe o nome.");
                site.update({ parceiros: [...site.parceiros, { id: uid(), nome: fParceiro.nome.trim(), tipo: fParceiro.tipo || "Apoiador", detalhe: fParceiro.detalhe || "", cor: "bg-red-600", nivel: fParceiro.nivel }] });
                setFParceiro({ nome: "", tipo: "Apoiador", detalhe: "", nivel: "BRONZE" });
              }}
              className="press w-full rounded-xl bg-red-600 py-2.5 text-sm font-extrabold"
            >
              ADICIONAR PARCEIRO
            </button>
            {site.parceiros.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl bg-black/30 p-2 ring-1 ring-white/10">
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
        )}
      </div>
    </div>
  );
}
