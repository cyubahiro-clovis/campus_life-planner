# Campus Life Planner: spec (M1)

Theme: **Campus Life Planner**. A planner for students living and studying on campus, for classes, labs, deadlines, club meetings, gym time and everything else that fills up a week.

## Problem

My week gets split across a calendar app, WhatsApp groups and sticky notes. I mostly want to know three things:

1. What's due soon?
2. How much time have I already committed?
3. Am I taking on more than I can handle?

The planner answers those three without any sign-up. Everything stays in the browser.

## Users

- Me and other students on campus, mostly on phones between classes, sometimes on a laptop in the library.
- People who use a keyboard or a screen reader. The app has to work without a mouse.

## Sections

| Section   | What it does |
|-----------|--------------|
| Dashboard | Task count, total time, top tag, a chart of the last 7 days, and the time cap |
| Tasks     | Table on tablet/desktop, cards on mobile. Sort, live regex search, inline edit, delete with confirmation |
| Add task  | Form with regex validation and an error message under each field |
| Settings  | Duration units, minutes/hours converter, import/export, sample data, delete everything |
| About     | What the app is for and how to reach me |

## Data model

Every task is one object. `duration` is always stored in **minutes** so sorting and totals never have to think about units. The unit setting only changes how durations are shown.

```json
{
  "id": "task_0001",
  "title": "Peer learning circle 16:00",
  "dueDate": "2026-10-12",
  "duration": 90,
  "tag": "Study",
  "createdAt": "2026-10-05T07:42:10.000Z",
  "updatedAt": "2026-10-05T07:42:10.000Z"
}
```

| Field       | Type   | Rule |
|-------------|--------|------|
| `id`        | string | `task_` + 4 digits for new tasks. Imported ids can be anything made of letters, numbers, `_` or `-`, and must be unique |
| `title`     | string | no space at the start or end, no double spaces, at least one letter, no word repeated twice in a row, max 80 characters |
| `dueDate`   | string | `YYYY-MM-DD` |
| `duration`  | number | minutes, 0 or more, at most 2 decimals |
| `tag`       | string | letters, with single spaces or hyphens between words, max 30 characters |
| `createdAt` | string | ISO timestamp, set once |
| `updatedAt` | string | ISO timestamp, changed on every edit |

Settings are saved separately:

```json
{ "unit": "min", "capMinutes": 2400 }
```

## Storage

- `localStorage["campus-planner:tasks"]`: the array of tasks, saved after every change.
- `localStorage["campus-planner:settings"]`: the settings object.
- First visit (no tasks key yet): load `seed.json` so the app isn't empty.
- If the saved data is broken JSON, start with an empty list instead of crashing, and skip any saved record that isn't a proper task.
- Import takes a JSON array. Every record is checked before anything is loaded. If one fails, nothing changes and the problems are listed.

## Regex plan

| Rule | Pattern |
|------|---------|
| Title edges | `^\S(?:.*\S)?$` |
| Double spaces | `\s{2,}` |
| Title has a letter (lookahead) | `^(?=.*[A-Za-z])` |
| Repeated word (back-reference) | `\b(\w+)\s+\1\b` |
| Duration | `^(0\|[1-9]\d*)(\.\d{1,2})?$` |
| Date | `^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$` |
| Tag | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` |
| Imported id | `^[\w-]+$` |
| Tag filter in search | `^@tag:(\w+)` |

Search compiles the user's pattern inside `try/catch`. An invalid pattern shows a message and leaves the list unfiltered, so a half-typed pattern never makes everything disappear. Matches are highlighted with `<mark>` after the text is escaped, so titles with `<` or `&` still show as text.

## Accessibility plan

- Landmarks: `header`, `nav`, `main`, one `section` per area, `search` around the search box, `footer`. One `h1`, an `h2` per section, `h3` inside.
- Skip link as the first focusable element.
- Every input has a real `<label>`. Hints and errors are tied to inputs with `aria-describedby`, and invalid fields get `aria-invalid="true"`.
- Live regions: a status box (`role="status"`) for actions, the search result count, the field errors, the import result, and the cap message, which is polite while under the cap and switches to assertive once it's exceeded.
- Focus is always visible (3px outline, colour checked for 3:1 against every background).
- Focus is managed after actions: edit puts focus in the title field, save and cancel go back to the row's Edit button, delete goes to the next row.
- Delete uses the browser's `confirm()` box, which works with the keyboard and screen readers.
- The chart's bars are hidden from screen readers and a sentence above it says the same thing in words.
- Colours checked for WCAG AA. Errors use text and a border, not just colour.
- Motion is small and turns off with `prefers-reduced-motion`.

## Keyboard plan

| Key | Action |
|-----|--------|
| Tab / Shift+Tab | move through everything in a sensible order |
| Enter | follow links, submit forms, save an inline edit |
| Space | press buttons, tick the checkbox |
| Escape | cancel an inline edit |

## Breakpoints (mobile first)

- **base**: single column, task cards, stats stacked
- **360px**: stat boxes two per row
- **768px**: real table, all stats in one row, chart and cap side by side, two form fields per row, settings in two columns
- **1024px**: header in one row, all four form fields in one row, wider chart, About in three columns

Wireframes are in [`wireframes/`](wireframes/).
