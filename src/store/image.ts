/** Lê um arquivo de imagem (galeria/câmera do celular) e devolve um dataURL
 *  redimensionado (máx. 1024px, JPEG ~0.82) para caber no armazenamento local. */

export function fileToResizedDataUrl(file: File, maxDim = 1024, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("not-image"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no-canvas");
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load-fail"));
    };
    img.src = url;
  });
}

export function filesToResizedDataUrls(files: FileList | File[], maxDim = 1024, quality = 0.82): Promise<string[]> {
  const list = Array.from(files);
  return Promise.all(list.map((f) => fileToResizedDataUrl(f, maxDim, quality)));
}
