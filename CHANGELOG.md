# Changelog

Every release of Focus Space, newest first. The app shows the short version in **Help → What's new**; this file keeps the full record, including the work under the hood. Focus Space is in **alpha**: features and looks may still change before the final version.

Versions follow [Semantic Versioning](https://semver.org): the middle number goes up when features are added, the last one for fixes. **1.5** is planned as the first final (non-alpha) version.

## 1.4.0 (alpha, not released yet)

Notes: a place to keep what your focus produced.

### What's new

- **Notes.** A new tab for writing and keeping documents. *New note* asks nothing: it opens a blank page in your Inbox, and you can file it whenever you like. A note with no title takes its name from its first line.
- **Collections and labels.** File notes into collections and tag them with labels; pin the ones you come back to. The Trash keeps deleted notes until you empty it, and moves and deletions come with an Undo.
- **Find your notes.** One loose search over titles, collections and labels; sort by last edited, created or title; show notes as a grid or a list.
- **Tidy in one sweep.** Select several notes (click, Ctrl, Shift) and move, label, export or trash them together, from the selection bar, the ⋮ menu or a right-click. The selection bar stays on one line: what doesn't fit moves into its own ⋮.
- **The editor.** Headings, bold, italic, strikethrough, code, lists, checklists, quotes, code blocks, tables and links, from a toolbar or the keyboard (the shortcuts are listed in Help). Notes save as you type: there's no Save button.
- **Import and export.** Open or drop Markdown files, folders and Focus Space bundles; a preview shows what will come in before anything does. Export a note, a selection or a collection as a Markdown file, a folder of Markdown files, or one bundle file.
- **Narrow windows.** The Notes places fold into one dropdown.
- **A calmer timer.** The countdown stands alone on its tile: the FOCUS label and the count of sessions done today are gone, and the phase shows through its colour. The current task is now the large line, with the session under it. The Focus chip became a ⋮ menu with the timer's actions (the same as a right-click). *Up next* heads the block under the controls like a card's overline, and the reward row keeps only its gift icon.
- **The top bar runs edge to edge.** The logo tile moved into it, over the drawer, and opens the app menu (create anything, start the timer, open help). The drawer starts just under the bar and has its own expand button. On narrow windows the bar's tools no longer get cut off, and the timer's controls shrink to fit the card instead of running past it.
- **Third-party licenses.** Help → About lists every open-source package Focus Space ships with, and its license.
- **A clearer hierarchy.** The page title is now the largest text in view, card titles sit one step below it, and labels, text and hints each have one size and weight, so what matters reads first. Fields, selects and steppers are pills like the buttons; rows, tiles and cards each have one corner size.
- **The accent means "do this" or "you are here".** The lime fill is kept for the main action and your place in the app; a selected session, list or notes place is now a soft tint, so picking something never looks like a button. Counts, percentages, period chips, the stats cards and Help's icons went neutral, and "Saved" in a note is quiet text.
- **Less said twice.** The Timer page shows the task count once (the list's progress row, now with its bar on top like the timer's scrubber); the player keeps reset, play and skip (sound and the mini player are in the top bar); the top bar's status appears only while the timer runs on another page; a list's actions sit in one ⋮; the mini player drops its FOCUS label and "Done today" like the main card; an empty week in Stats is one sentence instead of seven empty bars.
- **Tidier layout.** The drawer's icons sit centred between its toggle and your badge; cards side by side line up their labels; the Timer's task lists are sections of the card instead of boxes inside it; an open note sits on a card; the sample sessions, lists, goals and rewards are in sentence case.
- **Easier to read.** Hints, counts, timestamps and empty messages moved to the stronger secondary text colour, and the faintest colour was nudged so check boxes and placeholders stay visible on every surface.
- **Lists, redesigned.** A session's task lists stack and fold: each list's name is its heading, with one chevron, its count and its ⋮. Tasks are raised rows; "Add a task" is the list's last row, and its Add button appears once you type. The card ends with *Add task list*; a list's ⋮ can *Switch list…* to put another in its place. Tasks, lists and sessions gain *Move up* and *Move down*, so you can reorder without dragging. The drag grip waits in the card's margin until you point at a row.
- **Check boxes** are now soft holes that show the tick as you point at them.
- **Every card's title stands apart** on a band at its top, with its label in the accent and its ⋮ beside it: the session, the sessions, the Tasks page, Stats, goals and rewards. The player stays as it was. A goal's or reward's period is that label; a reward ready to claim has its band tinted.
- **The sessions card** has a title (the selected session) and its own ⋮ (new, edit, duplicate, delete); each session's tools are in one ⋮, and *New session* sits at the end of the list. The Tasks page's list sidebar works the same way.
- **Goals read like lists.** A goal's band carries its period, its progress ("1 of 3") beside its ⋮ and a bar under the title, so every card shows how far along it is in the same place. Landmarks are raised rows with one ⋮ (including *Move up* and *Move down*); type a landmark's name in the goal's last row and press Enter to add it. A goal with landmarks completes when the last one is ticked and shows *Done* on its band; only a goal without landmarks has a *Complete goal* button. The description shows once you've written one (*Add a description* is in the ⋮).
- **The list picker** is a small card: a search with a clear button, the lists as rows with their icon, sort and *Recently opened* kept, and *New task list* as a button at the end.

### Under the hood

- **Notes are encrypted one by one**, title and text sealed separately, with a key of their own kept inside your encrypted profile, so changing your password never touches them. Both backends (the web server and the desktop app's Rust port) store them the same way, checked by new steps in the shared API scenarios. Moving, labelling or trashing many notes at once is one request per hundred notes, all or nothing.
- **Upgrading** from 1.3 keeps everything: a 1.3 profile opens in 1.4 as it was, and its first note adds the notes key to it.
- **The editor** is TipTap (ProseMirror) wearing the app's own components, loaded only when you open a note, with its styles in the app's stylesheet so the desktop's strict Content Security Policy holds. Markdown is escaped only where it could be misread, so "R&D", snake_case and Windows paths stay as typed.
- **Accessibility:** the Grid/List switch and the pinned mark gained names for screen readers. The mini player's countdown now says its phase to screen readers, as the main player does.
- **Design rules, enforced:** the stylesheets use type roles (`--type-*`), three weights, a 4px spacing grid and role radii; `npm run audit:scale` fails on anything else, and a new test checks every text colour against every surface in both themes. The rules are written down in `docs/patterns.md`.
- **Dependencies:** security updates for Express's `body-parser`, `proxy-addr` and `qs`; Vite 8 and Vitest 5, which clear the last advisories in the development tools (`npm audit` finds none).
- **License notices:** `public/third-party-notices.txt` is generated from the packages that ship (`npm run licenses`): the app's and the web server's npm packages and the desktop app's Rust crates, each with its own license files. `npm run check` fails when it's out of date.
- **CI:** every push and pull request runs the checks, a production build and the Rust tests on GitHub Actions.
- **Checks:** 181 unit tests, 31 browser behavior checks and 110 screenshots compared pixel by pixel on every change, including the Notes screens, a check that the database holds no note text, and one that a note opens unchanged after a password change.

## 1.3.0 (alpha)

A new look and new ways to organize your task lists.

### What's new

- **Navigation drawer.** It floats in its own panel with the page margin around it, tinted with the accent color you pick in Appearance (a dark lime for Solar Lime, a matching tint for each of the 32 colors). The logo tile opens and closes it; when it's open, FOCUS SPACE sits as an overline at the top, and the account badge spans the bottom with a chevron. Hovers and the account menu use the same tint.
- **Session card.** The session's name sits under a *Session* overline with the count of tasks left beside it, and a ⋮ menu: add a task list, collapse or expand all, open in Tasks, edit the session.
- **Task lists on the timer page.** Each list has a *Task list* overline over a pill-shaped list switcher with its count inside, its collapse toggle next to its ⋮, and even spacing between the progress, the add field and the tasks. Drag a list by its header to reorder the session's lists.
- **List picker.** Add a task list from a new picker: a loose search (any word order, accents ignored), four sort orders, your recently opened lists on top, and a row that creates the name you typed. With no lists left to add, it suggests names.
- **Recently opened.** Every list switcher shows the last three lists you opened first.
- **Task rows.** Each row sits in its own subtle container with an always-visible drag handle, and its actions moved into a ⋮ menu (the same items as right-click), in the mini player too.
- **Goals.** A clearer card: the title like a reward's, and a Complete button that turns into Done.
- **One look for controls.** Switches, check boxes, segmented controls and dropdowns are shared components; dropdowns and their menus have pill shapes and round chevrons.
- **Wide windows.** A 12-column layout with equal margins; Goals and Rewards use it first.

### Under the hood

- **Design system groundwork** (for Pastel Studio, the design system shared by my apps, in progress): every inline control became a `components/ui` primitive (Switch, Checkbox, SegmentedControl, InputChip, Toast, Collapsible, NavigationRail, WindowButton, PlayerControl, QueueItem, ListRow, StatusChip, AvatarPicker, EmojiField, ListPicker, ...), with a `surface` prop so a control stays one step above whatever it sits on.
- **Guardrails** so that stays true: an ESLint rule fails when a component's CSS class is used outside `components/ui`, raw `<button>`/`<input>` elements are rejected there, and `npm run audit:inline` fails when feature CSS restyles a component (deliberate exceptions say why in a comment).
- **Tokens:** `--drawer-bg` and its hover steps are derived from the accent's hue with CSS relative colors; `--row-bg`, `--grip-color` and the chevron fill are a step darker than their surface. A test checks text, icons and focus rings on the drawer for all 32 accents in both themes. Neutral mixes use `oklab` (mixing near-greys in `oklch` tinted them red).
- **Loose matching** in `lib/fuzzy.ts`, with tests; recently opened lists in `lib/recentLists.ts` (per device).
- **Drag and drop:** `useDragReorder` only reacts to drags it started, so a list panel and its task rows never answer each other's drags.
- **Checks:** 101 unit tests, 18 browser behavior checks and 84 screenshots per theme compared pixel by pixel on every change.

## 1.2.0 (alpha)

The first public version.

- Focus sessions with task lists, a calendar, stats, goals and rewards. Everything stays on your device, encrypted.
- Pick your accent color from 32 Space colors in Appearance, in light or dark.
- Notifications show what happened at a glance, with a color, an icon and a dot on the bell.
- An emoji picker for rewards, with search and your recent picks.
- A mini player you can resize, with your session tasks: add, tick, rename and reorder them there.
- Clocks count in minutes, so an hour-long session starts at 60:00.
- Alerts when a phase ends, keyboard shortcuts and a quick tour you can replay from Help.
- Desktop: updates install themselves. Turn the notices off in Settings → Updates.
