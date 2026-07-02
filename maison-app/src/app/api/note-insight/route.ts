import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";
import { localNoteInsight } from "@/lib/note-insight";

const SYSTEM_PROMPT = `Sen Maison adlı bir moda tasarım stüdyosu uygulamasının
asistanısın. Kullanıcı bir koleksiyon projesi için serbest not yazıyor. Bu
notu okuyup 1-2 cümlelik kısa bir geri bildirim yaz: notu hangi başlık
altında kategorize ettiğini söyle (örn. "Konsept Notları", "Kumaş
Referansları", "Palet Notları" gibi projeye uygun bir başlık seç) ve
istersen kısa bir öneri ekle. Türkçe yaz, sıcak ama kısa tut. Düz metin
yaz — markdown, yıldız işareti, madde imi ya da başlık biçimlendirmesi
kullanma; çıktı doğrudan arayüzde düz yazı olarak gösterilecek.`;

export async function POST(request: Request) {
  const { projectName, notes } = (await request.json()) as {
    projectName?: string;
    notes?: string;
  };

  if (!projectName || !notes || !notes.trim()) {
    return Response.json({ error: "projectName and notes are required" }, { status: 400 });
  }

  const fallback = () =>
    Response.json({ insight: localNoteInsight(projectName), source: "local" });

  const client = getGeminiClient();
  if (!client) return fallback();

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Proje: ${projectName}\nNot: ${notes}`,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const insight = response.text?.trim();
    if (!insight) throw new Error("Empty Gemini response");

    return Response.json({ insight, source: "gemini" });
  } catch {
    return fallback();
  }
}
