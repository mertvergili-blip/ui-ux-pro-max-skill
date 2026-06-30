# Negative Prompt — apply to every scene, every provider

```
real person, celebrity, recognizable face, famous character,
copyrighted character, brand logo, readable brand text, horror, gore,
violence, scary monster, cartoonish, toy-like, childish colors,
oversaturated, plastic look, distorted objects, unreadable subtitles,
extra limbs
```

Never omit this block when generating a Kling task. If a provider response
seems to include any of these elements, fail the scene and retry per the
`kling-video-producer` retry rules.

Note: original fictional tiny characters (tiny conductor, baker, tailor,
clockmaker, operator, shopkeeper, shadow figures, miniature silhouettes)
are allowed — this block bans *real* people/celebrities/recognizable
faces, not fictional miniature characters.
