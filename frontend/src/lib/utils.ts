export function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('998')) {
    return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
  }
  return raw;
}

export function maskPhone(raw: string) {
  const d = raw.replace(/\D/g, '');
  if (d.length === 12) return `+998 ${d.slice(3, 5)} *** ** **`;
  return '+998 ** *** ** **';
}

// Stable pseudo-random offset (≈300–500 m) so the approximate circle never centres on the real building.
export function approxPoint(id: string, lat: number, lng: number) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const angle = ((h >>> 0) % 360) * (Math.PI / 180);
  const dist = 0.003 + (((h >>> 8) % 100) / 100) * 0.002;
  return { lat: lat + Math.sin(angle) * dist, lng: lng + Math.cos(angle) * dist * 1.3 };
}

export function osmEmbed(lat: number, lng: number, zoomDelta: number, marker: boolean) {
  const bbox = [lng - zoomDelta * 1.6, lat - zoomDelta, lng + zoomDelta * 1.6, lat + zoomDelta].map((n) => n.toFixed(5));
  const m = marker ? `&marker=${lat.toFixed(5)},${lng.toFixed(5)}` : '';
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox.join('%2C')}&layer=mapnik${m}`;
}

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',');
  const mime = head.match(/data:(.*?);/)?.[1] ?? 'image/jpeg';
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function compressImage(file: File, maxSide = 1280, quality = 0.78): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
