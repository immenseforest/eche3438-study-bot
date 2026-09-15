# Private course pack interface

Copy the example modules into the ignored `private/` directory and replace demo content with verified material. No AI or PDF parsing is performed automatically.

## course.mjs exports

- `sources`: source labels.
- `topics`: keyed objects with name, room, concept, steps (array), questions (array), pages, query (Crossref query or null), links (title/URL pairs).
- `events(overrides)`: sorted objects `{id,date,topic,kind,start,minutes,room?,source?}`. Use stable IDs, YYYY-MM-DD dates, ISO UTC `start`, and kind `Lab` or `Tutorial`. Resolve local timezone/DST before emitting UTC. `overrides` maps tutorial date to topic key.
- `deadlines()`: objects `{id,date,topic,type,start}`; current notification wording expects 16:00 America/Toronto and an outline-based rule. Adapt the notification text in server.mjs for other course policies.
- `prep(event,hours)`: short reminder text, less than 1950 characters.
- `plan(overrides)`: downloadable plan text.
- `caveats`, `ethicsQuestions`: string arrays; `disclosure`: string.

## study.mjs exports

- `studies`: keyed objects with `title`, using keys accepted by `studyStep`.
- `studyStep(code,index)`: Discord text under 2000 characters for indexes 0–5. Index 3 is the prediction; index 4 reveals an explanation. Keep citations and uncertainty visible.
- `studyGuide()`: complete downloadable study text.

## Checks before enabling reminders

Transcribe dates against the correct group row; distinguish tutorial dates from lab rotation. Use stable event IDs and verify 24h/12h offsets across DST. Separate provisional topics from confirmed ones. Readings need provenance and should not claim full-paper review when only metadata was read. Do not place private materials in the public repository.

## Group-aware pack interface

Export `supportedGroups` (for example `['A','B','C','D']`). Implement `events(overrides, group)`, `deadlines(group)`, and `plan(overrides, group)` with a default group of C for legacy installations. Optionally export `groupCaveats(group)`. Legacy packs without `supportedGroups` expose C only.

Each lab event should include its group and an ID unique across groups; deadlines also require group-specific IDs. Keep unchanged tutorial IDs stable across groups, and do not infer tutorial assignments from the lab rotation. Preserve existing Group C IDs when upgrading a live pack so sent reminders are not repeated. Provide the appropriate topic codes, rooms, readings and source references for every group. The engine supplies the selected group to these functions; course packs remain responsible for validated schedule data.
