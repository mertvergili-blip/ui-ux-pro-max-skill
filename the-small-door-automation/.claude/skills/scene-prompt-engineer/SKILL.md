---
name: scene-prompt-engineer
description: Use this skill to convert a finished script's scene breakdown into concrete AI video generation prompts (one per scene) with visual, camera, lighting, mood, detail, negative prompt, and continuity notes. Invoke after cinematic-scriptwriter and before kling-video-producer.
---

# Scene Prompt Engineer

Converts each scene from a script into a Kling-ready prompt.
Always applies the Character Chaos Visual Identity and Visual Clarity Rule.

## Mandatory Pre-Prompt Step: Character Design

Before writing any scene prompt, define the characters:

1. main character type (what object/creature)
2. face design (eyes, eyebrows, mouth — must be explicitly described)
3. emotional expression per scene
4. body language / pose
5. signature silhouette
6. key accessory / prop
7. color identity (must be distinct from any rival/opponent)
8. comedic contrast
9. rival/opponent contrast (if applicable)
10. how the character reads in 1 second

These character definitions must carry through ALL scenes unchanged
(continuity_notes field).

## Mandatory: Character Reference Sheet Before Any Scene Prompt (2026-07-01)

Research into why 042 had broken character continuity (Charger vanishing,
a human-like figure appearing mid-scene) found the root cause: prompts
written from a long text description alone, fed to pure text2video, let
the model reinterpret the character from scratch on every single scene —
see `data/ai_video_quality_research_2026.md`. Two changes are now mandatory:

1. **Generate a reference sheet image first.** For every named recurring
   character, run `scripts/generate_character_reference.py` (Kling's own
   text2image endpoint, no new API key needed) BEFORE writing any scene
   video prompt. The reference prompt itself must already respect the
   2-3 descriptor cap below.
2. **Cap character descriptors at 2-3 per prompt: one silhouette element +
   one identifying color/texture.** Research across 1,800 character-driven
   Kling generations found 2-3 descriptors produce consistent results 78%
   of the time, while 8+ descriptors reliably produce "muddled"/drifting
   output — which is what our old multi-sentence character_design fields
   were doing. Do not re-describe the full character paragraph in every
   scene prompt; the bound reference image carries that, not the text.
3. **Trait-lock exact wording.** Whatever words describe the character in
   the reference-sheet prompt (e.g. "pale faded yellow-white", "bright
   vivid orange") must be repeated verbatim in every scene prompt for that
   character — never swap in a synonym ("orange" -> "amber") between
   scenes; that alone is enough to reintroduce drift.

## Mandatory: Role Costume Before Any Prompt (Reference Set 02)

Bir karakter prompt'a yazılmadan önce ROL KOSTÜMÜ zorunludur. Her karakterin
tek bir güçlü aksesuarı rolünü/türünü anında tanımlamalı:
beanie+plan=burglar, helmet+flag=astronaut, cowboy hat+holster=gunslinger,
necktie=office worker, gold chain=streetwise rival, opera cape=performer,
visor=dealer, wig+gavel=judge, eye patch+hook=pirate.

Aksesuarsız karakter YASAK. Multi-scene hikayede aksesuar tüm sahnelerde
birebir sabit kalır (continuity_notes).

## Mandatory: Talking / Action Character Face Must Be Large and Readable

Her sahnede konuşan veya ana aksiyonu yapan karakterin yüzü frame'de büyük
ve okunur olmalı (göz + kaş + ağız net). Konuşan karakter kameraya veya 3/4
dönük olmalı — diyalog sırasında sırtı dönük karakter YASAK. Ağız hareketi
diyalog sahnelerinde prompt'a açıkça yazılır (pipeline audio-driven lip-sync
DESTEKLEMEZ — mouth movement görsel olarak istenir).

Boyut kontrastı (büyük tehditkâr vs küçük çaresiz) rol dağılımını okutmak
için renk kontrastına ek araç olarak kullanılabilir.

## Mandatory: No Text / Logo / Caption Inside Generated Clips

Referans görsellerdeki panel başlıkları, neon yazılar, el yazısı notlar,
tabelalar, error/UI ekranları ve konuşma balonu metinleri stilin parçası
DEĞİLDİR ve prompt'a taşınmaz. Her sahnede clip içinde text, caption, neon
yazı, tabela, UI text, konuşma balonu, logo, marka, watermark, okunabilir
yazı ÜRETİLMEZ. Tüm captionlar yalnızca post-edit aşamasında eklenir. Bu
kural negative prompt ile de zorlanır (aşağıya bakınız).

## Per-Scene Output Fields

- `scene_number`
- `duration`
- `visual_prompt` — Character Chaos style prefix + scene-specific subject/action/light
- `camera_motion`
- `lighting`
- `mood`
- `details`
- `negative_prompt` — always the full block (see below)
- `continuity_notes` — character color, accessory, expression must match prior scenes
- `caption_cue` — short censored caption text for this scene
- `audio_cue` — SFX / voice cue description
- `reference_image` — path/URL to the character's reference sheet from
  `generate_character_reference.py`, set on every scene that character
  appears in (omit only for character-free establishing/object-only shots;
  `kling-video-producer` falls back to text2video when this is absent)

## Base Visual Style (always include at start of visual_prompt)

```
large expressive anthropomorphic characters, absurd object-creatures,
readable eyes/eyebrows/mouth, strong facial expressions, clear pose and
action, center-weighted composition, bold readable silhouettes, weird
serious-comedic tone, adult-cartoon energy, internet-chaos humor, bright
readable lighting, clear action first cinematic second, minimal background
distraction, strong thumbnail readability, stylized but not childish,
absurd but instantly understandable, no text no caption no watermark no
logos no brand packaging
```

## Scene Action Requirement

Every scene prompt must contain a single clear action statement:
"[character] [does what] → [result/reaction]"

Examples:
- "wheat_bread leans toward dark_rye with red gloves raised, trash-talking"
- "dark_rye throws a single punch, wheat_bread flies backward with cartoon KO eyes"
- "dark_rye rises from the toaster slot holding a gold championship belt"

If the action cannot be stated in one sentence, the scene is too complex —
simplify before prompting.

## Visual Clarity Rule (apply to every scene)

1. Ana karakterler sahnenin merkezinde ve net olmalı.
2. Objeler insan gibi davranabilir — orijinal, telifsiz, on-brand.
3. Aksiyon altyazısız ve sessiz izlenince anlaşılmalı.
4. İç dünya net okunmalı — çok karanlık veya çok soyut olmamalı.
5. Clear WTF action first — cinematic texture asla okunurluğu feda ettirmemeli.
6. Caption-safe boşluk bırak (üst %20, alt %15).
7. Viral short gibi: hızlı, anlaşılır, komik, WTF.
8. Thumbnail gücü: tek karede ilgi çekmeli.
9. Arka plan destekleyici, ana karakter baskın.
10. Ses kapalı izlenince bile "ne oluyor" anlaşılmalı.

## Negative Prompt (mandatory on every scene, no exceptions)

```
real human, real person, celebrity, famous character, copyrighted
character, brand logo, readable packaging, gore, blood, injury, realistic
violence, scary horror, preschool cartoon, messy AI, unclear action,
unclear characters, distorted faces, extra limbs, plastic toy look,
unreadable scene, abstract shapes, overly dark, hidden characters, blurry
fighters, text, caption, subtitle, watermark, on-screen letters, written
words, neon sign text, speech bubble, signage, shop sign, error screen text,
UI text, handwritten note, panel title, poster text, too wide shot making
characters tiny, characters same color as each other, missing eyes or mouth
on characters, back-facing character during dialogue
```

## Camera Rules

- Medium shot for action scenes (characters fill ≥60% of frame height)
- Close-up for reactions and punchlines
- Slow push-in for reveals
- Wide shot only for establishing shots — never for character action moments
- Static or minimal movement during key character moments

## Self-Check Before Writing Each Prompt

- Hook net mi?
- Ana karakter net mi?
- Görsel tek karede ilgi çekiyor mu?
- Aksiyon altyazısız anlaşılır mı?
- Komedi karakter davranışından geliyor mu?
- Fazla karanlık/soyut mu?
- Thumbnail gücü var mı?
- WTF hissi var mı — ama anlaşılır mı?

## Reference Image Policy

Referans görsel yüklendiğinde: stil standardını öğren, birebir kopyalama
yasak. "Same spirit, new original characters" mantığıyla üret. Gelecek
videolarda kendi kendine bu stile uygun özgün karakterler üret. Benden her
yeni video için yeni referans görsel bekleme.

## 5-Image Reference Set — Design Patterns (2026-07-01)

Bu referans setinden çıkarılan kalıplar. Birebir kopyalanmaz.

**ROL KOSTÜMÜ PRENSİBİ:** Her ana karakterin tek bir aksesuarı vardır ve
bu aksesuar rolü anında tanımlar:
- green visor → casino dealer
- whipped cream wig + gavel → judge
- eye patch + hook + pirate hat → pirate captain
- eraser mohawk + guitar → rock star
- black mask + loot bag → burglar

Her yeni karakterde önce ROL KOSTÜMÜNÜ belirle. Aksesuar olmadan karakter
prompt'a yazılmaz.

**İKİ KARAKTER DİNAMİĞİ:** Aktif/agresif + Reaktif/şaşkın. Renk kontrastı
zorunlu (açık vs koyu). Beden dili: saldıran leans forward, savunan leans
back.

**CONTAINER-AS-FRAME:** Dış obje sahneyi çerçeveler; iç dünya baskın.
Prompt'ta container'ı describe et ama iç karakterleri ön plana çıkar.

**CROWD:** Arka planda küçük ekspresif seyirci figürleri — enerji katar,
ana aksiyonu boğmaz.

**ZEMIN/SAHNE:** Tematik zemin dünyayı kurar (roulette table / judge bench /
soapy water + treasure chest / ruler stage / gold vault floor). Tek bakışta
"neredeyiz" anlaşılır.

Checklist: `data/visual_clarity_checklist_master.md`

## Output

Write results to `outputs/metadata/<video_id>_scenes.json`.
Use `scripts/generate_scene_prompts.py` to scaffold the file.
