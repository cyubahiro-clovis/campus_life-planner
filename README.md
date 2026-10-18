# Campus Life Planner

A planner for campus life. It keeps track of classes, labs, deadlines and club nights, shows how much time you've signed up for, and lets you search everything with regular expressions. It's plain HTML, CSS and JavaScript with no frameworks, and your tasks never leave your browser.

**Theme:** Campus Life Planner (tasks, durations, tags, search)

- **Live site:** https://cyubahiro-clovis.github.io/campus-life-planner/
- **Tests:** https://cyubahiro-clovis.github.io/campus-life-planner/tests.html
- **jQuery scraper (stretch):** https://cyubahiro-clovis.github.io/campus-life-planner/scrape.html
- **Demo video (unlisted):** _add link here_

## Contents

1. [Features](#features)
2. [How to run it](#how-to-run-it)
3. [Files](#files)
4. [Data model](#data-model)
5. [Regex catalog](#regex-catalog)
6. [Search examples](#search-examples)
7. [Keyboard map](#keyboard-map)
8. [Accessibility notes](#accessibility-notes)
9. [Responsive design](#responsive-design)
10. [Running the tests](#running-the-tests)
11. [Import and export](#import-and-export)
12. [Stretch: jQuery events scraper](#stretch-jquery-events-scraper)
13. [Deploying to GitHub Pages](#deploying-to-github-pages)
14. [Milestones](#milestones)
15. [Known limitations](#known-limitations)

## Features

**Dashboard**
- Total tasks, total time, and the tag used most
- A bar chart of the last 7 days, made from plain `div`s. JavaScript sets each bar's height, and a sentence above the chart says the same thing in words
- A time cap: type a limit in hours and the message below it says how much time is left. Once you go over, the message switches from `aria-live="polite"` to `aria-live="assertive"`, so a screen reader reads it out straight away

**Tasks**
- A table on tablets and laptops, cards on phones (same HTML, the CSS changes how the rows look)
- Sort by due date, title (A to Z or Z to A) or duration (shortest or longest first)
- Live regex search over the title, tag and date, with an "Ignore case" checkbox. Matches are wrapped in `<mark>`
- `@tag:study` searches the tag column only
- A broken pattern like `(lab` shows a message instead of crashing, and the list stays unfiltered
- Edit a task inside its row (Enter saves, Esc cancels) and delete it with a confirm box

**Add a task**
- Title, due date, duration in minutes and tag, each checked with a regex
- An error shows under a field when you leave it, and goes away as soon as you fix it

**Settings**
- Show durations in minutes or hours
- A minutes and hours converter
- Export JSON, import JSON (checked before anything changes), load the sample tasks, delete everything

**Data**
- Every change is saved to localStorage straight away
- On your first visit the 16 sample tasks from `seed.json` load, so the planner isn't empty

## How to run it

The scripts are ES modules (`import` and `export`), and browsers only run those from a web server, not from a file you double-click. Either of these works, both from the Week 2 session:

- **VS Code:** install the Live Server extension by Ritwick Dey, right-click `index.html` and choose **Open with Live Server**
- **Terminal:** run `npx http-server` in the project folder and open the address it prints (needs Node.js)

There's nothing to install for the app itself and no build step.

## Files

```
index.html         the planner
tests.html         runs the assertions in tests/tests.js
scrape.html        stretch page: jQuery events scraper
seed.json          16 sample tasks
assets/            favicon
styles/style.css   all the styles, mobile first
scripts/
  main.js          starts the app and connects the forms and buttons to the other modules
  state.js         the tasks and settings in memory, saves every change, works out the dashboard numbers
  storage.js       loads and saves localStorage
  validators.js    every regex rule, plus the JSON import check
  search.js        safe regex compiler, @tag filter, <mark> highlighting, sorting
  ui.js            draws the table, the dashboard, field errors and the status message
  scrape.js        the jQuery code for scrape.html
tests/tests.js     the assertions
docs/
  spec.md          M1 spec: data model, accessibility plan, breakpoints
  wireframes/      mobile and desktop wireframes
```

The planner itself doesn't use jQuery. The brief only allows it on an extra scraping page, so `scrape.html` is the only page that loads it.

## Data model

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

`duration` is always saved in minutes. The unit setting only changes how durations are shown. `updatedAt` changes every time a task is edited.

Settings are saved separately under `campus-planner:settings`:

```json
{ "unit": "min", "capMinutes": 2400 }
```

## Regex catalog

All of these are in [scripts/validators.js](scripts/validators.js) and [scripts/search.js](scripts/search.js). The add form, the edit form and the importer use the same rules.

| Rule | Pattern | Passes | Fails |
|------|---------|--------|-------|
| Title: no space at the start or end | `^\S(?:.*\S)?$` | `Lab report` | `␣Lab report`, `Lab report␣` |
| Title: one space between words | `\s{2,}` (must not match) | `Lab report` | `Lab␣␣report` |
| Title: has a letter (**lookahead**) | `^(?=.*[A-Za-z])` | `CHEM 201`, `Café chat` | `1234`, `!!! ???` |
| Title: no repeated word (**back-reference**) | `\b(\w+)\s+\1\b` with `i` (must not match) | `Read the theory notes` | `Read the the notes`, `The the end` |
| Duration in minutes | `^(0\|[1-9]\d*)(\.\d{1,2})?$` | `0`, `45`, `52.5`, `52.25` | `045`, `.5`, `1.`, `1.255`, `-5` |
| Due date | `^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$` | `2026-10-20`, `2024-02-29` | `2026-13-01`, `2026-1-5`, `20/10/2026` |
| Tag | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` | `Study`, `Group Project`, `Self-care` | `Study2`, `-care`, `Group␣␣Project` |
| Import: id | `^[\w-]+$` | `task_0001`, `event_3` | `task 1`, an empty id |
| Search: tag filter | `^@tag:(\w+)` | `@tag:study`, `@tag:group` | |

(`␣` stands for a space.) The duration rule is also used by the time cap and the converter.

## Search examples

The search box takes a JavaScript regular expression. It's compiled inside `try/catch` with `new RegExp(pattern, flags)`, where the flags are `g`, plus `i` when "Ignore case" is ticked. If the pattern doesn't compile yet (say you've typed `(lab` and haven't closed the bracket), you get a message and every task stays on screen.

| Try this | What it finds |
|----------|---------------|
| `@tag:study` | tasks tagged Study |
| `@tag:group` | tags that start with "group", so it finds Group Project |
| `\b\d{2}:\d{2}\b` | titles with a time in them, like 14:30 |
| `^(lab\|lecture)` | titles or tags that start with Lab or Lecture |
| `2026-10-\d{2}` | anything due in October 2026 |
| `exam\|midterm` | either word |
| `[<&]` | the sample task with `<` and `&` in it, to show it's displayed as text |

How the highlighting stays safe: the matches are first marked with two characters nobody types, then the whole text is escaped (`<` becomes `&lt;` and so on), and only then do those two characters become `<mark>` and `</mark>`. So a title like `Read <Ch. 5> & take notes` shows exactly as typed, even while you search for `t`. Patterns that match nothing you can see, like `^`, don't add empty marks.

## Keyboard map

| Key | Where | What it does |
|-----|-------|--------------|
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | anywhere | move through links, fields and buttons in reading order |
| <kbd>Enter</kbd> | "Skip to main content" (the first Tab stop) | jump past the header to the dashboard |
| <kbd>Enter</kbd> | links and forms | follow a link, add a task, set the cap |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | buttons | press the button |
| <kbd>Space</kbd> | checkbox | tick or untick "Ignore case" |
| <kbd>↑</kbd> <kbd>↓</kbd> | radio buttons, Sort by menu | change the choice |
| <kbd>Enter</kbd> | inline edit form | save the task |
| <kbd>Esc</kbd> | inline edit form | cancel, and focus goes back to that row's Edit button |
| <kbd>Esc</kbd> | search box (Chrome and Edge) | clear the search |
| <kbd>Enter</kbd> / <kbd>Esc</kbd> | confirm box | OK / Cancel |

## Accessibility notes

- **Landmarks and headings:** `header`, `nav`, `main`, a `section` for each part of the page, a `search` element around the search box, and a `footer`. There's one `h1` (the site name), an `h2` for each section and `h3`s inside them, without skipping a level.
- **Skip link:** the first Tab stop. It jumps to `main`.
- **Labels:** every input has a `<label>`. Hints and error messages are tied to their input with `aria-describedby`, and a field with an error gets `aria-invalid="true"` and a red border as well as the message, so the error isn't shown by colour alone.
- **Live regions:**
  - the status box at the bottom of the screen (`role="status"`) for adds, edits, deletes, export and sample data
  - the search result count (`role="status"`)
  - the error under each field (`aria-live="polite"`)
  - the import result
  - the time cap message: `polite` while you're under the cap, `assertive` once you go over
- **Focus:** Edit moves focus into the title field. Save and Cancel move it back to that row's Edit button. Delete moves it to the next row's Delete button, or to the search box when the list is empty. Submitting a form with mistakes moves focus to the first field with an error.
- **Visible focus:** a 3px orange outline everywhere, yellow inside the green header where orange is hard to see.
- **Buttons say what they act on:** each Edit and Delete button has an `aria-label` like "Delete Evening gym session", so a screen reader user doesn't hear sixteen plain "Delete"s.
- **The chart:** the bars are `aria-hidden`, and the sentence above the chart gives the total and the busiest day in words.
- **Cards on phones:** the table headings are hidden there, so each cell shows its own label ("Due:", "Duration:") from a `data-label` attribute.
- **Confirm boxes:** delete, import and "Delete all tasks" use the browser's own `confirm()`, which works with the keyboard and with screen readers.
- **Motion:** the bars grow in, the cap meter slides, the status box fades in. With "reduce motion" turned on in the device settings, all of it switches off.
- **Colour contrast** (WCAG AA asks for 4.5:1 for text and 3:1 for borders and focus rings):

| Pair | Ratio |
|------|-------|
| body text on white | 15.9:1 |
| grey text on white / on the cream background | 6.6:1 / 5.9:1 |
| white on the green header and buttons | 8.1:1 |
| red error text on white | 7.0:1 |
| text on the yellow `<mark>` highlight | 12.3:1 |
| orange focus ring on white / on cream | 5.2:1 / 4.7:1 |
| input borders on white | 3.9:1 |

How I checked it: I went through the whole app with only the keyboard (add, edit, delete, search, sort, cap, import, export), worked out the contrast ratios above with the WCAG formula, and checked the layout at 320, 360, 414, 768, 1024 and 1280px wide for sideways scrolling.

## Responsive design

Mobile first: the CSS at the top of `style.css` is the phone layout, and three `min-width` media queries build on it. Rows of things are laid out with Flexbox.

| Width | What changes |
|-------|--------------|
| base (under 360px) | one column, tasks as cards, stats stacked, nav buttons wrap |
| **360px** | stat boxes two per row, a bit more padding |
| **768px** | the cards turn into a real table, all stats in one row, chart and cap side by side, two form fields per row, settings in two columns |
| **1024px** | header in one row (site name left, nav right), all four form fields in one row, the chart gets more room than the cap, About in three columns |

## Running the tests

Open `tests.html` through Live Server (or on the live site). It runs 63 small assertions and lists each one as PASS or FAIL, in these groups:

- the title, date, duration and tag rules, including the lookahead and back-reference cases
- the safe regex compiler (a broken pattern gives `null`, not an error)
- search: ignore case on and off, time tokens, `@tag:`, searching the date, keeping the row that's being edited
- highlighting: `<mark>` around every match, HTML escaping, the "searching for t" case, empty matches
- sorting in all six orders
- the JSON import check: not a list, an empty list, a bad date, a duration written as text, a missing title, the same id twice, `null` in the list

Some things to try by hand in the app:

1. Add a task titled `Read the the notes`. You should see the repeated-word error.
2. Type `(lab` in the search box. You should see the "not a valid regex yet" message.
3. Set a cap of `10` hours. The message turns red and is read out straight away.
4. Export JSON, delete everything, then import the file again.

## Import and export

- **Export JSON** downloads `campus-planner-tasks.json`, a plain array in the same shape as `seed.json`. It works by setting the link's `href` to a `data:` URL just before the browser follows it, and the link's `download` attribute saves it as a file.
- **Import JSON** reads the file with `FileReader`, parses it inside `try/catch`, and checks every record before anything changes:
  - it has to be an array of objects
  - each `id` has to match `^[\w-]+$` and appear only once
  - the title, due date and tag go through the same regex rules as the form
  - `duration` has to be a number (not `"90"` in quotes), checked with the duration rule
  - `createdAt` and `updatedAt` have to be there
- If anything fails, nothing is imported, and the first five problems are listed with the task number, for example `Task 3: dueDate: Use the format YYYY-MM-DD, for example 2026-10-20.`
- If it passes, the app asks before replacing your tasks. Extra fields in the file are dropped.
- Saved data is checked when the app starts too. If localStorage holds broken JSON, the list starts empty instead of crashing, and any record that isn't a proper task is skipped.

`seed.json` has 16 tasks picked to cover edge cases:
- a leap day (2024-02-29), New Year's Eve and New Year's Day
- durations of 0, 5 and 1440 minutes, and decimals (52.5 and 120.25)
- titles with `<`, `&`, quotes, accents and times like 08:30
- a two-word tag (`Group Project`)
- tasks that are overdue, due this week, and due months away

## Stretch: jQuery events scraper

`scrape.html` has a static "campus events board" written in plain HTML. Press **Scrape to JSON** and `scripts/scrape.js` uses jQuery to read it:

- `$(document).ready()` waits for the page to load
- `$('#board').find(selector)` finds the events with the selector you type (`.event` by default, and `article:first` or `:has()` work too)
- `.each()` goes through them, and `$(this).find(...).text()` and `.attr('datetime')` read the title, date, length and tag
- `.addClass('found')` outlines what the selector matched, and `.removeClass()` clears the last run
- the result is printed as JSON in the same shape as the planner's tasks, with a Download link, so the file can be imported in the planner

jQuery is loaded from `code.jquery.com`, on this page only.

## Deploying to GitHub Pages

1. Push the repo to GitHub (`cyubahiro-clovis/campus-life-planner`).
2. In the repo, go to **Settings → Pages**, set **Source** to "Deploy from a branch", pick **main** and **/ (root)**, then save.
3. After a minute or so the site is live at https://cyubahiro-clovis.github.io/campus-life-planner/

All the paths are relative (`styles/…`, `scripts/…`, `seed.json`), so it works from the `/campus-life-planner/` sub-path as it is.

## Milestones

| Milestone | What went in |
|-----------|--------------|
| M1 | spec, data model, accessibility plan, wireframes (`docs/`) |
| M2 | semantic HTML for every section, mobile-first CSS |
| M3 | regex validation with inline errors, `tests.html` |
| M4 | table and cards, sorting, regex search with `<mark>`, inline edit, delete |
| M5 | dashboard stats, 7 day chart, time cap with polite and assertive messages |
| M6 | localStorage, JSON import and export with validation, unit settings and converter |
| M7 | simpler code using the basics from class, keyboard and contrast checks, animations, this README, the jQuery scraper page |

## Known limitations

- Your tasks live in one browser on one device. Use Export and Import to move them.
- The date rule checks the shape only, so a day that doesn't exist, like `2026-02-30`, still passes.
- The "has a letter" lookahead only counts A to Z, so a title written only in a non-Latin script is rejected.
- The search runs whatever regex you type, so a very slow pattern could freeze the page for a moment. Titles are capped at 80 characters, which keeps this small.
- The repeated-word rule would also catch a real name like "Bora Bora".
- The chart counts tasks by due date, so the sample tasks slowly move out of the last 7 days as time passes.

## Author

**Cyubahiro Clovis**
- GitHub: [github.com/cyubahiro-clovis](https://github.com/cyubahiro-clovis)
- Email: [m.clovis@alustudent.com](mailto:m.clovis@alustudent.com)
