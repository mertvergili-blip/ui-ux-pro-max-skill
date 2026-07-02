# Scene Prompt Template

For every scene, fill in:

```
scene_number: 
duration: 
visual_prompt: <base style from visual_style.md + scene-specific detail>
camera_motion: 
lighting: 
mood: 
details: 
negative_prompt: <from negative_prompts.md>
continuity_notes: <what must stay consistent with prior/next scene>
```

Keep `visual_prompt` concrete and filmable: one clear subject, one clear
action, one clear light source. Avoid stacking more than 2-3 objects per
scene so the AI video model stays coherent.
