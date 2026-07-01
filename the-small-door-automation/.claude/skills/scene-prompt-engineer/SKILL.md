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
words, too wide shot making characters tiny, characters same color as each
other, missing eyes or mouth on characters
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
