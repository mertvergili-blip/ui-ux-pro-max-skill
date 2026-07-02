export interface Persona {
  id: string;
  name: string;
  role: string;
  accent: string; // css var
}

export const STUDIO_TEAM: Persona[] = [
  { id: "pragmatist", name: "Elif", role: "Pragmatist", accent: "var(--color-sage)" },
  { id: "risk-taker", name: "Yusuf", role: "Risk Alan", accent: "var(--color-rose)" },
  { id: "purist", name: "Nadia", role: "Purist", accent: "var(--color-blue)" },
  { id: "trend-chaser", name: "Cem", role: "Trend Avcısı", accent: "var(--color-gold)" },
];

export interface PersonaFeedback {
  personaId: string;
  message: string;
}

const LOCAL_LINES: Record<string, string[]> = {
  pragmatist: [
    "Üretim maliyetini düşündün mü? Fikir güzel ama uygulanabilirliği netleşmeli.",
    "Zaman çizelgesine sığar mı, önce onu kontrol et.",
    "Basitleştirilebilecek bir adım var gibi görünüyor.",
  ],
  "risk-taker": [
    "Daha ileri gidebilirsin — bu hâliyle biraz güvenli duruyor.",
    "Beklenmedik bir malzeme ya da form dener misin?",
    "Bu fikri sınırına kadar zorla, sonra geri çek.",
  ],
  purist: [
    "Silüetin temizliğine odaklan, gereksiz detayı ele.",
    "Zanaat detayına daha çok zaman ayır — burada kalite hissediliyor.",
    "Konsept net ama teknik uygulama biraz daha rafine olmalı.",
  ],
  "trend-chaser": [
    "Bu, şu anki sezon diline uyuyor ama bir adım öne çıkmalı.",
    "Renk paleti güncel ama forma daha cesur bir dokunuş ekleyebilirsin.",
    "Bunu sosyal medyada nasıl anlatırdın diye düşün.",
  ],
};

function pick(arr: string[], seed: number): string {
  return arr[seed % arr.length];
}

export function localStudioTeamFeedback(input: string): PersonaFeedback[] {
  const seed = input.length;
  return STUDIO_TEAM.map((p, i) => ({
    personaId: p.id,
    message: pick(LOCAL_LINES[p.id], seed + i),
  }));
}
