const CHALLENGES: string[] = [
  "Sadece 3 kumaşla bir look tasarla.",
  "Tek bir rengin 5 tonuyla bir kapsül koleksiyon krokisi çiz.",
  "Bir parçayı içi dışına çevirerek yeniden tasarla.",
  "Sadece düz çizgilerle (kavis yok) bir siluet oluştur.",
  "Dolabındaki en eski parçayı bugünün diliyle yeniden yorumla.",
  "10 dakikada, düşünmeden 5 croquis çiz.",
  "Bir mimari yapıdan ilham alan tek bir detay tasarla.",
  "Zıt iki dokuyu (sert/yumuşak) aynı parçada birleştir.",
  "Sıfır atıkla (fabric waste) bir aksesuar tasarla.",
  "Bugünkü ruh haline dayalı, kelime kullanmadan sadece renk ve form ile bir mood çiz.",
];

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

/**
 * "Ara sıra" — appears roughly every 3rd day, not constantly, so it stays a
 * treat rather than a chore. Deterministic per calendar day (same challenge
 * all day, changes daily) rather than random-per-render.
 */
export function getTodayCapsuleChallenge(): { id: string; text: string } | null {
  const today = new Date();
  const doy = dayOfYear(today);
  if (doy % 3 !== 0) return null;
  const text = CHALLENGES[doy % CHALLENGES.length];
  const id = today.toISOString().slice(0, 10);
  return { id, text };
}
