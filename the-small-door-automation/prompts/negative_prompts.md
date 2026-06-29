# Negative Prompt — apply to every scene, every provider

```
human face, real person, celebrity, brand logo, readable brand text,
copyrighted character, cartoon, toy-like, childish colors, oversaturated,
plastic look, distorted objects, unreadable subtitles, extra limbs,
scary horror, gore, violence
```

Never omit this block when generating a Kling task. If a provider response
seems to include any of these elements, fail the scene and retry per the
`kling-video-producer` retry rules.
