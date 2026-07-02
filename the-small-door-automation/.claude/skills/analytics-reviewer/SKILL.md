---
name: analytics-reviewer
description: Use this skill to analyze published video performance and turn it into decisions for future production (which objects/moods/subseries/hooks to repeat or drop). Invoke periodically once videos have been public for a while, or when the user asks for a performance review.
---

# Analytics Reviewer

Turns performance data in `data/analytics_log.csv` into production decisions.

## Metrics tracked

- First-2-seconds retention
- Average view duration
- Replay likelihood
- Comment rate
- Subscriber gain rate
- Which object/theme performs best
- Which final questions drive comments
- Which subseries performs best

## Decision values (must be exactly one of)

- `keep`
- `iterate`
- `stop`
- `make_series`
- `change_hook`
- `change_object`
- `change_mood`

## Workflow

1. Read `data/analytics_log.csv` for videos with recorded metrics.
2. Compare across subseries/object/mood/hook style.
3. Write a decision per video (and an overall recommendation for the next
   batch of `shorts-idea-generator` output) using
   `scripts/analyze_results.py`, output to `outputs/reports/`.
