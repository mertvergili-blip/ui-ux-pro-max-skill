import { Type } from "@google/genai";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";
import { STUDIO_TEAM, localStudioTeamFeedback, type PersonaFeedback } from "@/lib/studio-team";

const PERSONA_IDS = STUDIO_TEAM.map((p) => p.id);

const SYSTEM_PROMPT = `Sen Maison adlı bir moda tasarım stüdyosu uygulamasında,
dört farklı hayali stüdyo ekibi üyesinin sesisin. Kullanıcı bir tasarım fikri
ya da proje notu yazacak. Her bir persona için, o personanın bakış açısından
1 cümlelik kısa ve net bir geri bildirim yaz:

- pragmatist (Elif): maliyet, zaman, uygulanabilirlik odaklı, gerçekçi.
- risk-taker (Yusuf): daha cesur, sınırları zorlayan, güvenli seçimleri sorgulayan.
- purist (Nadia): zanaat, teknik kalite, silüet temizliği odaklı.
- trend-chaser (Cem): güncel sezon dili, pazarlanabilirlik, görünürlük odaklı.

Her mesaj Türkçe, sıcak ama doğrudan, en fazla 1 cümle olsun. Düz metin yaz —
markdown, yıldız işareti kullanma.`;

const RESPONSE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      personaId: { type: Type.STRING, enum: PERSONA_IDS },
      message: { type: Type.STRING },
    },
    required: ["personaId", "message"],
  },
};

export async function POST(request: Request) {
  const { text } = (await request.json()) as { text?: string };

  if (!text || !text.trim()) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const fallback = () =>
    Response.json({ feedback: localStudioTeamFeedback(text), source: "local" });

  const client = getGeminiClient();
  if (!client) return fallback();

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: text,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const parsed = JSON.parse(response.text ?? "[]") as PersonaFeedback[];

    const valid =
      Array.isArray(parsed) &&
      parsed.length === PERSONA_IDS.length &&
      parsed.every(
        (f) => f.personaId && PERSONA_IDS.includes(f.personaId) && f.message
      );

    if (!valid) throw new Error("Malformed Gemini response");

    return Response.json({ feedback: parsed, source: "gemini" });
  } catch {
    return fallback();
  }
}
