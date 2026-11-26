# Figma screens

A Figma development plugin that builds Pastel Espresso's screens in the Pastel Studio Figma file, so
the layout can be changed and previewed there quickly. The screens are made of the Pastel Studio
design system's Figma library (built by `pastel-studio-ds`, `tools/figma-library`). A change to a
component shows on every screen. Each screen is re-coloured with Espresso's accent (solar lime)
and its accent-tinted drawer.

## What it builds

On the **Screens** page, in the **Pastel Espresso** section:

- **Espresso components:** the pieces the design system doesn't have.
  - AppMark and UserBadge.
  - PlayerCard, idle and running.
  - QueueItem, TaskItem, TaskListHeading and AddTaskRow.
  - EspressoDrawer, expanded and as a rail.
  - EspressoTopBar.
  - SwitchRow, on and off.
  - StatCard.
  - NoteCard, at rest and selected.
  - RewardCard: ready, in progress and claimed.
  - GoalCard, open and done.
- **Screens,** each a 1600 × 960 desktop window with its title bar, tools and window buttons:
  - Timer & sessions, idle and running;
  - Tasks;
  - Timer & sessions with the account menu open;
  - Sign in, and Create the main account;
  - Notes, and a note open in the editor;
  - Calendar, a week;
  - Stats;
  - Goals & landmarks;
  - Rewards;
  - over the Timer page: Settings (its start, and scrolled to its end), Profile, Appearance,
    New session, Help with its About and What's new views, Notification settings, the tour's
    welcome and one of its steps, and Update ready;
  - Reward claimed, over Rewards;
  - Something unexpected happened, shown when the window stops drawing.
- **Small windows,** at their own sizes:
  - Mini player: compact (400 × 152), tall (320 × 420) and wide (640 × 300);
  - Alert island (400 × 120).

The design system's whole-file plugin (`tools/figma-file` in `pastel-studio-theme`) builds the same
from this `screens.js`: the screens go in the **Pastel Espresso** section of its **Mockups** page,
and the components in **Pastel Espresso components** on **Blocks**.

Sizes, colours and wording come from `src/styles` and `src/constants/strings.ts`. What the screens
show (the notes, the goals, the sessions) is made up, and a reward's emoji is drawn as an icon.

## Run it

1. In the Figma desktop app, open the Pastel Studio file. It must already hold the library: run
   **Pastel Studio DS: Figma library** first.
2. Menu → **Plugins → Development → Import plugin from manifest…**, then pick `manifest.json` in this
   folder. This is needed once.
3. Menu → **Plugins → Development → Pastel Espresso: screens**.

A screen that already exists is skipped. To rebuild one, delete it and run the plugin again. The
plugin never changes what is already there, so move and edit the screens freely.

## Change it

Edit `screens.js`, then build `code.js`, which is what Figma runs:

```
npm run figma:screens
```

`build.mjs` puts together the screens kit from the design system beside this repo
(`../pastel-studio-theme/tools/figma-library/screens-kit.js`), Espresso's accent from the design
system's palette, and `screens.js`.
