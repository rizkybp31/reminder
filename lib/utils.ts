import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripHtml(html: string) {
  if (!html) return "";
  
  // 1. Ganti tag block (<p>, <br>, <div>) dengan newline agar tidak menempel
  // Kita tambahkan newline setelah </p> </div> dan ganti <br> dengan newline
  let text = html
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n");
  
  // 2. Hapus semua tag HTML lainnya
  text = text.replace(/<[^>]*>/g, "");
  
  // 3. Dekode common HTML entities
  const entities: { [key: string]: string } = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&lsquo;": "'",
    "&rsquo;": "'",
    "&ldquo;": '"',
    "&rdquo;": '"',
  };
  
  text = text.replace(/&[a-z0-9#]+;/gi, (match) => {
    return entities[match.toLowerCase()] || match;
  });

  // 4. Bersihkan spasi dan newline berlebih
  return text.trim().replace(/\n{3,}/g, "\n\n");
}
