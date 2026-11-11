# Component lab

Plain pages for redesigning one component at a time, outside the app. Each page shows the
component as it is today next to the options being considered, all live, on the app's own
tokens and styles (`src/index.css`). Nothing here ships: the app's build never reads this folder.

| Page | Component | State |
|---|---|---|
| [lists/index.html](lists/index.html) | Lists: a session's task lists, the sessions list, the list picker | Round 5: one option, A7, with its rules written on the page. Earlier: [round 1](lists/round-1/index.html), [round 2](lists/round-2/index.html), [round 3](lists/round-3/index.html), [round 4](lists/round-4/index.html) |
| [goals/index.html](goals/index.html) | The goal card: its band, landmarks, adding, completing | Round 1: Current, B1 (landmarks as a list) and **B2 (progress in the title), chosen 2026-11-11** |

## Opening a page

Double-click its `index.html`, or run `npx vite --port 3110` and open
`http://localhost:3110/lab/lists/index.html`. The pages need `npm install` to have run once
(the font comes from `node_modules`).

## Rules

- "Current" uses the app's real class names, so it changes when the app's styles do.
- An option's styles use tokens only, like the app's. Its classes are prefixed (`la-`, `lb-`, `gb-`).
- When an option is chosen, it moves into `src/components/ui` and `src/styles`, and its page
  is updated or removed.
