import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { isFirebaseConfigured, storage } from "../lib/firebase";
import { uid } from "./site";

/** Lê um arquivo de imagem (galeria/câmera do celular) e devolve um dataURL
 *  redimensionado (máx. 1024px, JPEG ~0.82) para caber no armazenamento local. */

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("not-image"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load-fail"));
    };
    img.src = url;
  });
}

function drawResized(img: HTMLImageElement, maxDim: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("encode-fail"))),
      "image/jpeg",
      quality
    );
  });
}

export async function fileToResizedDataUrl(file: File, maxDim = 1024, quality = 0.82): Promise<string> {
  const img = await loadImage(file);
  return drawResized(img, maxDim).toDataURL("image/jpeg", quality);
}

export function filesToResizedDataUrls(files: FileList | File[], maxDim = 1024, quality = 0.82): Promise<string[]> {
  return Promise.all(Array.from(files).map((f) => fileToResizedDataUrl(f, maxDim, quality)));
}

/**
 * Caminho principal de imagem do app:
 * - com Firebase configurado → sobe ao Storage e devolve a URL pública;
 * - sem Firebase → dataURL local (offline).
 */
export async function processImageFile(file: File, folder = "geral"): Promise<string> {
  if (isFirebaseConfigured && storage) {
    const img = await loadImage(file);
    const blob = await canvasToBlob(drawResized(img, 1280), 0.85);
    const path = `spartax/${folder}/${uid()}.jpg`;
    const snap = await uploadBytes(ref(storage, path), blob, { contentType: "image/jpeg" });
    return getDownloadURL(snap.ref);
  }
  return fileToResizedDataUrl(file);
}

export function processImageFiles(files: FileList | File[], folder = "geral"): Promise<string[]> {
  return Promise.all(Array.from(files).map((f) => processImageFile(f, folder)));
}
