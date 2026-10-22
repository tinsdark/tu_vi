function tai(blob: Blob, ten: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = ten;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function taiSvg(svg: string, ten: string) {
  tai(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${ten}.svg`);
}

/** SVG → PNG (vẽ qua canvas, nền trắng, gấp đôi độ phân giải). */
export async function taiPng(svg: string, ten: string, heSo = 2): Promise<void> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    await new Promise<void>((ok, loi) => { img.onload = () => ok(); img.onerror = () => loi(new Error("Không đọc được SVG")); img.src = url; });
    const cv = document.createElement("canvas");
    cv.width = img.naturalWidth * heSo;
    cv.height = img.naturalHeight * heSo;
    const g = cv.getContext("2d")!;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, cv.width, cv.height);
    g.drawImage(img, 0, 0, cv.width, cv.height);
    const blob = await new Promise<Blob | null>((ok) => cv.toBlob(ok, "image/png"));
    if (!blob) throw new Error("Không tạo được ảnh PNG");
    tai(blob, `${ten}.png`);
  } finally {
    URL.revokeObjectURL(url);
  }
}
