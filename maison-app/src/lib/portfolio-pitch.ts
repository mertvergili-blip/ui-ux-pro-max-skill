export function localPortfolioPitch(name: string, status: string): string {
  const clean = name.replace(/^Koleksiyon\s+[IVX]+\s*—\s*/i, "");
  return status === "Archived"
    ? `${clean} — tamamlanmış bir koleksiyon, portfolyoda referans niteliğinde.`
    : `${clean} — üzerinde çalışılan, henüz portfolyoya hazır olmayan bir koleksiyon.`;
}
