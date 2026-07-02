// Local fallback perspectives for the three designers seeded in the DNA
// graph — used when Gemini is unavailable, and as a starting voice the
// Gemini prompt is steered toward.
const LOCAL_PERSPECTIVES: Record<string, string> = {
  "Maison Margiela":
    "Kusuru sakla değil, ön plana çıkar. Dikişi görünür bırak, malzemeyi olduğu gibi bırak — mükemmellik değil, iz peşinde koş.",
  "Ann Demeulemeester":
    "Sertlik ve kırılganlığı aynı silüette taşı. Siyahı çoğaltmak yerine, tek bir akışkan hatta topla.",
  "Yohji Yamamoto":
    "Vücudu göstermek zorunda değilsin. Kumaşın kendi ağırlığıyla düşmesine izin ver, asimetriden korkma.",
};

export function localWhatWouldTheyDo(designerName: string): string {
  return (
    LOCAL_PERSPECTIVES[designerName] ??
    "Bu referansı daha çok çalışman gerekiyor — şu an için net bir bakış açısı çıkaramadım."
  );
}
