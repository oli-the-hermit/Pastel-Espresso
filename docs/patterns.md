# Pastel Espresso — UX patterns

The rules every screen follows: visual rules first, then interaction. Values live in the tokens
(`src/styles/foundation/tokens.css`); words live in [`microcopy.md`](microcopy.md).

## Scale

The tokens keep the full scale (the design system shares it); the stylesheets use a subset, and
`npm run audit:scale` (in `npm run check`) fails on anything else. A deliberate exception says why
in an `/* Exception (scale: …) */` comment.

| | Use | Why |
|---|---|---|
| **Type** | the roles: `--type-overline` 10.8 · `-meta` 12.8 · `-body` 14.3 · `-heading` 16.5 · `-title` 19.5 · `-page` 24.8 · `-stat` 29.3 · `-display` 39 | few sizes, clear jumps: page > card title > heading > body > meta |
| **Weight** | `--weight-body` 400 · `--weight-label` 600 · `--weight-title` 700 | three weights far enough apart to read |
| **Space** | the 4px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48 (1 and 2 for hairline groups) | neighbours align or clearly don't |
| **Radius** | `--radius-sm` small parts (check box, kbd, cells) · `-md` rows · `-xl` tiles, panels, popovers · `-3xl` cards and modals · `-pill` every button, chip and single-line field | the shape says what a thing is |

## Colour

- **Solid accent means one of two things:** "the thing to do here" (the page's primary action,
  play) or "you are here" (the rail item, today's date, the picked date or time, a switch that's
  on). One primary action per view.
- **Selected is tonal** (`--accent-container`): the active session, list, notes place, a picked
  tile. Selection must never look like the primary action.
- **Everything else is neutral:** counts, percentages, statuses ("Saved"), period chips, icon
  tiles, bullets. The accent as text marks links and text buttons only.
- **Each colour keeps one meaning:** break teal is the break phase only; red is danger and "now".
- **Contrast:** `--text-1` and `--text-2` reach 4.5:1 on every surface (`lib/textContrast.test`).
  `--text-3` (3:1) is for placeholders, disabled controls and finished items only; anything people
  need to read uses `--text-2`.

## Structure

- **Where "create" lives:** a page that is one collection (Goals, Rewards, Notes, Calendar) puts a
  filled "New …" at the right of its toolbar; inside a card, adding sits at the end of what you add
  to, as the neutral pill button ("Add task list", "New session", "New task list") or, for a list's
  tasks, the "Add a task" row that is the list's last row.
- **The title band:** every card with a title block starts with a band one surface step up
  (`--surface-2` on a card): the overline in the accent as text, the card's ⋮ on the same line, the
  title 8px under. Both sit one line-height step tighter than elsewhere: the overline at
  `--leading-snug`, the title at `--leading-none` (a reward's name at `--leading-tight`). A long title is cut with an ellipsis at the band's padding (24px, the same right
  as left). Controls on the band take `surface={2}`. `ui/CardHeader` and `ui/PanelHeader` get it as
  a card's first child (`components/card.css`); goal and reward cards draw the same band in their own
  styles. A reward ready to claim has its band in the soft tint. Cards without a title block (stat
  tiles, the calendar grid, the notes places) have no band, and neither has the player: it is a
  player, not a card of content, so it keeps its open "Now playing" line.
- **Every card's first row is one height** (an icon button): an overline on the left, actions on
  the right. Cards side by side share that line.
- **An entity's header** (a session, a list, a goal) is its title with a ⋮ that holds the same
  items as its right-click menu: no loose icon buttons.
- **Two tonal levels inside a card at most:** the card, then its rows or tiles. A group inside a
  card is made with an overline and space, not another box.
- **No repeated facts:** a number or status appears once per view (the top bar's status pill only
  shows while the timer runs on another page; the Timer page has the player).

## Drag to reorder

One mechanism (native drag and drop through `hooks/useDragReorder`, with `lib/reorder.moveById`),
two presentations, chosen by what a click on the item does:

| Item | A click… | Shows | Cursor | Examples |
|---|---|---|---|---|
| **Row** | selects or opens it | a grip (⋮⋮) in the card's 24px margin beside it (`--text-3`), shown while the row is pointed at, has keyboard focus or is held; always shown where there is no hover | pointer over the row, grab over the grip, grabbing while held | sessions, task lists, tasks, the session's list headings |
| **Card** | does nothing by itself (its controls act) | no grip, so the card keeps even padding | grab over the card's free area, grabbing while held | goals, calendar events |

- The pointer always wins over the hand: buttons, check boxes and text fields inside a card keep
  their own cursor, and dragging selected text out of a field never moves the card.
- While dragging, the item fades to `surface-3` and the drop target shows an accent line on top
  (`components/drag.css`: `.dragging`, `.drag-over`).
- The new order saves with the profile; nothing else changes (no toast).
- Classes: rows use `draggable-item` + `ui/QueueItem` (or a `drag-handle is-margin` grip, inside a
  row with `position: relative`); cards use `draggable-item drag-surface`. Where the rows scroll
  (the mini player) there is no margin, so the grip sits in the row.
- A container that holds another draggable list (a session's list holds task rows) drags from its
  heading; it and each list only react to their own drags (`hooks/useDragReorder` ignores drags it
  didn't start).
- Every row and list that drags also has **Move up / Move down** in its ⋮, for the keyboard.

## Row tools

One ⋮ per thing, at its right end: the card, the list, the row. It holds the same items as the
thing's right-click menu (one list, `ui/Menu`). A row's ⋮ is quiet (`triggerQuiet`, `--text-3` at rest)
so a list of rows stays calm. Landmark rows still show their tools on hover, until goals get their
own lab round.

## Goals (component lab, goal card B2, 2026-11-11)

A goal is a list of landmarks, so its band is that list's heading (`features/goals.css`):

- **Band:** the period as the overline, the count ("1 of 3") beside the ⋮ (`CardHeader count`), the
  title (it wraps: `titleWraps`), its chips (Done, the reward, the dates), and the bar closing the band
  (`CardHeader progress`).
- **Landmarks** are the lists' raised rows (`task-row`), with one quiet ⋮ (Mark complete, Edit,
  Duplicate, Move up, Move down, Delete); "Add a landmark" is the last row (a name and Enter; dates and
  a reward come from Edit, or from "Add landmark" in the goal's ⋮).
- **Completing:** a goal with landmarks completes when the last one is ticked (a "Done" chip on the
  band); only a goal without landmarks has a "Complete goal" button.
- **Description:** shown once written; "Add a description" in the ⋮ opens an empty one, and leaving it
  empty puts it away.

## Lists (component lab A7, 2026-11-10)

The session's task lists, the Tasks page, the sessions card and the list picker share one set of rules:

- **Surfaces:** rows are raised one step above what they sit on (`--row-bg`, `--surface-2` on a card),
  one more when pointed at or holding keyboard focus (`--row-hover`), not after a mouse click leaves
  focus inside. What is empty and waiting is recessed: the check box, the "Add a task" row
  (`--surface-inset`), the picker's search.
- **Check box:** the 20px box as a hole (`--check-hole`) with a soft hairline rim (`--check-rim`);
  pointing at an empty box previews the tick; ticked, the accent. Its click area is 36px. The rim is
  about 1.45:1 against a row, below 3:1: chosen knowingly in the lab (round 4).
- **One grid:** a list heading's chevron, the check boxes and the add row's plus share a column; the
  list's name, the task text and the field's text share the next. Row padding 16px, gap 12px.
- **List heading:** the name as type (heading size, title weight), one leading chevron, the count
  ("1 of 3") at its end, then the list's ⋮. The whole heading folds the list. A thin progress bar under it.
- **Selection:** the soft tint (`--accent-container`), nothing else.
- **List picker** (`ui/ListPicker`): a small card on `--surface-2`, its title, sort and close on a band
  (`--surface-3`), the search as a well (`--surface-1`) with an accent clear button (Escape clears
  first, then closes), raised two-line rows (`--surface-3`, highlighted `--surface-4`) with the list
  icon, scrolling out on a rounded corner, and the neutral pill button last.
