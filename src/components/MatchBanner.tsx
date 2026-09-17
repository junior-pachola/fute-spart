import html2canvas from "html2canvas";
import { Shield } from "./brand";
import { useSite } from "../store/site";

/**
 * Arte do confronto 1080x1350 estilo flyer.
 * IMPORTANTE: só inline styles com cores hex — html2canvas não entende
 * oklch/Tailwind. Não usar classes do Tailwind dentro deste nó.
 */

const DISPLAY = "'Barlow Condensed', 'Arial Narrow', sans-serif";
const INTER = "Inter, Arial, sans-serif";

function initials(nome: string): string {
  return nome.split(" ").map((p) => p[0]).join("").slice(0, 3).toUpperCase();
}

export function MatchBannerArt({ innerRef }: { innerRef?: React.Ref<HTMLDivElement> }) {
  const site = useSite();
  const j = site.proximoJogo;

  const casaShield = j.casaEscudo ? (
    <img src={j.casaEscudo} alt={j.casa} crossOrigin="anonymous" style={{ width: 300, height: 300, objectFit: "contain" }} />
  ) : (
    <Shield size={300} primaria={site.escudo.primaria} secundaria={site.escudo.secundaria} nome={site.escudo.nome} />
  );

  const foraShield = j.foraEscudo ? (
    <img src={j.foraEscudo} alt={j.fora} crossOrigin="anonymous" style={{ width: 300, height: 300, objectFit: "contain" }} />
  ) : (
    <div style={{ width: 300, height: 300, borderRadius: 150, backgroundColor: "#18181b", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: DISPLAY, fontSize: 110, fontStyle: "italic", fontWeight: 800, color: "#ffffff" }}>{initials(j.fora)}</span>
    </div>
  );

  return (
    <div ref={innerRef} style={{ width: 1080, height: 1350, backgroundColor: "#0b0b0c", position: "relative", overflow: "hidden", fontFamily: INTER }}>
      {/* fundo */}
      <img src={site.heroImagem} alt="" crossOrigin="anonymous" style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1350, objectFit: "cover", opacity: 0.35 }} />
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1350, background: "linear-gradient(180deg, rgba(11,11,12,0.55) 0%, rgba(122,12,30,0.55) 45%, rgba(11,11,12,0.96) 100%)" }} />

      {/* faixa superior */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 46, background: "repeating-linear-gradient(-45deg, #C8102E 0px, #C8102E 34px, #0b0b0c 34px, #0b0b0c 68px)" }} />

      {/* título */}
      <div style={{ position: "absolute", top: 90, left: 0, width: 1080, textAlign: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 92, fontWeight: 700, letterSpacing: 14, color: "#ffffff" }}>PRÓXIMO</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 148, fontWeight: 800, letterSpacing: 4, color: "#ffffff", lineHeight: 1, marginTop: -10 }}>CONFRONTO</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 54, fontWeight: 600, letterSpacing: 22, color: "#e4e4e7", marginTop: 8 }}>{j.competicao || "AMISTOSO"}</div>
      </div>

      {/* cards dos times */}
      <div style={{ position: "absolute", top: 560, left: 60, width: 960, display: "flex", alignItems: "stretch", justifyContent: "space-between" }}>
        <div style={{ width: 430, backgroundColor: "#ffffff", borderRadius: 36, paddingTop: 44, paddingBottom: 36, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>{casaShield}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 56, fontWeight: 800, fontStyle: "italic", color: "#18181b", marginTop: 24, paddingLeft: 16, paddingRight: 16 }}>{j.casa}</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 6, color: "#71717a", marginTop: 4 }}>CASA</div>
        </div>
        <div style={{ width: 430, backgroundColor: "#ffffff", borderRadius: 36, paddingTop: 44, paddingBottom: 36, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>{foraShield}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 56, fontWeight: 800, fontStyle: "italic", color: "#18181b", marginTop: 24, paddingLeft: 16, paddingRight: 16 }}>{j.fora}</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 6, color: "#71717a", marginTop: 4 }}>VISITANTE</div>
        </div>
      </div>

      {/* VS */}
      <div style={{ position: "absolute", top: 738, left: 480, width: 120, height: 120, borderRadius: 60, backgroundColor: "#C8102E", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 56, fontWeight: 800, fontStyle: "italic", color: "#ffffff" }}>VS</span>
      </div>

      {/* barra data/local/hora */}
      <div style={{ position: "absolute", top: 1120, left: 60, width: 960, backgroundColor: "#A50D26", borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 48, paddingRight: 48, paddingTop: 26, paddingBottom: 26 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 52, fontWeight: 800, fontStyle: "italic", color: "#ffffff" }}>{j.data}</span>
        <span style={{ fontFamily: DISPLAY, fontSize: 44, fontWeight: 700, color: "#ffffff", maxWidth: 460, textAlign: "center" }}>{j.local}</span>
        <span style={{ fontFamily: DISPLAY, fontSize: 52, fontWeight: 800, fontStyle: "italic", color: "#ffffff" }}>{j.hora}</span>
      </div>

      {/* rodapé */}
      <div style={{ position: "absolute", bottom: 0, left: 0, width: 1080, height: 90, background: "repeating-linear-gradient(-45deg, #C8102E 0px, #C8102E 34px, #0b0b0c 34px, #0b0b0c 68px)", opacity: 0.9 }} />
      <div style={{ position: "absolute", bottom: 24, left: 0, width: 1080, textAlign: "center", fontFamily: DISPLAY, fontSize: 40, fontWeight: 800, fontStyle: "italic", letterSpacing: 6, color: "#ffffff" }}>
        SOMOS TODOS {site.escudo.nome}
      </div>
    </div>
  );
}

async function renderBlob(el: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(el, { backgroundColor: "#0b0b0c", scale: 1, useCORS: true, logging: false });
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) throw new Error("render-fail");
  return blob;
}

export async function downloadBanner(el: HTMLElement, filename = "confronto-spartax.png"): Promise<void> {
  const blob = await renderBlob(el);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Compartilha (WhatsApp/Instagram/...) ou baixa se o aparelho não suportar. */
export async function shareBanner(el: HTMLElement, filename = "confronto-spartax.png"): Promise<"shared" | "downloaded"> {
  const blob = await renderBlob(el);
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Próximo confronto" });
    return "shared";
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "downloaded";
}
