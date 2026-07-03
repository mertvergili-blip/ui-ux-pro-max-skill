// Downscales to a tiny canvas and averages the pixels — a fabric swatch
// photo is close enough to one uniform color/texture that a plain average
// reads as "the color of this fabric" without needing real clustering.
export function dominantColorFromImage(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(null);
    img.onload = () => {
      const size = 24;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      try {
        const { data } = ctx.getImageData(0, 0, size, size);
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
      } catch {
        resolve(null);
        return;
      }
      if (count === 0) {
        resolve(null);
        return;
      }
      const toHex = (v: number) => Math.round(v / count).toString(16).padStart(2, "0");
      resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    };
    img.src = dataUrl;
  });
}
