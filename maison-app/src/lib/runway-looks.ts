export interface CuratedRunwayShow {
  id: string;
  designer: string;
  season: string;
  // A real WWD runway review page — verified to exist and to carry its own
  // og:image (the publisher's own preview image for that page). We fetch
  // that image server-side rather than hotlinking a gallery, and this link
  // is also where "View full collection" points instead of us mirroring
  // Vogue Runway/WWD's actual photography.
  reviewUrl: string;
  // Used only if the og:image fetch fails — drives the editorial
  // placeholder's gradient, not meant to look like a photo.
  palette: [string, string];
  mood: string;
}

export const CURATED_RUNWAY_SHOWS: CuratedRunwayShow[] = [
  {
    id: "rick-owens-ss25",
    designer: "Rick Owens",
    season: "SS25",
    reviewUrl: "https://wwd.com/runway/spring-2025/paris/rick-owens/review/",
    palette: ["#e8e3d8", "#0c0b09"],
    mood: "Sert siluet, ham beton tonları",
  },
  {
    id: "prada-fw25",
    designer: "Prada",
    season: "FW25",
    reviewUrl: "https://wwd.com/runway/fall-2025/milan/prada/review/",
    palette: ["#7a2e2e", "#f2ede2"],
    mood: "Grafik kontrast, bordo/krem",
  },
  {
    id: "bottega-veneta-ss25",
    designer: "Bottega Veneta",
    season: "SS25",
    reviewUrl: "https://wwd.com/runway/spring-2025/milan/bottega-veneta/review/",
    palette: ["#5c6b52", "#e7e2d4"],
    mood: "Zanaat odaklı, yosun yeşili",
  },
  {
    id: "jil-sander-fw25",
    designer: "Jil Sander",
    season: "FW25",
    reviewUrl: "https://wwd.com/runway/fall-2025/milan/jil-sander/review/",
    palette: ["#e7e2d4", "#100d09"],
    mood: "Radikal sadelik, kırık beyaz",
  },
];
