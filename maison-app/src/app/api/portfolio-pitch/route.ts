import { getGeminiClient, generateWithFallback } from "@/lib/gemini";
import { localPortfolioPitch } from "@/lib/portfolio-pitch";
import { requireSession } from "@/lib/auth";

const SYSTEM_PROMPT = `Sen Maison adlı bir moda tasarım stüdyosu uygulamasının
asistanısın. Kullanıcı bir koleksiyonun adını, durumunu (In Progress/Archived)
ve kısa notunu verecek. Bu koleksiyon için, bir portfolyoda kullanılabilecek,
1 cümlelik iddialı ve profesyonel bir tanıtım metni yaz. Türkçe yaz, düz metin
— markdown, yıldız işareti kullanma. Uydurma detay ekleme, sadece verilen
bilgiyi zarif bir cümleye dönüştür.`;

export async function POST(request: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const { name, status, sub } = (await request.json()) as {
    name?: string;
    status?: string;
    sub?: string;
  };

  if (!name || !status) {
    return Response.json({ error: "name and status are required" }, { status: 400 });
  }

  const fallback = () =>
    Response.json({ pitch: localPortfolioPitch(name, status), source: "local" });

  const client = getGeminiClient();
  if (!client) return fallback();

  try {
    const response = await generateWithFallback(client, {
      contents: `Koleksiyon: ${name}\nDurum: ${status}\nNot: ${sub ?? ""}`,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const pitch = response.text?.trim();
    if (!pitch) throw new Error("Empty Gemini response");

    return Response.json({ pitch, source: "gemini" });
  } catch {
    return fallback();
  }
}
