# Focus Space — UX patterns

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
  filled "New …" at the right of its toolbar; a page of several panels (Timer, Tasks) puts a tonal
  "New …" in the header of the panel it adds to.
- **Every card's first row is one height** (an icon button): an overline on the left, actions on
  the right (`ui/CardHeader` with an overline, `ui/PanelHeader`, the player). Cards side by side
  share that line.
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
| **Row** | selects or opens it | a grip (⋮⋮) at its left edge, always visible (`--grip-color`, darker than the row) | pointer over the row, grab over the grip, grabbing while held | sessions, task lists, tasks, the session's list panels (grip in the header) |
| **Card** | does nothing by itself (its controls act) | no grip, so the card keeps even padding | grab over the card's free area, grabbing while held | goals, calendar events |

- The pointer always wins over the hand: buttons, check boxes and text fields inside a card keep
  their own cursor, and dragging selected text out of a field never moves the card.
- While dragging, the item fades to `surface-3` and the drop target shows an accent line on top
  (`components/drag.css`: `.dragging`, `.drag-over`).
- The new order saves with the profile; nothing else changes (no toast).
- Classes: rows use `draggable-item` + `ui/QueueItem` (or a `drag-handle` grip); cards use
  `draggable-item drag-surface`.
- A container that holds another draggable list (a session's list panel holds task rows)
  drags from its header's free area; its grip stays hidden until that area is hovered or the
  container is held, then shows beside it, centered on the whole block. It and each list only reacts to its own drags
  (`hooks/useDragReorder` ignores drags it didn't start).

## Row tools

Task rows (and goal cards) put their tools in a ⋮ menu at the end, always visible, with the same
items as the right-click menu (one list, `ui/Menu`). Other rows still show their tools on hover:

Row tools (edit, duplicate, delete) show on hover and on keyboard focus. They float over the row's
end on the row's own hover color, on the details line when there is one and centred otherwise, so
they never take room from the name or the details (`ui/QueueItem`, landmark rows).
