export interface RunwayLook {
  id: string;
  designer: string;
  season: string;
  lookNumber: number;
  totalLooks: number;
  palette: [string, string]; // core, accent — drives the generative silhouette card
  mood: string;
}

// Curated by season/designer, not fetched — hotlinking runway photography
// without a licensed feed isn't reliable, so each "look" is a generative
// silhouette card carrying the designer's real palette/mood language
// instead of a scraped image.
export const RUNWAY_LOOKS: RunwayLook[] = [
  { id: "ro-1", designer: "Rick Owens", season: "SS25", lookNumber: 1, totalLooks: 6, palette: ["#e8e3d8", "#0c0b09"], mood: "Sert siluet, ham beton tonları" },
  { id: "ro-2", designer: "Rick Owens", season: "SS25", lookNumber: 2, totalLooks: 6, palette: ["#d8d2c2", "#1a1714"], mood: "Asimetrik omuz, kül grisi" },
  { id: "ro-3", designer: "Rick Owens", season: "SS25", lookNumber: 3, totalLooks: 6, palette: ["#c9c2ae", "#100d09"], mood: "Uzatılmış silüet, monokrom" },
  { id: "ro-4", designer: "Rick Owens", season: "SS25", lookNumber: 4, totalLooks: 6, palette: ["#eee8db", "#211d18"], mood: "Sculptural drape, kemik beyazı" },
  { id: "ro-5", designer: "Rick Owens", season: "SS25", lookNumber: 5, totalLooks: 6, palette: ["#bfb8a3", "#0c0b09"], mood: "Ham kenar, brütalist form" },
  { id: "ro-6", designer: "Rick Owens", season: "SS25", lookNumber: 6, totalLooks: 6, palette: ["#e2dccb", "#171410"], mood: "Katmanlı volüm, taş grisi" },

  { id: "pr-1", designer: "Prada", season: "FW25", lookNumber: 1, totalLooks: 5, palette: ["#7a2e2e", "#f2ede2"], mood: "Grafik kontrast, bordo/krem" },
  { id: "pr-2", designer: "Prada", season: "FW25", lookNumber: 2, totalLooks: 5, palette: ["#3d5a6c", "#e7e2d4"], mood: "Entelektüel minimalizm, petrol mavisi" },
  { id: "pr-3", designer: "Prada", season: "FW25", lookNumber: 3, totalLooks: 5, palette: ["#c4a469", "#12100c"], mood: "Metalik aksan, siyah zemin" },
  { id: "pr-4", designer: "Prada", season: "FW25", lookNumber: 4, totalLooks: 5, palette: ["#5c6b52", "#efe9da"], mood: "Ordu yeşili, temiz çizgi" },
  { id: "pr-5", designer: "Prada", season: "FW25", lookNumber: 5, totalLooks: 5, palette: ["#a8666a", "#100d09"], mood: "Pudra gülü, keskin yaka" },

  { id: "bv-1", designer: "Bottega Veneta", season: "SS25", lookNumber: 1, totalLooks: 4, palette: ["#5c6b52", "#e7e2d4"], mood: "Zanaat odaklı, yosun yeşili" },
  { id: "bv-2", designer: "Bottega Veneta", season: "SS25", lookNumber: 2, totalLooks: 4, palette: ["#c4a469", "#1a1714"], mood: "Dokulu deri, bal rengi" },
  { id: "bv-3", designer: "Bottega Veneta", season: "SS25", lookNumber: 3, totalLooks: 4, palette: ["#3d5a6c", "#f2ede2"], mood: "Yumuşak drape, gece mavisi" },
  { id: "bv-4", designer: "Bottega Veneta", season: "SS25", lookNumber: 4, totalLooks: 4, palette: ["#7a2e2e", "#efe9da"], mood: "Sıcak toprak, sade form" },

  { id: "js-1", designer: "Jil Sander", season: "FW25", lookNumber: 1, totalLooks: 4, palette: ["#e7e2d4", "#100d09"], mood: "Radikal sadelik, kırık beyaz" },
  { id: "js-2", designer: "Jil Sander", season: "FW25", lookNumber: 2, totalLooks: 4, palette: ["#a8a196", "#171410"], mood: "Mimari kesim, taş grisi" },
  { id: "js-3", designer: "Jil Sander", season: "FW25", lookNumber: 3, totalLooks: 4, palette: ["#3d5a6c", "#e7e2d4"], mood: "Keskin hat, çelik mavisi" },
  { id: "js-4", designer: "Jil Sander", season: "FW25", lookNumber: 4, totalLooks: 4, palette: ["#c9bda2", "#100d09"], mood: "Yumuşak minimalizm, kum tonu" },
];
