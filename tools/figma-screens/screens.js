/* global APP_COLOURS, appVars, use, find, icon, prop, v, paint, text, iconInst, recolor, auto, fixed, fill, fillBoth,
   bindNum, radius, pad, screen, float, exists, appColour, setUpAccent, useAppAccent, runScreens, soft, setText, rule, elevate,
   componentsSection, ownComponent, shelve */
// Pastel Espresso's screens, for Figma: its own components, then its desktop windows, its dialogs
// and its small windows (the mini player, the alert), built from the Pastel Studio library and
// re-coloured with Espresso's accent (solar lime) and its drawer.
// Sizes, colours and text come from src/styles and src/constants/strings.ts; what the screens show is made up.
// The same file builds two layouts: the app's own plugin (its components in the app's section on
// "Screens") and the design system's whole-file plugin (its components on "Blocks"). The kit's
// componentsSection / ownComponent / shelve place the components in both.

const SW = 1600, SH = 960;   // wide enough for the Timer page's three columns and the expanded drawer
const ESP = {};              // Espresso's components, by name

// ── Small parts ──────────────────────────────────────────
async function overline(s, color) {
  const t = await text(s.toUpperCase(), 'xs/SemiBold', color || 'text/2', 'Overline');
  t.letterSpacing = { unit: 'PERCENT', value: 12 }; return t;
}
function spacer(dir) { const f = auto(dir || 'HORIZONTAL', 'Spacer'); return f; }
function more(size) { return use('IconButton', `Size=${size || 'sm'}, State=Default`, { Icon: 'More' }); }
// A card whose header is a tinted band, like Espresso's CardHeader
async function bandCard(name, over, title, extras) {
  const c = auto('VERTICAL', name); radius(c, 'radius/3xl'); c.fills = [await paint('surface/1')]; c.clipsContent = true;
  const band = auto('VERTICAL', 'Band', 'space/4'); pad(band, 'space/24', 'space/24', 'space/20', 'space/24'); band.fills = [await paint('surface/2')];
  c.appendChild(band); fill(band);
  const top = auto('HORIZONTAL', 'Top', 'space/8'); top.counterAxisAlignItems = 'CENTER'; band.appendChild(top); fill(top);
  top.appendChild(await overline(over, 'accent/text'));
  for (const x of extras || []) top.appendChild(x);
  const sp = spacer(); top.appendChild(sp); fill(sp);
  top.appendChild(more('md'));
  const t = await text(title, 'xl/Bold', 'text/1', 'Title'); band.appendChild(t); fill(t); t.textTruncation = 'ENDING';
  const body = auto('VERTICAL', 'Body', 'space/12'); pad(body, 'space/20', 'space/24', 'space/24', 'space/24'); c.appendChild(body); fill(body);
  return { card: c, band, body };
}
// Appends a node and sizes it in its (auto-layout) parent
function put(parent, node, how) { parent.appendChild(node); if (how === 'fill') fill(node); else if (how === 'both') fillBoth(node); return node; }
// Text that takes its parent's width and wraps
async function para(parent, chars, style, color, name) { const t = await text(chars, style, color, name); parent.appendChild(t); fill(t); t.textAutoResize = 'HEIGHT'; return t; }
// An auto-layout frame of a set width that hugs its height
function setWidth(n, w) { n.resize(w, Math.max(1, n.height)); n.layoutSizingHorizontal = 'FIXED'; n.layoutSizingVertical = 'HUG'; return n; }
// An instance of one of Espresso's own components. Never through find(): the library has a QueueItem too
function esp(name, variant, props) {
  const c = ESP[name], m = c && variant ? c.children.find(x => x.name === variant) : c;
  if (!m) throw new Error(`Espresso’s ${name}${variant ? ` (${variant})` : ''} not found`);
  const i = m.createInstance(); for (const [k, val] of Object.entries(props || {})) prop(i, k, k === 'Icon' ? icon(val).id : val); return i;
}
// A property of an instance nested in another (a Chip in a NoteCard, a Button in a TourCard)
function inner(root, layer, name, value) { const i = root.findOne(n => n.type === 'INSTANCE' && n.name === layer); if (i) prop(i, name, value); return i; }
// A small pill: a state, a date, a role (features/goals.css, profile.css)
async function badge(label, bg, fg, ic, style, h) {
  const b = auto('HORIZONTAL', label, 'space/4'); b.counterAxisAlignItems = 'CENTER'; b.resize(40, h || 24); b.primaryAxisSizingMode = 'AUTO'; b.counterAxisSizingMode = 'FIXED';
  pad(b, null, 'space/8', null, 'space/8'); radius(b, 'radius/pill'); b.fills = [await paint(bg)];
  if (ic) b.appendChild(await iconInst(ic, fg, 12)); b.appendChild(await text(label, style || 'sm/SemiBold', fg, 'Label')); return b;
}
// A card whose band holds only its overline, like Espresso's PanelHeader (components/card.css)
async function panelCard(name, title) {
  const c = auto('VERTICAL', name); radius(c, 'radius/3xl'); c.fills = [await paint('surface/1')]; c.clipsContent = true;
  const band = auto('HORIZONTAL', 'Band'); band.counterAxisAlignItems = 'CENTER'; fixed(band, 200, 84);
  pad(band, 'space/24', 'space/24', 'space/20', 'space/24'); band.fills = [await paint('surface/2')]; c.appendChild(band); fill(band);
  band.appendChild(await overline(title, 'accent/text'));
  const body = auto('VERTICAL', 'Body', 'space/8'); pad(body, 'space/20', 'space/24', 'space/24', 'space/24'); c.appendChild(body); fill(body);
  return { card: c, band, body };
}

// ══ Espresso's own components ════════════════════════════
async function buildComponents() {
  const sec = await componentsSection('Espresso components');
  const have = name => ownComponent(sec, name);
  const keep = (name, node) => { ESP[name] = node; return node; };
  // A new one goes on the section's shelf (a set keeps the places of its variants) and takes Espresso's accent
  const add = async node => { shelve(sec, node); await useAppAccent(node); };

  // App mark: the logo tile at the start of the top bar (src/styles/components/app-mark.css)
  if (!keep('AppMark', have('AppMark'))) {
    const m = figma.createComponent(); m.name = 'AppMark'; m.layoutMode = 'HORIZONTAL'; m.primaryAxisAlignItems = 'CENTER'; m.counterAxisAlignItems = 'CENTER';
    fixed(m, 32, 32); bindNum(m, 'width', 'size/icon-button-size-sm'); bindNum(m, 'height', 'size/icon-button-size-sm'); radius(m, 'radius/md');
    m.fills = [await paint('accent/accent')]; m.appendChild(await iconInst('Timer', 'accent/on-accent', 16));
    m.description = 'The app mark: Espresso’s logo on a 32px accent tile (radius md). It opens the app menu. The logo here is a stand-in (IconTimer).';
    keep('AppMark', m); await add(m);
  }
  // User badge: the account at the foot of the drawer (layout/user-badge.css)
  if (!keep('UserBadge', have('UserBadge'))) {
    const vs = [];
    for (const layout of ['Expanded', 'Rail']) {
      const c = figma.createComponent(); c.name = `Layout=${layout}`; c.layoutMode = 'HORIZONTAL'; c.counterAxisAlignItems = 'CENTER';
      c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; c.fills = []; pad(c, 'space/4', layout === 'Expanded' ? 'space/8' : 'space/4', 'space/4', 'space/4'); bindNum(c, 'itemSpacing', 'space/8'); radius(c, 'radius/pill');
      const av = auto('HORIZONTAL', 'Avatar'); fixed(av, 40, 40); av.primaryAxisAlignItems = 'CENTER'; av.counterAxisAlignItems = 'CENTER'; av.clipsContent = false;
      radius(av, 'radius/pill'); av.fills = [await paint('surface/3')]; av.appendChild(await text('SM', 'sm/SemiBold', 'text/1', 'Initials'));
      const dot = figma.createEllipse(); dot.name = 'Owner'; dot.resize(12, 12); dot.fills = [await paint('accent/accent')]; dot.strokes = [await paint('drawer/bg')]; dot.strokeWeight = 2; dot.strokeAlign = 'OUTSIDE';
      av.appendChild(dot); dot.layoutPositioning = 'ABSOLUTE'; dot.x = 29; dot.y = 29; c.appendChild(av);
      if (layout === 'Expanded') {
        c.resize(208, 48); c.primaryAxisSizingMode = 'FIXED';
        const n = await text('san', 'md/SemiBold', 'text/1', 'Name'); c.appendChild(n); fill(n); n.textTruncation = 'ENDING';
        const ch = auto('HORIZONTAL', 'Chevron'); fixed(ch, 28, 28); ch.primaryAxisAlignItems = 'CENTER'; ch.counterAxisAlignItems = 'CENTER'; radius(ch, 'radius/pill');
        ch.appendChild(await iconInst('ChevronDown', 'text/2', 16)); c.appendChild(ch);
      }
      vs.push(c);
    }
    const set = figma.combineAsVariants(vs, sec); set.name = 'UserBadge';
    set.description = 'Who is signed in, at the foot of the drawer: a 40px avatar with the owner’s accent dot; expanded, the name and a chevron. It opens Profile, Appearance, Settings, Sign out.';
    vs[0].x = 24; vs[0].y = 24; vs[1].x = 260; vs[1].y = 24; set.resizeWithoutConstraints(340, 96);
    keep('UserBadge', set); await add(set);
  }

  // Player card: the timer (features/timer.css, timer/PlayerCard.tsx, Scrubber.tsx)
  if (!keep('PlayerCard', have('PlayerCard'))) {
    const vs = [];
    for (const running of [false, true]) {
      const c = figma.createComponent(); c.name = `Running=${running ? 'True' : 'False'}`; c.layoutMode = 'VERTICAL';
      c.resize(360, 900); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
      pad(c, 'space/24', 'space/24', 'space/24', 'space/24'); bindNum(c, 'itemSpacing', 'space/20'); radius(c, 'radius/3xl'); c.fills = [await paint('surface/1')];
      const head = auto('HORIZONTAL', 'Head'); head.counterAxisAlignItems = 'CENTER'; c.appendChild(head); fill(head);
      head.appendChild(await overline('Now playing')); const sp = spacer(); head.appendChild(sp); fill(sp); head.appendChild(more('md'));
      const tile = auto('HORIZONTAL', 'Tile'); fixed(tile, 312, 312); tile.primaryAxisAlignItems = 'CENTER'; tile.counterAxisAlignItems = 'CENTER';
      radius(tile, 'radius/xl'); tile.fills = [await paint(running ? 'accent/accent' : 'surface/2')]; c.appendChild(tile); fill(tile);
      const count = await text(running ? '14:32' : '25:00', 'md/SemiBold', running ? 'accent/on-accent' : 'accent/text', 'Countdown');
      count.fontSize = 76; count.letterSpacing = { unit: 'PERCENT', value: -4.5 }; count.lineHeight = { unit: 'PERCENT', value: 100 }; tile.appendChild(count);
      const track = auto('VERTICAL', 'Track', 'space/4'); track.counterAxisAlignItems = 'CENTER'; c.appendChild(track); fill(track);
      const title = await text('Write the quarterly report', 'xl/Bold', 'text/1', 'Task'); track.appendChild(title); fill(title); title.textAlignHorizontal = 'CENTER'; title.textAutoResize = 'HEIGHT'; title.maxLines = 2; title.textTruncation = 'ENDING';
      const sub = await text('Morning focus', 'md/Regular', 'text/2', 'Session'); track.appendChild(sub);
      const scrub = auto('VERTICAL', 'Scrubber', 'space/8'); c.appendChild(scrub); fill(scrub);
      const bar = figma.createFrame(); bar.name = 'Bar'; bar.resize(312, 16); bar.fills = []; bar.clipsContent = false; scrub.appendChild(bar); fill(bar);
      const done = running ? 0.42 : 0;
      const tr = figma.createRectangle(); tr.name = 'Track'; tr.resize(312, 6); tr.y = 5; tr.cornerRadius = 999; tr.fills = [await paint('surface/3')]; tr.constraints = { horizontal: 'STRETCH', vertical: 'CENTER' }; bar.appendChild(tr);
      const fl = figma.createRectangle(); fl.name = 'Fill'; fl.resize(Math.max(1, 312 * done), 6); fl.y = 5; fl.cornerRadius = 999; fl.fills = [await paint('accent/accent')]; bar.appendChild(fl);
      const knob = figma.createEllipse(); knob.name = 'Knob'; knob.resize(16, 16); knob.x = 312 * done - 8; knob.y = 0; knob.fills = [await paint('accent/accent')];
      knob.strokes = [await paint('surface/1')]; knob.strokeWeight = 4; knob.strokeAlign = 'OUTSIDE'; bar.appendChild(knob);
      const labels = auto('HORIZONTAL', 'Times'); labels.primaryAxisAlignItems = 'SPACE_BETWEEN'; scrub.appendChild(labels); fill(labels);
      for (const [n, s] of [['Elapsed', running ? '10:28' : '0:00'], ['Percent', running ? '42%' : '0%'], ['Total', '25:00']]) labels.appendChild(await text(s, 'sm/SemiBold', 'text/2', n));
      const ctl = auto('HORIZONTAL', 'Controls', 'space/24'); ctl.primaryAxisAlignItems = 'CENTER'; ctl.counterAxisAlignItems = 'CENTER'; c.appendChild(ctl); fill(ctl);
      ctl.appendChild(use('PlayerControl', 'Kind=Default, Size=md', { Icon: 'Reset' }));
      ctl.appendChild(use('PlayerControl', 'Kind=Primary, Size=md', { Icon: running ? 'Pause' : 'Play' }));
      ctl.appendChild(use('PlayerControl', 'Kind=Default, Size=md', { Icon: 'Skip' }));
      const foot = auto('VERTICAL', 'Up next', 'space/8'); pad(foot, 'space/12', 'space/16', 'space/12', 'space/16'); radius(foot, 'radius/xl'); foot.fills = [await paint('surface/2')]; c.appendChild(foot); fill(foot);
      foot.appendChild(await overline('Up next'));
      for (const [label, value, gift] of [['Break', '5:00', false], ['Reward', 'Coffee with a friend', true]]) {
        const r = auto('HORIZONTAL', label, 'space/12'); r.primaryAxisAlignItems = 'SPACE_BETWEEN'; r.counterAxisAlignItems = 'CENTER'; foot.appendChild(r); fill(r);
        const l = auto('HORIZONTAL', 'Label', 'space/8'); l.counterAxisAlignItems = 'CENTER'; r.appendChild(l);
        if (gift) l.appendChild(await iconInst('Gift', 'text/2', 14)); else l.appendChild(await text(label, 'md/Regular', 'text/2', 'Name'));
        r.appendChild(await text(value, 'md/SemiBold', 'text/1', 'Value'));
      }
      vs.push(c);
    }
    const set = figma.combineAsVariants(vs, sec); set.name = 'PlayerCard';
    set.description = 'The timer: “Now playing”, the square tile with the countdown (the phase colour fills it while it runs), the task and session, the scrubber with elapsed, % and total, reset / play / skip, then what is up next.';
    vs[0].x = 24; vs[0].y = 24; vs[1].x = 424; vs[1].y = 24; set.resizeWithoutConstraints(808, Math.max(vs[0].height, vs[1].height) + 48);
    keep('PlayerCard', set); await add(set);
  }

  // Queue item: a session in the list (components/queue.css, ui/QueueItem.tsx)
  if (!keep('QueueItem', have('QueueItem'))) {
    const vs = [];
    for (const sel of [false, true]) {
      const ink = sel ? 'accent/on-container' : 'text/1', sub = sel ? 'accent/on-container' : 'text/2';
      const c = figma.createComponent(); c.name = `Selected=${sel ? 'True' : 'False'}`; c.layoutMode = 'HORIZONTAL'; c.counterAxisAlignItems = 'CENTER';
      c.resize(252, 70); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO';
      pad(c, 'space/16', 'space/4', 'space/16', 'space/16'); bindNum(c, 'itemSpacing', 'space/12'); radius(c, 'radius/md'); c.fills = [await paint(sel ? 'accent/container' : 'surface/2')];
      const col = auto('VERTICAL', 'Text', 'space/4'); c.appendChild(col); fill(col);
      const n = await text('Morning focus', 'md/SemiBold', ink, 'Name'); col.appendChild(n); fill(n); n.textTruncation = 'ENDING';
      const meta = auto('HORIZONTAL', 'Meta', 'space/8'); meta.counterAxisAlignItems = 'CENTER'; col.appendChild(meta);
      meta.appendChild(await text('25′ focus · 5′ break', 'sm/Regular', sub, 'Lengths'));
      const lists = auto('HORIZONTAL', 'Lists', 'space/4'); lists.counterAxisAlignItems = 'CENTER'; meta.appendChild(lists);
      lists.appendChild(await iconInst('List', sub, 13)); lists.appendChild(await text('2', 'sm/Regular', sub, 'Count'));
      meta.appendChild(await iconInst('Gift', sub, 13));
      const m = more('sm'); c.appendChild(m); if (sel) await recolor(m, 'accent/on-container');
      vs.push(c);
    }
    const set = figma.combineAsVariants(vs, sec); set.name = 'QueueItem';
    set.description = 'A session in the list: a raised row (surface 2, radius md) with its name, its lengths, how many task lists and whether it gives a reward, and its menu. Selected: the accent container.';
    const nk = set.addComponentProperty('Name', 'TEXT', 'Morning focus'), lk = set.addComponentProperty('Lengths', 'TEXT', '25′ focus · 5′ break');
    for (const c of set.children) { c.findOne(n => n.name === 'Name').componentPropertyReferences = { characters: nk }; c.findOne(n => n.name === 'Lengths').componentPropertyReferences = { characters: lk }; }
    vs[0].x = 24; vs[0].y = 24; vs[1].x = 300; vs[1].y = 24; set.resizeWithoutConstraints(576, vs[0].height + 48);
    keep('QueueItem', set); await add(set);
  }
  // Task row, list heading and the "Add a task" row (features/task-list.css)
  if (!keep('TaskItem', have('TaskItem'))) {
    const vs = [];
    for (const doneTask of [false, true]) {
      const c = figma.createComponent(); c.name = `Done=${doneTask ? 'True' : 'False'}`; c.layoutMode = 'HORIZONTAL'; c.counterAxisAlignItems = 'CENTER';
      c.resize(640, 44); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.minHeight = 44;
      pad(c, 'space/4', 'space/4', 'space/4', 'space/16'); bindNum(c, 'itemSpacing', 'space/12'); radius(c, 'radius/md'); c.fills = [await paint('surface/2')];
      c.appendChild(use('Checkbox', `Checked=${doneTask ? 'True' : 'False'}`));
      const t = await text('Write the summary', 'md/Regular', doneTask ? 'text/2' : 'text/1', 'Task'); if (doneTask) t.textDecoration = 'STRIKETHROUGH'; c.appendChild(t); fill(t);
      if (doneTask) {
        const b = auto('HORIZONTAL', 'Time'); b.counterAxisAlignItems = 'CENTER'; b.resize(40, 24); b.counterAxisSizingMode = 'FIXED'; pad(b, null, 'space/8', null, 'space/8'); radius(b, 'radius/pill');
        b.fills = [await paint('status/success-container')]; b.appendChild(await text('25m', 'sm/SemiBold', 'status/success', 'Time')); c.appendChild(b);
      }
      c.appendChild(more('sm'));
      vs.push(c);
    }
    const set = figma.combineAsVariants(vs, sec); set.name = 'TaskItem';
    set.description = 'A task: a raised row (44 tall, surface 2, radius md) with its check box, the text and its menu. Done: struck through in text 2, with how long it took in a success badge.';
    const k = set.addComponentProperty('Task', 'TEXT', 'Write the summary');
    for (const c of set.children) c.findOne(n => n.name === 'Task').componentPropertyReferences = { characters: k };
    vs[0].x = 24; vs[0].y = 24; vs[1].x = 24; vs[1].y = 92; set.resizeWithoutConstraints(688, 160);
    keep('TaskItem', set); await add(set);
  }
  if (!keep('TaskListHeading', have('TaskListHeading'))) {
    const vs = [];
    for (const open of [true, false]) {
      const c = figma.createComponent(); c.name = `Open=${open ? 'True' : 'False'}`; c.layoutMode = 'HORIZONTAL'; c.counterAxisAlignItems = 'CENTER';
      c.resize(640, 40); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.minHeight = 40; c.fills = [];
      pad(c, null, 'space/4', null, 'space/16'); bindNum(c, 'itemSpacing', 'space/12'); radius(c, 'radius/md');
      c.appendChild(await iconInst(open ? 'ChevronDown' : 'ChevronRight', 'text/2', 16));
      c.appendChild(await text('Quarterly report', 'lg/Bold', 'text/1', 'List'));
      const sp = spacer(); c.appendChild(sp); fill(sp);
      c.appendChild(await text('2 of 5', 'sm/SemiBold', 'text/2', 'Count'));
      c.appendChild(more('sm'));
      vs.push(c);
    }
    const set = figma.combineAsVariants(vs, sec); set.name = 'TaskListHeading';
    set.description = 'A task list’s heading, drawn as type: the caret, the list’s name (lg, bold), how many are done, its menu. Hover: surface 2.';
    const lk = set.addComponentProperty('List', 'TEXT', 'Quarterly report'), ck = set.addComponentProperty('Count', 'TEXT', '2 of 5');
    for (const c of set.children) { c.findOne(n => n.name === 'List').componentPropertyReferences = { characters: lk }; c.findOne(n => n.name === 'Count').componentPropertyReferences = { characters: ck }; }
    vs[0].x = 24; vs[0].y = 24; vs[1].x = 24; vs[1].y = 84; set.resizeWithoutConstraints(688, 148);
    keep('TaskListHeading', set); await add(set);
  }
  if (!keep('AddTaskRow', have('AddTaskRow'))) {
    const c = figma.createComponent(); c.name = 'AddTaskRow'; c.layoutMode = 'HORIZONTAL'; c.counterAxisAlignItems = 'CENTER';
    c.resize(640, 44); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED';
    pad(c, null, 'space/8', null, 'space/16'); bindNum(c, 'itemSpacing', 'space/12'); radius(c, 'radius/md'); c.fills = [await paint('espresso/surface-inset')];
    c.appendChild(await iconInst('Plus', 'text/2', 16)); c.appendChild(await text('Add a task', 'md/Regular', 'text/2', 'Placeholder'));
    c.description = 'The last row of a task list: type a task and press Enter. A tonal “Add” button appears once there is text.';
    keep('AddTaskRow', c); await add(c);
  }

  // The drawer, tinted with the accent's hue (components/nav-rail.css, shell/NavRail.tsx)
  if (!keep('Drawer', have('EspressoDrawer'))) {
    const vs = [];
    const PAGES = [['Timer', 'Timer'], ['Tasks', 'Tasks'], ['Notes', 'FileText'], ['Calendar', 'Calendar'], ['Stats', 'Stats'], ['Goals', 'Target'], ['Rewards', 'Gift']];
    for (const layout of ['Expanded', 'Rail']) {
      const exp = layout === 'Expanded';
      const c = figma.createComponent(); c.name = `Layout=${layout}`; c.layoutMode = 'VERTICAL';
      c.resize(exp ? 240 : 88, 820); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED'; if (!exp) c.counterAxisAlignItems = 'CENTER';
      pad(c, 'space/24', exp ? 'space/16' : null, 'space/16', exp ? 'space/16' : null); bindNum(c, 'itemSpacing', 'space/24'); radius(c, 'radius/3xl'); c.fills = [await paint('drawer/bg')];
      const head = auto('HORIZONTAL', 'Head'); if (exp) { pad(head, null, 'space/12', null, 'space/12'); } c.appendChild(head);
      const tg = use('IconButton', 'Size=sm, State=Default', { Icon: 'Sidebar' }); tg.name = exp ? 'Collapse menu' : 'Expand menu'; if (exp) await recolor(tg, 'accent/text'); head.appendChild(tg);
      const items = auto('VERTICAL', 'Pages', exp ? 'space/8' : 'space/12'); if (!exp) items.counterAxisAlignItems = 'CENTER'; c.appendChild(items); if (exp) fill(items);
      for (const [label, ic] of PAGES) {
        const it = use('NavItem', `Layout=${layout === 'Expanded' ? 'Expanded' : 'Rail'}, Active=${label === 'Timer' ? 'True' : 'False'}`, { Label: label, Icon: ic });
        if (label === 'Rewards') {
          const wrap = auto('HORIZONTAL', 'Rewards'); wrap.clipsContent = false; items.appendChild(wrap); wrap.appendChild(it); if (exp) { fill(wrap); fill(it); }
          const badge = auto('HORIZONTAL', 'Badge'); badge.primaryAxisAlignItems = 'CENTER'; badge.counterAxisAlignItems = 'CENTER'; badge.resize(18, 18); badge.counterAxisSizingMode = 'FIXED';
          pad(badge, null, 'space/4', null, 'space/4'); radius(badge, 'radius/pill'); badge.fills = [await paint('status/live')]; badge.strokes = [await paint('drawer/bg')]; badge.strokeWeight = 2; badge.strokeAlign = 'OUTSIDE';
          badge.appendChild(await text('2', 'xs/Bold', 'status/on-live', 'Count'));
          float(wrap, badge, exp ? 196 : 52, exp ? 15 : -1);
        } else { items.appendChild(it); if (exp) fill(it); }
      }
      const sp = spacer('VERTICAL'); c.appendChild(sp); sp.layoutSizingVertical = 'FILL';
      const ub = ESP.UserBadge.children.find(x => x.name === `Layout=${layout}`).createInstance(); c.appendChild(ub); if (exp) fill(ub);
      vs.push(c);
    }
    const set = figma.combineAsVariants(vs, sec); set.name = 'EspressoDrawer';
    set.description = 'Espresso’s drawer, tinted with the accent’s hue (drawer bg is oklch(0.145 0.014 h)): its toggle, the pages (Timer, Tasks, Notes, Calendar, Stats, Goals, Rewards with a count), the user badge at the foot. Expanded on wide windows, a rail otherwise.';
    vs[0].x = 24; vs[0].y = 24; vs[1].x = 300; vs[1].y = 24; set.resizeWithoutConstraints(412, 868);
    keep('Drawer', set); await add(set);
  }
  // Espresso's top bar (layout/app-column.css, title-bar.css, shell/TopBar.tsx)
  if (!keep('TopBar', have('EspressoTopBar'))) {
    const c = figma.createComponent(); c.name = 'EspressoTopBar'; c.layoutMode = 'HORIZONTAL'; c.counterAxisAlignItems = 'CENTER';
    c.resize(SW, 68); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED'; bindNum(c, 'height', 'size/topbar-height'); c.fills = [];
    const brand = auto('HORIZONTAL', 'Brand'); fixed(brand, 260, 68); brand.counterAxisAlignItems = 'CENTER'; pad(brand, null, null, null, 'space/20'); c.appendChild(brand);
    const markBox = auto('HORIZONTAL', 'Mark'); fixed(markBox, 88, 68); markBox.primaryAxisAlignItems = 'CENTER'; markBox.counterAxisAlignItems = 'CENTER'; brand.appendChild(markBox);
    markBox.appendChild(ESP.AppMark.createInstance());
    const main = auto('HORIZONTAL', 'Main', 'space/16'); main.counterAxisAlignItems = 'CENTER'; pad(main, null, 'space/8', null, 'space/20'); c.appendChild(main); fill(main);
    const title = await text('Timer & sessions', '2xl/Bold', 'text/1', 'Title'); main.appendChild(title);
    const sp = spacer(); main.appendChild(sp); fill(sp);
    const tools = auto('HORIZONTAL', 'Tools', 'space/4'); tools.counterAxisAlignItems = 'CENTER'; main.appendChild(tools);
    for (const [name, ic] of [['Mini player', 'MiniPlayer'], ['Notification settings', 'Bell'], ['Toggle sound', 'SoundOn'], ['Help', 'Help']]) { const b = use('IconButton', 'Size=md, State=Default', { Icon: ic }); b.name = name; tools.appendChild(b); }
    const wc = auto('HORIZONTAL', 'Window'); pad(wc, null, null, null, 'space/8'); wc.appendChild(find('WindowControls').createInstance()); main.appendChild(wc);
    title.componentPropertyReferences = { characters: c.addComponentProperty('Title', 'TEXT', 'Timer & sessions') };
    c.description = 'Espresso’s title bar: the app mark over the drawer, the page title, (away from the Timer while it runs) the status chip, then mini player, notifications, sound and help, then the window’s buttons.';
    keep('TopBar', c); await add(c);
  }
  // Switch row: a setting with its toggle (ui/Switch.tsx, components/switch.css)
  if (!keep('SwitchRow', have('SwitchRow'))) {
    const vs = [], refs = [];
    for (const on of [true, false]) {
      const c = figma.createComponent(); c.name = `On=${on ? 'True' : 'False'}`; c.layoutMode = 'HORIZONTAL'; c.counterAxisAlignItems = 'CENTER';
      c.resize(456, 52); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO';
      pad(c, 'space/12', 'space/16', 'space/12', 'space/16'); bindNum(c, 'itemSpacing', 'space/16'); radius(c, 'radius/md'); c.fills = [await paint('surface/2')];
      const col = auto('VERTICAL', 'Text', 'space/2'); c.appendChild(col); fill(col);
      const l = await text('Alert me when a phase ends', 'md/SemiBold', 'text/1', 'Label'); col.appendChild(l); fill(l); l.textAutoResize = 'HEIGHT';
      const h = await text('A small popup with a button to start what’s next.', 'sm/Regular', 'text/2', 'Hint'); col.appendChild(h); fill(h); h.textAutoResize = 'HEIGHT';
      const sw = use('Switch', `On=${on ? 'True' : 'False'}`); sw.name = 'Switch'; c.appendChild(sw);
      vs.push(c); refs.push({ l, h });
    }
    const set = figma.combineAsVariants(vs, sec); set.name = 'SwitchRow';
    set.description = 'A setting with its toggle: a raised row (surface 2, radius md) with the label, a hint under it in text 2, and the Switch at the right.';
    const lk = set.addComponentProperty('Label', 'TEXT', 'Alert me when a phase ends'), hk = set.addComponentProperty('Hint', 'TEXT', 'A small popup with a button to start what’s next.'), sk = set.addComponentProperty('Show hint', 'BOOLEAN', true);
    for (const r of refs) { r.l.componentPropertyReferences = { characters: lk }; r.h.componentPropertyReferences = { characters: hk, visible: sk }; }
    vs[0].x = 24; vs[0].y = 24; vs[1].x = 24; vs[1].y = vs[0].height + 40; set.resizeWithoutConstraints(504, vs[1].y + vs[1].height + 24);
    keep('SwitchRow', set); await add(set);
  }
  // Stat card: a number and what it counts (ui/StatCard.tsx, features/stats.css; the Rewards counts too)
  if (!keep('StatCard', have('StatCard'))) {
    const c = figma.createComponent(); c.name = 'StatCard'; c.layoutMode = 'VERTICAL';
    c.resize(308, 100); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
    pad(c, 'space/20', 'space/24', 'space/20', 'space/24'); bindNum(c, 'itemSpacing', 'space/8'); radius(c, 'radius/3xl'); c.fills = [await paint('surface/1')];
    const val = await text('3.4', '3xl/Bold', 'text/1', 'Value'); val.letterSpacing = { unit: 'PERCENT', value: -3 }; c.appendChild(val);
    const lbl = await text('Avg sessions / day', 'sm/Regular', 'text/2', 'Label'); c.appendChild(lbl); fill(lbl); lbl.textTruncation = 'ENDING';
    val.componentPropertyReferences = { characters: c.addComponentProperty('Value', 'TEXT', '3.4') };
    lbl.componentPropertyReferences = { characters: c.addComponentProperty('Label', 'TEXT', 'Avg sessions / day') };
    c.description = 'A number and what it counts: the value leads (3xl, bold), the label explains it in text 2. Stats shows four in a row, Rewards three.';
    keep('StatCard', c); await add(c);
  }
  // Note card: a note in the grid (ui/DocTile.tsx, components/doc-tile.css)
  if (!keep('NoteCard', have('NoteCard'))) {
    const vs = [], refs = [];
    for (const sel of [false, true]) {
      const ink = sel ? 'accent/on-container' : 'text/1', sub = sel ? 'accent/on-container' : 'text/2';
      const c = figma.createComponent(); c.name = `Selected=${sel ? 'True' : 'False'}`; c.layoutMode = 'VERTICAL';
      c.resize(312, 132); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; c.minHeight = 132;
      pad(c, 'space/16', 'space/16', 'space/16', 'space/16'); bindNum(c, 'itemSpacing', 'space/8'); radius(c, 'radius/xl'); c.fills = [await paint(sel ? 'accent/container' : 'surface/1')];
      const top = auto('HORIZONTAL', 'Top', 'space/12'); top.counterAxisAlignItems = 'CENTER'; fixed(top, 280, 24); c.appendChild(top); fill(top);
      const check = use('Checkbox', `Checked=${sel ? 'True' : 'False'}`); check.name = 'Check'; top.appendChild(check); check.visible = sel;
      const sp = spacer(); top.appendChild(sp); fill(sp);
      const pin = await iconInst('Pin', sel ? 'accent/on-container' : 'accent/text', 15); pin.name = 'Pinned'; top.appendChild(pin);
      const m = more('sm'); m.name = 'Note actions'; top.appendChild(m); m.visible = sel; if (sel) await recolor(m, 'accent/on-container');
      const txt = auto('VERTICAL', 'Text', 'space/4'); c.appendChild(txt); fill(txt);
      const t = await text('Weekly plan', 'lg/SemiBold', ink, 'Title'); txt.appendChild(t); fill(t); t.textAutoResize = 'HEIGHT'; t.maxLines = 2; t.textTruncation = 'ENDING';
      const meta = await text('Edited today, 09:12 · Work', 'sm/Regular', sub, 'Meta'); txt.appendChild(meta); fill(meta); meta.textTruncation = 'ENDING';
      const chips = auto('HORIZONTAL', 'Labels', 'space/8'); c.appendChild(chips);
      const labels = []; for (const n of ['Label 1', 'Label 2']) { const ch = use('Chip', 'Tone=Default', { Label: 'Planning' }); ch.name = n; chips.appendChild(ch); labels.push(ch); }
      vs.push(c); refs.push({ t, meta, pin, labels });
    }
    const set = figma.combineAsVariants(vs, sec); set.name = 'NoteCard';
    set.description = 'A note in the grid: its title (two lines at most), when it changed and where it lives, a pin when pinned, up to two labels. The check box and the menu show on hover; selected, the card takes the accent container.';
    const tk = set.addComponentProperty('Title', 'TEXT', 'Weekly plan'), mk = set.addComponentProperty('Meta', 'TEXT', 'Edited today, 09:12 · Work'), pk = set.addComponentProperty('Pinned', 'BOOLEAN', false);
    const k1 = set.addComponentProperty('Show label 1', 'BOOLEAN', true), k2 = set.addComponentProperty('Show label 2', 'BOOLEAN', false);
    for (const r of refs) { r.t.componentPropertyReferences = { characters: tk }; r.meta.componentPropertyReferences = { characters: mk }; r.pin.componentPropertyReferences = { visible: pk }; r.labels[0].componentPropertyReferences = { visible: k1 }; r.labels[1].componentPropertyReferences = { visible: k2 }; }
    vs[0].x = 24; vs[0].y = 24; vs[1].x = 360; vs[1].y = 24; set.resizeWithoutConstraints(696, Math.max(vs[0].height, vs[1].height) + 48);
    keep('NoteCard', set); await add(set);
  }
  // Reward card (rewards/RewardCard.tsx, features/rewards.css). The emoji is drawn as an icon: a new file has no emoji font to count on
  if (!keep('RewardCard', have('RewardCard'))) {
    const vs = [], refs = [];
    for (const state of ['Ready', 'In progress', 'Claimed']) {
      const ready = state === 'Ready', claimed = state === 'Claimed';
      const c = figma.createComponent(); c.name = `State=${state}`; c.layoutMode = 'VERTICAL';
      c.resize(420, 300); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
      pad(c, null, null, 'space/24', null); bindNum(c, 'itemSpacing', 'space/20'); radius(c, 'radius/3xl'); c.fills = [await paint('surface/1')]; c.clipsContent = true;
      const band = auto('VERTICAL', 'Band', 'space/4'); pad(band, 'space/24', 'space/24', 'space/20', 'space/24'); band.fills = [await paint(ready ? 'accent/container' : 'surface/2')]; c.appendChild(band); fill(band);
      const top = auto('HORIZONTAL', 'Top', 'space/8'); top.counterAxisAlignItems = 'CENTER'; band.appendChild(top); fill(top);
      const over = await overline('Weekly', ready ? 'accent/on-container' : 'accent/text'); top.appendChild(over);
      const sp = spacer(); top.appendChild(sp); fill(sp); const m = more('md'); top.appendChild(m); if (ready) await recolor(m, 'accent/on-container');
      const head = auto('HORIZONTAL', 'Title', 'space/12'); head.counterAxisAlignItems = 'CENTER'; band.appendChild(head); fill(head);
      const tile = auto('HORIZONTAL', 'Emoji'); fixed(tile, 50, 50); tile.primaryAxisAlignItems = 'CENTER'; tile.counterAxisAlignItems = 'CENTER'; radius(tile, 'radius/md'); tile.fills = [await paint(ready ? 'accent/accent' : 'surface/3')];
      const ic = await iconInst('Gift', ready ? 'accent/on-accent' : 'text/1', 24); ic.name = 'Icon'; tile.appendChild(ic); head.appendChild(tile);
      const name = await text('Coffee with a friend', 'lg/SemiBold', claimed ? 'text/3' : ready ? 'accent/on-container' : 'text/1', 'Name'); if (claimed) name.textDecoration = 'STRIKETHROUGH';
      head.appendChild(name); fill(name); name.textAutoResize = 'HEIGHT';
      const body = auto('VERTICAL', 'Body', 'space/12'); pad(body, null, 'space/24', null, 'space/24'); c.appendChild(body); fill(body);
      const meta = auto('HORIZONTAL', 'Meta', 'space/8'); body.appendChild(meta);
      const trig = await badge('Session', 'surface/2', 'text/2'); trig.name = 'Trigger'; meta.appendChild(trig);
      if (claimed) meta.appendChild(await badge('Claimed', 'status/success-container', 'status/success'));
      const d = await text('After Friday’s deep work.', 'md/Regular', 'text/2', 'Description'); body.appendChild(d); fill(d); d.textAutoResize = 'HEIGHT';
      if (ready) { const b = use('Button', 'Style=Primary, Size=lg', { Label: 'Claim reward' }); b.name = 'Claim reward'; body.appendChild(b); fill(b); }
      vs.push(c); refs.push({ over, name, ic, d, trig: trig.findOne(n => n.type === 'TEXT') });
    }
    const set = figma.combineAsVariants(vs, sec); set.name = 'RewardCard';
    set.description = 'A reward: the band with how often it comes and its menu, the emoji tile (an icon here) and the name; what unlocks it, what it is. Ready: the band in the accent container and “Claim reward”. Claimed: the name struck through and a success badge.';
    const fk = set.addComponentProperty('Frequency', 'TEXT', 'WEEKLY'), nk = set.addComponentProperty('Name', 'TEXT', 'Coffee with a friend'), dk = set.addComponentProperty('Description', 'TEXT', 'After Friday’s deep work.');
    const gk = set.addComponentProperty('Trigger', 'TEXT', 'Session'), ik = set.addComponentProperty('Icon', 'INSTANCE_SWAP', icon('Gift').id);
    for (const r of refs) { r.over.componentPropertyReferences = { characters: fk }; r.name.componentPropertyReferences = { characters: nk }; r.d.componentPropertyReferences = { characters: dk }; r.trig.componentPropertyReferences = { characters: gk }; r.ic.componentPropertyReferences = { mainComponent: ik }; }
    let x = 24; for (const c of vs) { c.x = x; c.y = 24; x += c.width + 32; } set.resizeWithoutConstraints(x - 8, Math.max(...vs.map(c => c.height)) + 48);
    keep('RewardCard', set); await add(set);
  }
  // Goal card (goals/GoalCard.tsx, ScheduleBadge.tsx, features/goals.css): its landmarks are the app's task rows
  if (!keep('GoalCard', have('GoalCard'))) {
    const vs = [], refs = [];
    for (const done of [false, true]) {
      const c = figma.createComponent(); c.name = `Done=${done ? 'True' : 'False'}`; c.layoutMode = 'VERTICAL';
      c.resize(420, 400); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; radius(c, 'radius/3xl'); c.fills = [await paint('surface/1')]; c.clipsContent = true;
      const band = auto('VERTICAL', 'Band', 'space/4'); pad(band, 'space/24', 'space/24', 'space/20', 'space/24'); band.fills = [await paint('surface/2')]; c.appendChild(band); fill(band);
      const top = auto('HORIZONTAL', 'Top', 'space/8'); top.counterAxisAlignItems = 'CENTER'; band.appendChild(top); fill(top);
      const over = await overline('Monthly', 'accent/text'); top.appendChild(over); const sp = spacer(); top.appendChild(sp); fill(sp);
      const count = await text(done ? '3 of 3' : '1 of 3', 'sm/SemiBold', 'text/2', 'Count'); top.appendChild(count); top.appendChild(more('md'));
      const title = await text('Read 10 books', 'xl/Bold', 'text/1', 'Title'); band.appendChild(title); fill(title); title.textAutoResize = 'HEIGHT';
      const chips = auto('HORIZONTAL', 'Chips', 'space/8'); chips.counterAxisAlignItems = 'CENTER'; pad(chips, 'space/4', null, null, null); band.appendChild(chips);
      if (done) chips.appendChild(await badge('Done', 'status/success-container', 'status/success', 'Check'));
      const due = await badge(done ? 'Due Dec 31' : 'Due Dec 31 · 35 days left', 'surface/3', 'text/2', 'Calendar', 'xs/SemiBold'); due.name = 'Schedule'; chips.appendChild(due);
      const pw = auto('VERTICAL', 'Progress'); pad(pw, 'space/8', null, null, null); band.appendChild(pw); fill(pw);
      // Its own bar, not the library's: the part done can be any length, and is all of it once the goal is done
      const pb = auto('HORIZONTAL', 'Bar'); fixed(pb, 372, 6); bindNum(pb, 'height', 'size/progress-height'); radius(pb, 'radius/pill'); pb.fills = [await paint('surface/3')]; pb.clipsContent = true; pw.appendChild(pb); fill(pb);
      const part = figma.createRectangle(); part.name = 'Part done'; part.resize(done ? 372 : 124, 6); radius(part, 'radius/pill'); part.fills = [await paint(done ? 'status/success' : 'accent/accent')]; pb.appendChild(part);
      if (done) part.layoutSizingHorizontal = 'FILL';
      const body = auto('VERTICAL', 'Body', 'space/16'); pad(body, 'space/20', 'space/24', 'space/24', 'space/24'); c.appendChild(body); fill(body);
      const desc = await text('One a month, and two over the holidays.', 'md/Regular', 'text/2', 'Description'); body.appendChild(desc); fill(desc); desc.textAutoResize = 'HEIGHT';
      const rows = auto('VERTICAL', 'Landmarks', 'space/4'); body.appendChild(rows); fill(rows);
      const marks = [];
      for (const [k, t] of ['Pick the next three books', 'Finish chapter 3', 'Write a short review'].entries()) {
        const r = esp('TaskItem', `Done=${done || k === 0 ? 'True' : 'False'}`, { Task: t }); r.name = `Landmark ${k + 1}`; rows.appendChild(r); fill(r);
        const time = r.findOne(n => n.type === 'FRAME' && n.name === 'Time'); if (time) time.visible = false;   // a landmark isn't timed
        marks.push(r);
      }
      const last = esp('AddTaskRow'); last.name = 'Add a landmark'; rows.appendChild(last); fill(last); setText(last, 'Placeholder', 'Add a landmark');
      vs.push(c); refs.push({ over, count, title, desc, due: due.findOne(n => n.type === 'TEXT'), third: marks[2] });
    }
    const set = figma.combineAsVariants(vs, sec); set.name = 'GoalCard';
    set.description = 'A goal: the band with its period, how many landmarks are done, the title, its dates and the bar (resize “Part done” to set it); then the description, the landmarks as task rows (Landmark 1 to 3: set each one’s Task and Done) and “Add a landmark”. Done: the success chip and a full bar.';
    const fk = set.addComponentProperty('Frequency', 'TEXT', 'MONTHLY'), ck = set.addComponentProperty('Count', 'TEXT', '1 of 3'), tk = set.addComponentProperty('Title', 'TEXT', 'Read 10 books');
    const sk = set.addComponentProperty('Schedule', 'TEXT', 'Due Dec 31 · 35 days left'), dk = set.addComponentProperty('Description', 'TEXT', 'One a month, and two over the holidays.');
    const vk = set.addComponentProperty('Show description', 'BOOLEAN', true), lk = set.addComponentProperty('Show landmark 3', 'BOOLEAN', true);
    for (const r of refs) {
      r.over.componentPropertyReferences = { characters: fk }; r.count.componentPropertyReferences = { characters: ck }; r.title.componentPropertyReferences = { characters: tk };
      r.due.componentPropertyReferences = { characters: sk }; r.desc.componentPropertyReferences = { characters: dk, visible: vk }; r.third.componentPropertyReferences = { visible: lk };
    }
    vs[0].x = 24; vs[0].y = 24; vs[1].x = 476; vs[1].y = 24; set.resizeWithoutConstraints(920, Math.max(vs[0].height, vs[1].height) + 48);
    keep('GoalCard', set); await add(set);
  }
}

// ══ Screens ══════════════════════════════════════════════
// The window: the top bar across, the drawer at the left, the page beside it
async function win(f, title, drawer, active) {
  f.layoutMode = 'VERTICAL'; f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED';
  const top = ESP.TopBar.createInstance(); f.appendChild(top); fill(top); prop(top, 'Title', title);
  const body = auto('HORIZONTAL', 'Body'); f.appendChild(body); fillBoth(body);
  const nav = auto('VERTICAL', 'Nav'); pad(nav, 'space/4', null, 'space/20', 'space/20'); body.appendChild(nav); nav.layoutSizingVertical = 'FILL';
  const d = ESP.Drawer.children.find(x => x.name === `Layout=${drawer || 'Expanded'}`).createInstance(); nav.appendChild(d); d.layoutSizingVertical = 'FILL';
  if (active && active !== 'Timer') openPage(d, active);
  const page = auto('HORIZONTAL', 'Page', 'space/20'); pad(page, 'space/4', 'space/20', 'space/20', 'space/20'); body.appendChild(page); fillBoth(page);
  return { top, drawer: d, page };
}
async function sessionCard() {
  const { card, body } = await bandCard('Session', 'Session', 'Morning focus');
  body.itemSpacing = 32;
  const list = auto('VERTICAL', 'Quarterly report', 'space/12'); body.appendChild(list); fill(list);
  const h = ESP.TaskListHeading.children.find(x => x.name === 'Open=True').createInstance(); list.appendChild(h); fill(h);
  const lb = auto('VERTICAL', 'List body', 'space/12'); list.appendChild(lb); fill(lb);
  const pb = use('ProgressBar', 'Tone=Default, Size=md'); lb.appendChild(pb); fill(pb);
  const rows = auto('VERTICAL', 'Tasks', 'space/4'); lb.appendChild(rows); fill(rows);
  for (const [t, d] of [['Gather last quarter’s numbers', true], ['Outline the sections', true], ['Write the summary', false], ['Make the charts', false], ['Send it for review', false]]) {
    const r = ESP.TaskItem.children.find(x => x.name === `Done=${d ? 'True' : 'False'}`).createInstance(); rows.appendChild(r); fill(r); prop(r, 'Task', t);
  }
  const add = ESP.AddTaskRow.createInstance(); rows.appendChild(add); fill(add);
  const inbox = ESP.TaskListHeading.children.find(x => x.name === 'Open=False').createInstance(); body.appendChild(inbox); fill(inbox); prop(inbox, 'List', 'Inbox'); prop(inbox, 'Count', '0 of 3');
  body.appendChild(use('Button', 'Style=Secondary, Size=md', { Label: 'Add task list', 'Show icon': true, Icon: 'Plus' }));
  return card;
}
async function sessionsPanel() {
  const { card, body } = await bandCard('Sessions', 'Sessions', 'Morning focus');
  body.itemSpacing = 8;
  for (const [n, l, sel] of [['Morning focus', '25′ focus · 5′ break', true], ['Deep work', '50′ focus · 10′ break', false], ['Admin', '15′ focus · 3′ break', false], ['Reading', '30′ focus · 5′ break', false]]) {
    const q = ESP.QueueItem.children.find(x => x.name === `Selected=${sel ? 'True' : 'False'}`).createInstance(); body.appendChild(q); fill(q); prop(q, 'Name', n); prop(q, 'Lengths', l);
  }
  const foot = auto('VERTICAL', 'Foot'); pad(foot, 'space/16', null, null, null); body.appendChild(foot);
  foot.appendChild(use('Button', 'Style=Secondary, Size=md', { Label: 'New session', 'Show icon': true, Icon: 'Plus' }));
  return card;
}
async function timerPage(f, drawer) {
  const { page } = await win(f, 'Timer & sessions', drawer);
  page.counterAxisAlignItems = 'MIN';
  const player = ESP.PlayerCard.children.find(x => x.name === 'Running=False').createInstance(); page.appendChild(player);
  const s = await sessionCard(); page.appendChild(s); fill(s);
  const q = await sessionsPanel(); page.appendChild(q); q.resize(300, q.height); q.counterAxisSizingMode = 'FIXED'; q.primaryAxisSizingMode = 'AUTO';
  return page;
}

// ── Parts shared by the pages and the dialogs ────────────
const MODAL = 520, MODAL_WIDE = 620;   // components/modal.css: --modal-max-width, --modal-max-width-wide
// The drawer is drawn with the Timer open: moves that mark to another page
function openPage(drawer, label) {
  for (const it of drawer.findAll(n => n.type === 'INSTANCE' && n.name.startsWith('Layout='))) {
    const key = Object.keys(it.componentProperties).find(k => k.startsWith('Label#')); if (!key) continue;
    const on = it.componentProperties[key].value === label; soft(() => prop(it, 'Active', on ? 'True' : 'False'));
  }
}
// The page's one column, under the top bar
function column(page, gap) { const m = auto('VERTICAL', 'Main', gap || 'space/20'); page.appendChild(m); fillBoth(m); return m; }
// A row across the page: what leads at the left, the actions at the right
function pageHead(parent, name, left, right) {
  const r = auto('HORIZONTAL', name, 'space/12'); r.counterAxisAlignItems = 'CENTER'; parent.appendChild(r); fill(r);
  for (const x of left) r.appendChild(x); const sp = spacer(); r.appendChild(sp); fill(sp); for (const x of right) r.appendChild(x);
  return r;
}
// Cards in rows of n, each an equal share of the row (ui/LayoutGrid.tsx)
function gridOf(parent, name, cards, n) {
  const g = auto('VERTICAL', name, 'space/20'); parent.appendChild(g); fill(g);
  for (let i = 0; i < cards.length; i += n) {
    const r = auto('HORIZONTAL', 'Row', 'space/20'); r.counterAxisAlignItems = 'MIN'; g.appendChild(r); fill(r);
    const part = cards.slice(i, i + n); for (const c of part) { r.appendChild(c); fill(c); }
    for (let k = part.length; k < n; k++) { const e = spacer(); r.appendChild(e); fill(e); }
  }
  return g;
}
// One of a few (ui/SegmentedControl.tsx, components/segmented.css): the library's options on a track.
// An option given as { name, icon } is drawn as an icon alone
async function segmented(name, options, selected, track) {
  const s = auto('HORIZONTAL', name, 'space/2'); pad(s, 'space/4', 'space/4', 'space/4', 'space/4'); radius(s, 'radius/pill'); s.fills = [await paint(track || 'surface/1')];
  for (const [i, o] of options.entries()) {
    const on = i === selected;
    if (typeof o === 'string') { s.appendChild(use('SegmentedOption', `Selected=${on ? 'True' : 'False'}`, { Label: o })); continue; }
    const c = auto('HORIZONTAL', o.name); c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER'; c.resize(48, 32); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
    bindNum(c, 'height', 'size/icon-button-size-sm'); pad(c, null, 'space/16', null, 'space/16'); radius(c, 'radius/pill'); if (on) c.fills = [await paint('accent/accent')];
    c.appendChild(await iconInst(o.icon, on ? 'accent/on-accent' : 'text/2', 16)); s.appendChild(c);
  }
  return s;
}
// The filter every card grid starts with (ui/FilterGridLayout.tsx): the frequencies, and the page's action
const FREQUENCIES = ['All', 'Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'];
async function filterBar(parent, action) {
  return pageHead(parent, 'Filter', [await segmented('Frequency', FREQUENCIES, 0)], [use('Button', 'Style=Primary, Size=md', { Label: action, 'Show icon': true, Icon: 'Plus' })]);
}
// A label over its control (ui/Field.tsx, components/form.css). Without a control, add yours to what it returns
async function field(parent, label, control) {
  const f = auto('VERTICAL', label, 'space/8'); parent.appendChild(f); fill(f);
  f.appendChild(await text(label, 'sm/SemiBold', 'text/2', 'Label')); if (control) { f.appendChild(control); fill(control); }
  return f;
}
// Espresso's text field: a 44px pill (form-input). With a chevron it is the dropdown (components/select.css)
async function input(value, filled, chevron) {
  const inp = auto('HORIZONTAL', chevron ? 'Select' : 'Input', 'space/8'); inp.counterAxisAlignItems = 'CENTER'; fixed(inp, 340, 44); bindNum(inp, 'height', 'size/field-height');
  pad(inp, null, chevron ? 'space/8' : 'space/16', null, 'space/16'); radius(inp, 'radius/pill'); inp.fills = [await paint('field/bg')];
  const t = await text(value, 'md/Regular', filled === false ? 'text/3' : 'text/1', 'Value'); inp.appendChild(t); fill(t); t.textTruncation = 'ENDING';
  if (chevron) {
    const ch = auto('HORIZONTAL', 'Chevron'); fixed(ch, 28, 28); ch.primaryAxisAlignItems = 'CENTER'; ch.counterAxisAlignItems = 'CENTER'; radius(ch, 'radius/pill'); ch.fills = [await paint('row/bg')];
    ch.appendChild(await iconInst('ChevronDown', 'text/2', 16)); inp.appendChild(ch);
  }
  return inp;
}
// Minutes with a minus and a plus (ui/Stepper.tsx, components/stepper.css)
async function stepper(value, suffix) {
  const s = auto('HORIZONTAL', 'Stepper'); s.counterAxisAlignItems = 'CENTER'; fixed(s, 200, 44); bindNum(s, 'height', 'size/field-height'); pad(s, null, 'space/2', null, 'space/2'); radius(s, 'radius/pill'); s.fills = [await paint('field/bg')];
  const less = use('IconButton', 'Size=md, State=Default', { Icon: 'Minus' }); less.name = 'Less'; s.appendChild(less);
  const mid = auto('HORIZONTAL', 'Value', 'space/4'); mid.primaryAxisAlignItems = 'CENTER'; mid.counterAxisAlignItems = 'CENTER'; s.appendChild(mid); fill(mid);
  mid.appendChild(await text(value, 'lg/SemiBold', 'text/1', 'Number')); mid.appendChild(await text(suffix, 'sm/Regular', 'text/2', 'Suffix'));
  const more_ = use('IconButton', 'Size=md, State=Default', { Icon: 'Plus' }); more_.name = 'More'; s.appendChild(more_);
  return s;
}
// A task list attached to a session (ui/InputChip.tsx, components/input-chip.css)
async function inputChip(label, left) {
  const c = auto('HORIZONTAL', label, 'space/8'); c.counterAxisAlignItems = 'CENTER'; c.resize(80, 32); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
  pad(c, null, 'space/4', null, 'space/8'); radius(c, 'radius/pill'); c.fills = [await paint('accent/container')];
  c.appendChild(await iconInst('List', 'accent/on-container', 14)); c.appendChild(await text(label, 'sm/SemiBold', 'accent/on-container', 'Label'));
  const m = await badge(String(left), 'accent/on-container', 'accent/container', null, 'xs/SemiBold', 20); m.name = 'Left'; c.appendChild(m);
  const x = use('IconButton', 'Size=xs, State=Default', { Icon: 'Close' }); x.name = 'Remove from session'; await recolor(x, 'accent/on-container'); c.appendChild(x);
  return c;
}
// A form's footer (ui/FormActions.tsx): the main action at the right, Cancel once something changed
function formActions(parent, primary, cancel) {
  const r = auto('HORIZONTAL', 'Actions', 'space/8'); r.primaryAxisAlignItems = 'MAX'; r.counterAxisAlignItems = 'CENTER'; pad(r, 'space/4', null, null, null); parent.appendChild(r); fill(r);
  if (cancel) r.appendChild(use('Button', 'Style=Secondary, Size=md', { Label: cancel }));
  r.appendChild(use('Button', 'Style=Primary, Size=md', { Label: primary })); return r;
}
// A section of a settings dialog: its heading, a line under it, then what you add (features/profile.css)
async function settingsSection(parent, title, sub, danger) {
  const s = auto('VERTICAL', title, 'space/16'); parent.appendChild(s); fill(s);
  const h = auto('VERTICAL', 'Heading', 'space/4'); s.appendChild(h); fill(h);
  h.appendChild(await text(title, 'lg/SemiBold', danger ? 'status/danger' : 'text/1', 'Title')); if (sub) await para(h, sub, 'sm/Regular', 'text/2', 'Subtitle');
  return s;
}
// The scrim over the whole window, centring what is put in it (components/modal.css, features/celebration.css)
async function backdrop(f, name) {
  const b = auto('VERTICAL', name); fixed(b, f.width, f.height); b.primaryAxisAlignItems = 'CENTER'; b.counterAxisAlignItems = 'CENTER'; b.fills = [await paint('structure/scrim')];
  float(f, b, 0, 0); return b;
}
// A dialog over the page (ui/Modal.tsx, components/modal.css): returns its body, to fill
async function modalOver(f, title, width) {
  const back = await backdrop(f, 'Modal backdrop');
  const m = auto('VERTICAL', title); setWidth(m, width || MODAL); bindNum(m, 'width', width === MODAL_WIDE ? 'size/modal-max-width-wide' : 'size/modal-max-width');
  radius(m, 'radius/3xl'); m.fills = [await paint('surface/1')]; m.clipsContent = true; await elevate(m); back.appendChild(m);
  const head = auto('HORIZONTAL', 'Header', 'space/12'); head.counterAxisAlignItems = 'CENTER'; pad(head, 'space/24', 'space/16', 'space/8', 'space/32'); m.appendChild(head); fill(head);
  const t = await text(title, 'xl/Bold', 'text/1', 'Title'); head.appendChild(t); fill(t);
  const x = use('IconButton', 'Size=md, State=Default', { Icon: 'Close' }); x.name = 'Close'; head.appendChild(x);
  // The body sits in a view that cuts it: a long dialog scrolls there, under its header (see capModal)
  const view = auto('VERTICAL', 'Scroll'); view.clipsContent = true; m.appendChild(view); fill(view);
  const body = auto('VERTICAL', 'Body', 'space/16'); pad(body, 'space/16', 'space/32', 'space/32', 'space/32'); view.appendChild(body); fill(body);
  return body;
}
// A dialog taller than the window stops 24 from its edges and its body scrolls: here the view cuts the body,
// showing its start, or its end when asked
function capModal(body, end) {
  const view = body.parent, m = view.parent; if (m.height <= SH - 48) return;
  const wide = m.width > MODAL; m.resize(m.width, SH - 48); m.primaryAxisSizingMode = 'FIXED'; bindNum(m, 'width', wide ? 'size/modal-max-width-wide' : 'size/modal-max-width');
  view.layoutSizingVertical = 'FILL'; if (end) view.primaryAxisAlignItems = 'MAX';
}
// The tour's dim layer with a clear window in it (features/tour.css, .tour-hole): four scrims around the window
async function spotlight(f, x, y, w, h) {
  for (const [n, rx, ry, rw, rh] of [['above', 0, 0, f.width, y], ['left', 0, y, x, h], ['right', x + w, y, f.width - x - w, h], ['below', 0, y + h, f.width, f.height - y - h]]) {
    if (rw <= 0 || rh <= 0) continue;
    const r = figma.createRectangle(); r.name = `Scrim ${n}`; r.resize(rw, rh); r.fills = [await paint('structure/scrim')]; float(f, r, rx, ry);
  }
}
// A ring: a circle's outline, all of it, or (as an arc with no body) the part done, clockwise from the top
async function ring(size, weight, color, done) {
  const e = figma.createEllipse(); e.name = done === undefined ? 'Ring track' : 'Ring'; e.resize(size, size); e.fills = []; e.strokes = [await paint(color)]; e.strokeWeight = weight;
  if (done !== undefined) soft(() => { e.strokeCap = 'ROUND'; e.arcData = { startingAngle: -Math.PI / 2, endingAngle: -Math.PI / 2 + 2 * Math.PI * done, innerRadius: 1 }; });
  return e;
}
// A bar part filled, made here so its fill can be any length (the library's ProgressBar keeps its own)
async function bar(parent, done, track) {
  const b = auto('HORIZONTAL', 'Progress'); fixed(b, 100, 6); bindNum(b, 'height', 'size/progress-height'); radius(b, 'radius/pill'); b.fills = [await paint(track || 'surface/3')]; b.clipsContent = true;
  parent.appendChild(b); fill(b);
  const f = figma.createRectangle(); f.name = 'Fill'; f.resize(Math.max(1, Math.round(b.width * done)), 6); radius(f, 'radius/pill'); f.fills = [await paint('accent/accent')]; b.appendChild(f);
  return b;
}

// ── The pages ────────────────────────────────────────────
// Notes (src/components/notes/NotesPage.tsx, NotesSidebar.tsx, NotesToolbar.tsx; ui/ScopeList.tsx, components/scope-list.css)
async function scopeItem(parent, label, ic, count, active) {
  const ink = active ? 'accent/on-container' : 'text/2';
  const r = auto('HORIZONTAL', label, 'space/8'); r.counterAxisAlignItems = 'CENTER'; fixed(r, 200, 40); bindNum(r, 'height', 'size/button-height'); pad(r, null, 'space/12', null, 'space/12'); radius(r, 'radius/pill');
  if (active) r.fills = [await paint('accent/container')]; parent.appendChild(r); fill(r);
  r.appendChild(await iconInst(ic, ink, 18)); const n = await text(label, 'md/SemiBold', ink, 'Name'); r.appendChild(n); fill(n); n.textTruncation = 'ENDING';
  r.appendChild(await text(String(count), 'sm/Regular', ink, 'Count')); return r;
}
async function notesPage(f) {
  const { page } = await win(f, 'Notes', null, 'Notes'); page.counterAxisAlignItems = 'MIN';
  const side = auto('VERTICAL', 'Places', 'space/16'); setWidth(side, 300); pad(side, 'space/16', 'space/12', 'space/16', 'space/12'); radius(side, 'radius/3xl'); side.fills = [await paint('surface/1')]; page.appendChild(side);
  for (const [heading, action, items] of [
    [null, null, [['All notes', 'FileText', 8, true], ['Inbox', 'Download', 2], ['Trash', 'Trash', 1]]],
    ['Collections', 'New collection', [['Work', 'Folder', 3], ['Reading', 'Folder', 2], ['Personal', 'Folder', 1]]],
    ['Labels', 'New label', [['Planning', 'Tag', 2], ['Report', 'Tag', 1], ['Handoff', 'Tag', 1], ['Books', 'Tag', 2]]]]) {
    const s = auto('VERTICAL', heading || 'Notes'); side.appendChild(s); fill(s);
    if (heading) {
      const h = auto('HORIZONTAL', 'Heading'); h.counterAxisAlignItems = 'CENTER'; pad(h, null, 'space/4', 'space/8', 'space/12'); s.appendChild(h); fill(h);
      h.appendChild(await overline(heading)); const sp = spacer(); h.appendChild(sp); fill(sp);
      const b = use('IconButton', 'Size=xs, State=Default', { Icon: 'Plus' }); b.name = action; h.appendChild(b);
    }
    for (const [label, ic, count, on] of items) await scopeItem(s, label, ic, count, on);
  }
  const main = auto('VERTICAL', 'Main', 'space/16'); page.appendChild(main); fill(main);
  const tools = auto('HORIZONTAL', 'Toolbar', 'space/12'); tools.counterAxisAlignItems = 'CENTER'; main.appendChild(tools); fill(tools);
  const search = use('SearchField', 'Filled=False', { Placeholder: 'Search your notes…' }); tools.appendChild(search); fill(search);
  const sort = await input('Recently edited', true, true); sort.name = 'Sort notes'; sort.resize(200, 44); tools.appendChild(sort);
  tools.appendChild(await segmented('Layout', [{ name: 'Grid', icon: 'ViewTiles' }, { name: 'List', icon: 'ViewList' }], 0));
  tools.appendChild(use('Button', 'Style=Secondary, Size=md', { Label: 'Import', 'Show icon': true, Icon: 'Download' }));
  tools.appendChild(use('Button', 'Style=Primary, Size=md', { Label: 'New note', 'Show icon': true, Icon: 'Plus' }));
  const cards = [];
  for (const [title, meta, labels, pinned] of [
    ['Weekly plan', 'Edited today, 09:12 · Work', ['Planning'], true], ['Quarterly report outline', 'Edited today, 08:40 · Work', ['Report', 'Planning']],
    ['Ideas for the reading list', 'Edited yesterday · Reading', ['Books']], ['Design review: what we agreed', 'Edited Nov 24 · Work', ['Handoff']],
    ['Lemon pasta, the quick way', 'Edited Nov 22', []], ['Trip checklist', 'Edited Nov 20 · Personal', []],
    ['Notes on “Deep Work”', 'Edited Nov 18 · Reading', ['Books']], ['Things to ask the landlord', 'Edited Nov 15', []]]) {
    const c = esp('NoteCard', 'Selected=False', { Title: title, Meta: meta, Pinned: !!pinned, 'Show label 1': labels.length > 0, 'Show label 2': labels.length > 1 });
    labels.forEach((l, k) => inner(c, `Label ${k + 1}`, 'Label', l)); cards.push(c);
  }
  gridOf(main, 'Notes', cards, 3);
}
// A note open for writing (notes/NoteEditorPage.tsx, ui/DocEditor.tsx, features/notes.css)
async function noteEditorPage(f) {
  const { page } = await win(f, 'Notes', null, 'Notes'); page.primaryAxisAlignItems = 'CENTER'; page.counterAxisAlignItems = 'MIN';
  const card = auto('VERTICAL', 'Note editor', 'space/16'); setWidth(card, 860); pad(card, 'space/24', 'space/24', 'space/24', 'space/24'); radius(card, 'radius/3xl'); card.fills = [await paint('surface/1')]; page.appendChild(card);
  const head = auto('HORIZONTAL', 'Head', 'space/12'); head.counterAxisAlignItems = 'CENTER'; card.appendChild(head); fill(head);
  const back = use('IconButton', 'Size=md, State=Default', { Icon: 'ChevronLeft' }); back.name = 'Back to notes'; head.appendChild(back);
  const t = await text('Weekly plan', 'xl/Bold', 'text/1', 'Note title'); head.appendChild(t); fill(t);
  head.appendChild(await text('Saved', 'sm/Regular', 'text/2', 'Status')); head.appendChild(more('md'));
  const tools = auto('HORIZONTAL', 'Toolbar', 'space/2'); tools.counterAxisAlignItems = 'CENTER'; pad(tools, 'space/8', 'space/8', 'space/8', 'space/8'); radius(tools, 'radius/pill'); tools.fills = [await paint('surface/2')]; card.appendChild(tools); fill(tools);
  for (const group of [['Heading', 'Bold', 'Italic', 'Strike', 'Code'], ['List', 'ListOrdered', 'Checklist'], ['Quote', 'CodeBlock', 'Link'], ['Undo', 'Redo']]) {
    if (tools.children.length) { const w = auto('HORIZONTAL', 'Separator'); pad(w, null, 'space/8', null, 'space/8'); const s = await rule(1, 'surface/4'); s.resize(1, 20); w.appendChild(s); tools.appendChild(w); }
    for (const ic of group) { const b = use('IconButton', 'Size=sm, State=Default', { Icon: ic }); b.name = ic; tools.appendChild(b); }
  }
  const body = auto('VERTICAL', 'Note text', 'space/12'); pad(body, 'space/8', 'space/8', 'space/8', 'space/8'); card.appendChild(body); fill(body);
  await para(body, 'This week', 'lg/Bold', 'text/1', 'Heading');
  await para(body, 'Three things matter most: the quarterly report, the design review on Thursday, and keeping the mornings free for deep work.', 'md/Regular', 'text/1', 'Paragraph');
  for (const [task, done] of [['Gather last quarter’s numbers', true], ['Outline the sections', true], ['Write the summary', false], ['Send it for review', false]]) {
    const r = auto('HORIZONTAL', task, 'space/12'); r.counterAxisAlignItems = 'CENTER'; body.appendChild(r); fill(r);
    r.appendChild(use('Checkbox', `Checked=${done ? 'True' : 'False'}`)); const x = await text(task, 'md/Regular', done ? 'text/2' : 'text/1', 'Item'); if (done) x.textDecoration = 'STRIKETHROUGH'; r.appendChild(x); fill(x);
  }
  await para(body, 'For Thursday', 'lg/Bold', 'text/1', 'Heading');
  await para(body, 'Ask Enzo for the sales figures before Wednesday. The charts can reuse last quarter’s template, so the summary is the only part to write from nothing.', 'md/Regular', 'text/1', 'Paragraph');
  const quote = auto('HORIZONTAL', 'Quote', 'space/12'); pad(quote, 'space/8', 'space/16', 'space/8', 'space/16'); radius(quote, 'radius/md'); quote.fills = [await paint('surface/2')]; body.appendChild(quote); fill(quote);
  await para(quote, 'Mornings are for the one thing that matters; everything else can wait until after lunch.', 'md/Regular', 'text/2', 'Text');
}
// Calendar, a week (src/components/calendar/CalendarTopbar.tsx, CalendarGrid.tsx, features/calendar.css)
async function calendarPage(f) {
  const { page } = await win(f, 'Calendar', null, 'Calendar'); const main = column(page, 'space/16');
  const steps = auto('HORIZONTAL', 'Steps', 'space/2');
  for (const [n, ic] of [['Previous', 'ChevronLeft'], ['Next', 'ChevronRight']]) { const b = use('IconButton', 'Size=md, State=Default', { Icon: ic }); b.name = n; steps.appendChild(b); }
  pageHead(main, 'Calendar top bar', [use('Button', 'Style=Secondary, Size=md', { Label: 'Today' }), steps, await text('Nov 23 – Nov 29, 2026', 'xl/Bold', 'text/1', 'Dates')],
    [await segmented('Calendar view', ['Week', 'Day', 'Month'], 0), use('Button', 'Style=Primary, Size=md', { Label: 'Schedule session', 'Show icon': true, Icon: 'Plus' })]);
  // The week: 07:00 to 22:00, a 60px column of hours, then the seven days
  const DAYS = [['Mon', 23], ['Tue', 24], ['Wed', 25], ['Thu', 26], ['Fri', 27], ['Sat', 28], ['Sun', 29]], TODAY = 3, FIRST = 7, HOURS = 16, TW = 60, CW = 174, HH = 44;
  const card = auto('VERTICAL', 'Week'); radius(card, 'radius/3xl'); card.fills = [await paint('surface/1')]; card.clipsContent = true; main.appendChild(card); fillBoth(card);
  const days = auto('HORIZONTAL', 'Days'); pad(days, 'space/16', 'space/16', 'space/8', null); card.appendChild(days); fill(days);
  const corner = auto('HORIZONTAL', 'Hours'); fixed(corner, TW, 10); days.appendChild(corner);
  for (const [k, [d, n]] of DAYS.entries()) {
    const on = k === TODAY, cell = auto('VERTICAL', d, 'space/2'); cell.counterAxisAlignItems = 'CENTER'; cell.resize(CW, 60); cell.primaryAxisSizingMode = 'AUTO'; cell.counterAxisSizingMode = 'FIXED'; days.appendChild(cell);
    cell.appendChild(await overline(d, on ? 'accent/text' : 'text/2'));
    const num = auto('HORIZONTAL', 'Date'); fixed(num, 40, 40); num.primaryAxisAlignItems = 'CENTER'; num.counterAxisAlignItems = 'CENTER'; radius(num, 'radius/pill'); if (on) num.fills = [await paint('accent/accent')];
    num.appendChild(await text(String(n), 'xl/SemiBold', on ? 'accent/on-accent' : 'text/1', 'Number')); cell.appendChild(num);
  }
  const grid = figma.createFrame(); grid.name = 'Grid'; grid.resize(TW + 7 * CW, HOURS * HH); grid.fills = []; grid.clipsContent = false; card.appendChild(grid);
  const today = figma.createRectangle(); today.name = 'Today'; today.resize(CW, HOURS * HH); today.fills = [await paint('surface/2')]; grid.appendChild(today); today.x = TW + TODAY * CW; today.y = 0;
  for (let h = 0; h < HOURS; h++) {
    const line = await rule(7 * CW, 'structure/grid-line'); line.name = 'Hour line'; grid.appendChild(line); line.x = TW; line.y = h * HH;
    const t = await text(`${String(FIRST + h).padStart(2, '0')}:00`, 'xs/SemiBold', 'text/2', 'Hour'); grid.appendChild(t);
    t.textAutoResize = 'HEIGHT'; t.resize(TW - 8, t.height); t.textAlignHorizontal = 'RIGHT'; t.x = 0; t.y = h ? h * HH - 8 : 0;
  }
  for (let d = 0; d < 7; d++) { const line = await rule(1, 'structure/grid-line'); line.name = 'Day line'; line.resize(1, HOURS * HH); grid.appendChild(line); line.x = TW + d * CW; line.y = 0; }
  // Scheduled sessions: the day, the hour it starts, its minutes, its title, the session it is linked to
  for (const [d, at, mins, title, session] of [[0, 9, 50, 'Morning focus', 'Morning focus'], [1, 10.5, 90, 'Deep work', 'Deep work'], [2, 14, 30, 'Admin', null], [3, 9, 50, 'Morning focus', 'Morning focus'],
    [3, 15, 120, 'Quarterly report', 'Deep work'], [4, 11, 60, 'Reading', 'Reading'], [5, 10, 60, 'Weekly review', null]]) {
    const high = Math.max(28, Math.round(mins / 60 * HH)), two = high >= 40, clock = `${String(Math.floor(at)).padStart(2, '0')}:${at % 1 ? '30' : '00'}`;
    const e = auto(two ? 'VERTICAL' : 'HORIZONTAL', title, two ? null : 'space/8'); fixed(e, CW - 8, high); if (!two) e.counterAxisAlignItems = 'CENTER'; e.clipsContent = true;
    pad(e, 'space/4', 'space/8', 'space/4', 'space/8'); radius(e, 'radius/md'); e.fills = [await paint('accent/container')]; e.strokes = [await paint('surface/1')]; e.strokeWeight = 2; e.strokeAlign = 'OUTSIDE';
    e.appendChild(await text(title, 'sm/SemiBold', 'accent/on-container', 'Title'));
    e.appendChild(await text(two ? `${clock} · ${mins}′${session ? ` · ${session}` : ''}` : clock, 'xs/Medium', 'accent/on-container', 'Time'));
    grid.appendChild(e); e.x = TW + d * CW + 4; e.y = Math.round((at - FIRST) * HH);
  }
  const now = figma.createRectangle(); now.name = 'Now'; now.resize(CW, 2); now.fills = [await paint('status/live')]; grid.appendChild(now); now.x = TW + TODAY * CW; now.y = Math.round(3.7 * HH);
  const dot = figma.createEllipse(); dot.name = 'Now dot'; dot.resize(10, 10); dot.fills = [await paint('status/live')]; grid.appendChild(dot); dot.x = now.x - 5; dot.y = now.y - 4;
}
// Stats (src/App.tsx, ui/StatCard.tsx, stats/ProductivityChart.tsx, stats/CompletionLogs.tsx, features/stats.css)
async function statsPage(f) {
  const { page } = await win(f, 'Analytics & stats', null, 'Stats'); const main = column(page);
  const stats = auto('HORIZONTAL', 'Overview', 'space/16'); main.appendChild(stats); fill(stats);
  for (const [value, label] of [['3.4', 'Avg sessions / day'], ['94m', 'Avg worked time / day'], ['5.2', 'Avg tasks completed / day'], ['18m 30s', 'Avg time per task']]) put(stats, esp('StatCard', null, { Value: value, Label: label }), 'fill');
  const row = auto('HORIZONTAL', 'Panels', 'space/20'); row.counterAxisAlignItems = 'MIN'; main.appendChild(row); fill(row);
  // The two panels share the row 1.2 to 1
  const chart = await panelCard('Productive days', 'Most productive days of the week'); row.appendChild(chart.card); setWidth(chart.card, 698);
  const bars = auto('HORIZONTAL', 'Days', 'space/12'); fixed(bars, 650, 260); pad(bars, 'space/8', null, null, null); chart.body.appendChild(bars); fill(bars);
  for (const [day, mins] of [['Mon', 135], ['Tue', 180], ['Wed', 95], ['Thu', 150], ['Fri', 120], ['Sat', 40], ['Sun', 25]]) {
    const c = auto('VERTICAL', day, 'space/8'); c.counterAxisAlignItems = 'CENTER'; bars.appendChild(c); fillBoth(c);
    c.appendChild(await text(`${mins}m`, 'sm/Regular', 'text/2', 'Minutes'));
    const track = auto('VERTICAL', 'Track'); fixed(track, 46, 100); track.primaryAxisAlignItems = 'MAX'; radius(track, 'radius/md'); track.fills = [await paint('surface/2')]; track.clipsContent = true; c.appendChild(track); track.layoutSizingVertical = 'FILL';
    const bar_ = figma.createRectangle(); bar_.name = 'Bar'; bar_.resize(46, Math.max(1, Math.round(200 * mins / 180))); radius(bar_, 'radius/md'); bar_.fills = [await paint(mins === 180 ? 'accent/accent' : 'accent/container')]; track.appendChild(bar_);
    c.appendChild(await text(day, 'sm/SemiBold', 'text/2', 'Day'));
  }
  const logs = await panelCard('Completion log', 'Task completion log'); row.appendChild(logs.card); fill(logs.card);
  for (const [task, list, took, at] of [['Outline the sections', 'Quarterly report', '25m', '10:42'], ['Gather last quarter’s numbers', 'Quarterly report', '38m 20s', '10:15'], ['Reply to the landlord', 'Inbox', '6m', '09:31'],
    ['Book the train', 'Trip checklist', '4m 10s', '09:24'], ['Read chapter 3', 'Reading list', '31m', 'Nov 25'], ['Sort the receipts', 'Inbox', '12m', 'Nov 25']]) {
    const r = auto('HORIZONTAL', task, 'space/12'); r.counterAxisAlignItems = 'CENTER'; pad(r, 'space/8', 'space/12', 'space/8', 'space/12'); radius(r, 'radius/md'); r.fills = [await paint('surface/2')]; logs.body.appendChild(r); fill(r);
    const left = auto('HORIZONTAL', 'Task', 'space/8'); left.counterAxisAlignItems = 'CENTER'; r.appendChild(left); fill(left);
    left.appendChild(await iconInst('Check', 'text/1', 16)); left.appendChild(await text(task, 'md/Regular', 'text/1', 'Text')); left.appendChild(await text(`[${list}]`, 'sm/Regular', 'text/2', 'List'));
    const right = auto('VERTICAL', 'Time'); right.counterAxisAlignItems = 'MAX'; r.appendChild(right);
    right.appendChild(await text(took, 'sm/SemiBold', 'text/2', 'Took')); right.appendChild(await text(at, 'xs/Medium', 'text/2', 'When'));
  }
}
// Goals (src/components/goals/GoalsGrid.tsx, GoalCard.tsx, ui/FilterGridLayout.tsx)
function landmark(card, k, task, done) {
  const r = card.findOne(n => n.type === 'INSTANCE' && n.name === `Landmark ${k}`); if (!r) return;
  prop(r, 'Task', task); soft(() => prop(r, 'Done', done ? 'True' : 'False'));
  const time = r.findOne(n => n.type === 'FRAME' && n.name === 'Time'); if (time) time.visible = false;
}
async function goalsPage(f) {
  const { page } = await win(f, 'Goals & landmarks', null, 'Goals'); const main = column(page);
  await filterBar(main, 'New goal');
  const cards = [], bars = [];
  for (const [freq, title, count, schedule, desc, marks, tone] of [
    ['Monthly', 'Read 10 books', '1 of 3', 'Due Dec 31 · 35 days left', 'One a month, and two over the holidays.', [['Pick the next three books', true], ['Finish chapter 3', false], ['Write a short review', false]]],
    ['Weekly', 'Ship the quarterly report', '2 of 3', 'Nov 23 → Nov 27 · 1 day left', null, [['Gather the numbers', true], ['Write the summary', true], ['Send it for review', false]]],
    ['Daily', 'Walk for half an hour', '2 of 2', 'Due Nov 26', null, [['Morning loop', true], ['After lunch', true]], 'done'],
    ['Yearly', 'Learn to sail', '0 of 3', 'Starts Jan 10 · starts in 45 days', 'A week on the lake in spring, if the course has room.', [['Find a course', false], ['Book the week', false], ['Pass the first exam', false]]],
    ['Custom', 'Renew the passport', '1 of 2', 'Due Nov 24 · 2 days past due', null, [['Get new photos', true], ['Send the form', false]], 'warn']]) {
    const c = esp('GoalCard', `Done=${tone === 'done' ? 'True' : 'False'}`, { Frequency: freq.toUpperCase(), Title: title, Count: count, Schedule: schedule, 'Show description': !!desc, 'Show landmark 3': marks.length > 2 });
    if (desc) prop(c, 'Description', desc);
    marks.forEach(([task, done], k) => landmark(c, k + 1, task, done));
    bars.push([c, tone === 'done' ? null : marks.filter(m => m[1]).length / marks.length]);
    if (tone === 'warn') { const b = c.findOne(n => n.type === 'FRAME' && n.name === 'Schedule'); if (b) { b.fills = [await paint('status/warning-container')]; await recolor(b, 'status/warning'); for (const t of b.findAll(n => n.type === 'TEXT')) t.fills = [await paint('status/warning')]; } }
    cards.push(c);
  }
  gridOf(main, 'Goals', cards, 3);
  // How far each goal is: none shows no bar at all; the rest is a resize inside the instance, so it is tried softly
  for (const [c, done] of bars) {
    const part = c.findOne(n => n.type === 'RECTANGLE' && n.name === 'Part done'); if (!part || done === null) continue;
    if (!done) part.visible = false; else soft(() => part.resize(Math.max(1, Math.round(part.parent.width * done)), part.height));
  }
}
// Rewards (src/components/rewards/RewardsGrid.tsx, RewardsStats.tsx, RewardCard.tsx, features/rewards.css)
async function rewardsPage(f) {
  const { page } = await win(f, 'Rewards', null, 'Rewards'); const main = column(page);
  const stats = auto('HORIZONTAL', 'Counts', 'space/20'); main.appendChild(stats); fill(stats);
  for (const [value, label] of [['1', 'Ready to claim'], ['3', 'In progress'], ['2', 'Claimed']]) put(stats, esp('StatCard', null, { Value: value, Label: label }), 'fill');
  await filterBar(main, 'New reward');
  const cards = [];
  for (const [state, freq, name, trigger, desc, ic] of [['Ready', 'Weekly', 'Coffee with a friend', 'Session', 'After Friday’s deep work.', 'Heart'], ['In progress', 'Monthly', 'New headphones', 'Goal', 'When the quarterly report ships.', 'Music'],
    ['In progress', 'Weekly', 'Film night', 'Landmark', 'Once the summary is written.', 'Star'], ['In progress', 'Daily', 'A slow morning', 'Manual', 'No alarm, and a long breakfast.', 'Clock'],
    ['Claimed', 'Weekly', 'A long lunch', 'Session', 'Somewhere with a terrace.', 'Gift'], ['Claimed', 'Monthly', 'A new notebook', 'Goal', 'The dotted one.', 'Book']]) {
    cards.push(esp('RewardCard', `State=${state}`, { Frequency: freq.toUpperCase(), Name: name, Trigger: trigger, Description: desc, Icon: ic }));
  }
  gridOf(main, 'Rewards', cards, 3);
}

// ── What opens over a page ───────────────────────────────
// The bell's form, also the first section of Settings (modals/NotificationModal.tsx, features/notifications.css)
async function notificationForm(parent, cancel) {
  const form = auto('VERTICAL', 'Notifications form', 'space/8'); parent.appendChild(form); fill(form);
  put(form, esp('SwitchRow', 'On=True', { Label: 'Alert me when a phase ends', Hint: 'A small popup with a button to start what’s next.' }), 'fill');
  put(form, esp('SwitchRow', 'On=True', { Label: 'Remind me before scheduled sessions', 'Show hint': false }), 'fill');
  const row = auto('HORIZONTAL', 'Times', 'space/16'); pad(row, 'space/8', null, 'space/8', null); form.appendChild(row); fill(row);
  await field(row, 'Remind me', await input('10 minutes before', true, true)); await field(row, 'Hide alerts after', await input('10 seconds', true, true));
  put(form, esp('SwitchRow', 'On=False', { Label: 'Play a chime', 'Show hint': false }), 'fill');
  formActions(form, 'Save', cancel);
}
// A profile in Settings (auth/SettingsView.tsx, features/profile.css)
async function profileRow(parent, name, user, since, badges, actions) {
  const r = auto('HORIZONTAL', name, 'space/12'); r.counterAxisAlignItems = 'CENTER'; pad(r, 'space/8', 'space/12', 'space/8', 'space/12'); radius(r, 'radius/md'); r.fills = [await paint('surface/2')]; parent.appendChild(r); fill(r);
  const av = auto('HORIZONTAL', 'Avatar'); fixed(av, 38, 38); av.primaryAxisAlignItems = 'CENTER'; av.counterAxisAlignItems = 'CENTER'; radius(av, 'radius/pill'); av.fills = [await paint('surface/3')];
  av.appendChild(await text(name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(), 'sm/SemiBold', 'text/1', 'Initials')); r.appendChild(av);
  const info = auto('VERTICAL', 'Info'); r.appendChild(info); fill(info);
  const top = auto('HORIZONTAL', 'Name', 'space/8'); top.counterAxisAlignItems = 'CENTER'; info.appendChild(top); top.appendChild(await text(name, 'md/SemiBold', 'text/1', 'Name'));
  for (const [label, on] of badges) top.appendChild(await badge(label, on ? 'status/success-container' : 'surface/3', on ? 'status/success' : 'text/2', null, 'xs/SemiBold', 20));
  info.appendChild(await text(`@${user} · ${since}`, 'sm/Regular', 'text/2', 'Meta'));
  for (const [label, style] of actions) { const b = use('Button', `Style=${style}, Size=sm`, { Label: label }); if (style === 'Secondary') b.fills = [await paint('surface/3')]; r.appendChild(b); }   // on a raised row, the quiet button steps up with it
}
// Settings (auth/SettingsView.tsx, updates/UpdateSettings.tsx). It is longer than the window, so it scrolls: "end" shows where it stops
async function settingsModal(f, end) {
  const body = await modalOver(f, 'Settings', MODAL_WIDE); bindNum(body, 'itemSpacing', 'space/40');
  await notificationForm(await settingsSection(body, 'Notifications'));
  const up = await settingsSection(body, 'Updates');
  put(up, esp('SwitchRow', 'On=True', { Label: 'Tell me when an update is ready', Hint: 'Pastel Espresso checks each time it opens.' }), 'fill');
  up.appendChild(use('Button', 'Style=Secondary, Size=md', { Label: 'Check for updates' }));
  const people = await settingsSection(body, 'Profiles', '2 of 6 profiles');
  const list = auto('VERTICAL', 'Profiles list', 'space/8'); people.appendChild(list); fill(list);
  await profileRow(list, 'San Milano', 'san', 'Mar 3, 2026', [['Main'], ['Active', true]], []);
  await profileRow(list, 'Enzo', 'enzo', 'Sep 14, 2026', [], [['Rename', 'Secondary'], ['Delete', 'Danger']]);
  people.appendChild(use('Button', 'Style=Secondary, Size=md', { Label: 'Add profile', 'Show icon': true, Icon: 'Plus' }));
  const danger = await settingsSection(body, 'Permanent actions', 'Removes every user profile and its data. The main account stays.', true);
  danger.appendChild(use('Button', 'Style=Danger, Size=md', { Label: 'Reset user profiles' }));
  capModal(body, end);
}
// A quiet text link, with its icon (features/help.css, .about-github)
async function link(parent, label, ic, color) {
  const b = auto('HORIZONTAL', label, 'space/4'); b.counterAxisAlignItems = 'CENTER'; if (ic) b.appendChild(await iconInst(ic, color || 'text/2', 15));
  b.appendChild(await text(label, 'sm/SemiBold', color || 'text/2', 'Label')); parent.appendChild(b); return b;
}
async function helpModal(f, view) {
  const body = await modalOver(f, view === 'about' ? 'About' : view === 'new' ? 'What’s new' : 'Help');
  if (!view) {
    bindNum(body, 'itemSpacing', 'space/8');
    for (const [title, desc, ic, out] of [['Take the tour', 'A one-minute walk through the app.', 'Timer'], ['Keyboard shortcuts', 'Move faster without the mouse.', 'Keyboard'], ['What’s new', 'Changes in version 1.3.0.', 'Sparkle'],
      ['About', 'Version, privacy and credits.', 'Info'], ['Documentation', 'How everything works, on GitHub.', 'Book', true], ['Report a problem', 'Opens GitHub Issues in your browser.', 'Bug', true], ['Star on GitHub', 'If Pastel Espresso helps you, a star helps us.', 'Star', true]]) {
      const r = use('ListRow', 'State=Default', { Title: title, Description: desc, Icon: ic }); body.appendChild(r); fill(r);
      // The ones that leave the app end with the "opens outside" mark, not the chevron
      if (out) { const trail = r.findOne(n => n.type === 'INSTANCE' && n.name === 'Trail'); if (trail) { soft(() => trail.swapComponent(icon('External'))); await recolor(trail, 'text/3'); } }
    }
    return body;
  }
  const back = auto('HORIZONTAL', 'Back', 'space/4'); back.counterAxisAlignItems = 'CENTER'; back.appendChild(await iconInst('ChevronLeft', 'text/2', 16)); back.appendChild(await text('Back', 'md/SemiBold', 'text/2', 'Label')); body.appendChild(back);
  if (view === 'new') {
    body.appendChild(await text('Version 1.3.0', 'sm/SemiBold', 'text/2', 'Version'));
    const list = auto('VERTICAL', 'Changes', 'space/8'); body.appendChild(list); fill(list);
    for (const item of ['A new look and new ways to organize your task lists. Still an alpha, so things may change before the final version, and your feedback shapes them (Help → Report a problem).',
      'The menu on the left now floats in its own panel, tinted with your accent color. Open or close it from the logo at its top.',
      'The timer page labels the session and each of its task lists, with what’s left right next to their names.',
      'Add a task list from a new picker: search loosely, sort, find your recently opened lists on top, or type a new name to create one. It also opens from the session’s ⋮ menu.',
      'Reorder a session’s task lists by dragging them by their header.',
      'Every task row has its own ⋮ menu, in the mini player too, and drag handles are always in sight.',
      'Goals have a clearer card, with a Complete button that turns into Done.',
      'Switches, check boxes, dropdowns and menus share one look, with rounder shapes that are easier to scan.',
      'Goals and Rewards make better use of wide windows.']) {
      const r = auto('HORIZONTAL', 'Change', 'space/12'); pad(r, 'space/8', 'space/12', 'space/8', 'space/12'); radius(r, 'radius/md'); r.fills = [await paint('surface/2')]; list.appendChild(r); fill(r);
      const dw = auto('VERTICAL', 'Dot'); pad(dw, 'space/6', null, null, null); const d = figma.createEllipse(); d.name = 'Dot'; d.resize(8, 8); d.fills = [await paint('text/3')]; dw.appendChild(d); r.appendChild(dw);
      await para(r, item, 'md/Regular', 'text/1', 'Text');
    }
    return body;
  }
  const head = auto('HORIZONTAL', 'App', 'space/16'); head.counterAxisAlignItems = 'CENTER'; body.appendChild(head); fill(head);
  const logo = auto('HORIZONTAL', 'Logo'); fixed(logo, 52, 52); logo.primaryAxisAlignItems = 'CENTER'; logo.counterAxisAlignItems = 'CENTER'; radius(logo, 'radius/xl'); logo.fills = [await paint('accent/accent')];
  logo.appendChild(await iconInst('Timer', 'accent/on-accent', 28)); head.appendChild(logo);
  const names = auto('VERTICAL', 'Names'); head.appendChild(names); names.appendChild(await text('Pastel Espresso', 'lg/Bold', 'text/1', 'Name')); names.appendChild(await text('Formerly Focus Space', 'sm/Regular', 'text/2', 'Formerly'));
  const ver = auto('HORIZONTAL', 'Version', 'space/8'); ver.counterAxisAlignItems = 'CENTER'; names.appendChild(ver);
  ver.appendChild(await text('Version 1.3.0', 'sm/Regular', 'text/2', 'Version')); ver.appendChild(await badge('Alpha', 'status/warning-container', 'status/warning', null, 'xs/SemiBold', 20));
  const stage = auto('VERTICAL', 'Test version', 'space/8'); pad(stage, 'space/16', 'space/16', 'space/16', 'space/16'); radius(stage, 'radius/xl'); stage.fills = [await paint('status/warning-container')]; body.appendChild(stage); fill(stage);
  await para(stage, 'This is an alpha: still in development, so features and data may change before the final version. Your feedback helps.', 'sm/Regular', 'text/1', 'Note');
  await link(stage, 'Report a problem', 'Bug');
  await para(body, 'A calm, minimal focus timer with sessions, task lists, goals, landmarks, and rewards.', 'md/Regular', 'text/2', 'Description');
  const priv = auto('HORIZONTAL', 'Privacy', 'space/12'); pad(priv, 'space/16', 'space/16', 'space/16', 'space/16'); radius(priv, 'radius/xl'); priv.fills = [await paint('accent/container')]; body.appendChild(priv); fill(priv);
  priv.appendChild(await iconInst('Lock', 'accent/on-container', 18)); const pt = auto('VERTICAL', 'Text', 'space/2'); priv.appendChild(pt); fill(pt);
  await para(pt, 'Your data stays here', 'sm/SemiBold', 'accent/on-container', 'Title');
  await para(pt, 'Everything is stored on this device and encrypted with your password, and it never leaves it. The desktop app only goes online to see whether an update is out.', 'sm/Regular', 'accent/on-container', 'Body');
  const lic = auto('VERTICAL', 'License', 'space/8'); body.appendChild(lic); fill(lic);
  await para(lic, 'Free to use and change, including for your work. Selling it, or a version built from it, isn’t allowed.', 'sm/Regular', 'text/2', 'Note'); await link(lic, 'Third-party licenses');
  const made = auto('HORIZONTAL', 'Credits', 'space/8'); made.counterAxisAlignItems = 'CENTER'; body.appendChild(made);
  made.appendChild(await text('Made by San Milano.', 'sm/Regular', 'text/2', 'Credits')); await link(made, 'GitHub', 'Github');
  return body;
}
// Before the app opens (src/components/auth/LoginScreen.tsx, features/auth.css): the centre card on the bare window
async function authScreen(name, title, subtitle, fields, action, other) {
  const f = await screen(name, SW, SH);
  const bar_ = auto('HORIZONTAL', 'Title bar'); fixed(bar_, SW, 68); bar_.primaryAxisAlignItems = 'MAX'; bar_.counterAxisAlignItems = 'CENTER'; pad(bar_, null, 'space/8', null, null);
  bar_.appendChild(find('WindowControls').createInstance()); f.appendChild(bar_); bar_.x = 0; bar_.y = 0;
  const c = auto('VERTICAL', `${name} card`, 'space/8'); setWidth(c, 420);
  pad(c, 'space/40', 'space/40', 'space/32', 'space/40'); radius(c, 'radius/3xl'); c.fills = [await paint('surface/1')];
  const logoWrap = auto('VERTICAL', 'Logo'); pad(logoWrap, null, null, 'space/16', null); c.appendChild(logoWrap);
  const logo = auto('HORIZONTAL', 'Tile'); fixed(logo, 56, 56); logo.primaryAxisAlignItems = 'CENTER'; logo.counterAxisAlignItems = 'CENTER'; radius(logo, 'radius/xl'); logo.fills = [await paint('accent/accent')];
  logo.appendChild(await iconInst('Timer', 'accent/on-accent', 30)); logoWrap.appendChild(logo);
  await para(c, title, '2xl/Bold', 'text/1', 'Title');
  await para(c, subtitle, 'md/Regular', 'text/2', 'Subtitle');
  const form = auto('VERTICAL', 'Form', 'space/16'); pad(form, 'space/16', null, null, null); c.appendChild(form); fill(form);
  for (const [label, value] of fields) await field(form, label, await input(value));
  const go = use('Button', 'Style=Primary, Size=lg', { Label: action }); form.appendChild(go); fill(go);
  const sw = auto('HORIZONTAL', 'Switch'); sw.primaryAxisAlignItems = 'CENTER'; pad(sw, 'space/8', null, null, null); c.appendChild(sw); fill(sw);
  sw.appendChild(use('TextButton', 'Tone=Accent, State=Default', { Label: other }));
  f.appendChild(c); c.x = (SW - c.width) / 2; c.y = (SH - c.height) / 2;
  await useAppAccent(f);
}

// ── The small windows ────────────────────────────────────
// The mini player (src/mini/MiniPlayer.tsx, src/styles/features/mini.css): one markup, three layouts by the window's size
async function miniControls(gap) {
  const c = auto('HORIZONTAL', 'Controls', gap || 'space/8'); c.counterAxisAlignItems = 'CENTER';
  for (const [kind, ic, name] of [['Default', 'Reset', 'Reset timer'], ['Primary', 'Pause', 'Pause'], ['Default', 'Skip', 'Skip phase']]) { const b = use('PlayerControl', `Kind=${kind}, Size=sm`, { Icon: ic }); b.name = name; c.appendChild(b); }
  return c;
}
async function miniWindowButtons() {
  const c = auto('HORIZONTAL', 'Window', 'space/1');
  for (const [ic, name, on] of [['Pin', 'Pin position'], ['Layers', 'Always on top: on', true], ['Expand', 'Open Pastel Espresso'], ['Close', 'Close (timer keeps running)']]) {
    const b = auto('HORIZONTAL', name); fixed(b, 26, 26); b.primaryAxisAlignItems = 'CENTER'; b.counterAxisAlignItems = 'CENTER'; radius(b, 'radius/sm'); if (on) b.fills = [await paint('accent/container')];
    b.appendChild(await iconInst(ic, on ? 'accent/on-container' : 'text/3', 14)); c.appendChild(b);
  }
  return c;
}
async function miniTitles(parent, big, centred) {
  const c = auto('VERTICAL', 'Titles'); if (centred) c.counterAxisAlignItems = 'CENTER'; parent.appendChild(c); fill(c);
  const t = await text('Morning focus', big ? 'lg/SemiBold' : 'md/SemiBold', 'text/1', 'Session'); c.appendChild(t); const s = await text('Write the summary', 'sm/Regular', 'text/2', 'Task'); c.appendChild(s);
  if (!centred) { fill(t); t.textTruncation = 'ENDING'; fill(s); s.textTruncation = 'ENDING'; }
  return c;
}
// The row under the timeline: elapsed, the controls, the total
async function miniBottom(parent) {
  const r = auto('HORIZONTAL', 'Bottom', 'space/8'); r.primaryAxisAlignItems = 'SPACE_BETWEEN'; r.counterAxisAlignItems = 'CENTER'; parent.appendChild(r); fill(r);
  r.appendChild(await text('10:28', 'xs/Medium', 'text/2', 'Elapsed')); r.appendChild(await miniControls()); r.appendChild(await text('25:00', 'xs/Medium', 'text/2', 'Total'));
}
async function miniPlayer(name, w, h) {
  const f = await screen(name, w, h); f.fills = [await paint('surface/1')];
  const large = w >= 560 && h >= 260, portrait = !large && h > w && h >= 300;
  f.layoutMode = portrait ? 'VERTICAL' : 'HORIZONTAL'; f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED';
  if (portrait) {
    // A column, like a phone's music player: the window's buttons, the ring, the titles, the controls
    pad(f, 'space/12', 'space/16', 'space/16', 'space/16'); bindNum(f, 'itemSpacing', 'space/16'); f.counterAxisAlignItems = 'CENTER';
    const top = auto('HORIZONTAL', 'Top'); top.primaryAxisAlignItems = 'MAX'; f.appendChild(top); fill(top); top.appendChild(await miniWindowButtons());
    const hold = auto('VERTICAL', 'Timer'); hold.primaryAxisAlignItems = 'CENTER'; hold.counterAxisAlignItems = 'CENTER'; f.appendChild(hold); fillBoth(hold);
    const size = Math.min(w - 32, h - 190), art = auto('VERTICAL', 'Dial', 'space/4'); fixed(art, size, size); art.primaryAxisAlignItems = 'CENTER'; art.counterAxisAlignItems = 'CENTER'; radius(art, 'radius/pill'); art.fills = [await paint('surface/2')]; hold.appendChild(art);
    const inset = Math.round(size * 0.06), across = size - 2 * inset;
    float(art, await ring(across, 5, 'surface/3'), inset, inset); float(art, await ring(across, 5, 'accent/accent', 0.42), inset, inset);
    art.appendChild(await text('14:32', '4xl/Bold', 'accent/text', 'Countdown')); art.appendChild(await text('10:28 / 25:00', 'sm/Regular', 'text/2', 'Elapsed of total'));
    await miniTitles(f, true, true);
    f.appendChild(await miniControls('space/16'));
    return f;
  }
  pad(f, large ? 'space/16' : 'space/12', large ? 'space/16' : 'space/12', large ? 'space/16' : 'space/12', large ? 'space/16' : 'space/12'); bindNum(f, 'itemSpacing', large ? 'space/16' : 'space/12');
  // The timer tile takes the phase's colour while it runs
  const art = auto('VERTICAL', 'Timer'); fixed(art, large ? 205 : 120, 100); art.primaryAxisAlignItems = 'CENTER'; art.counterAxisAlignItems = 'CENTER'; radius(art, 'radius/xl'); art.fills = [await paint('accent/accent')]; f.appendChild(art); art.layoutSizingVertical = 'FILL';
  const count = await text('14:32', '3xl/Bold', 'accent/on-accent', 'Countdown'); art.appendChild(count);
  if (large) { count.fontSize = 60; count.letterSpacing = { unit: 'PERCENT', value: -4.5 }; count.lineHeight = { unit: 'PERCENT', value: 100 }; }
  const main = auto('VERTICAL', 'Main', large ? 'space/12' : 'space/8'); if (!large) main.primaryAxisAlignItems = 'SPACE_BETWEEN'; f.appendChild(main); fillBoth(main);
  const top = auto('HORIZONTAL', 'Top', 'space/8'); top.counterAxisAlignItems = 'MIN'; main.appendChild(top); fill(top);
  await miniTitles(top, large); top.appendChild(await miniWindowButtons());
  if (large) {
    // Large: the room above the timeline becomes tiles (short as this window is, one row: the session's tasks need 340 of height)
    const tiles = auto('HORIZONTAL', 'Tiles', 'space/8'); main.appendChild(tiles); fillBoth(tiles);
    const made = [];
    for (const [label, value, meta, done] of [['Progress', '42%', null, 0.42], ['Up next', '5:00', 'Break']]) {
      const on = done !== undefined, t = auto('VERTICAL', label, 'space/4'); t.primaryAxisAlignItems = 'SPACE_BETWEEN'; pad(t, 'space/12', 'space/16', 'space/12', 'space/16'); radius(t, 'radius/xl');
      t.fills = [await paint(on ? 'accent/container' : 'surface/2')]; tiles.appendChild(t); fillBoth(t);
      t.appendChild(await overline(label, on ? 'accent/on-container' : 'text/2')); t.appendChild(await text(value, '2xl/Bold', on ? 'accent/on-container' : 'text/1', 'Value'));
      if (on) made.push([t, done]); else t.appendChild(await text(meta, 'sm/Regular', 'text/2', 'Meta'));
    }
    for (const [t, done] of made) await bar(t, done, 'surface/1');   // once both tiles are in the row, so the bar knows its width
  }
  await bar(main, 0.42);
  await miniBottom(main);
  return f;
}

async function buildScreens() {
  // Espresso's own colours: its accent, and its drawer tinted with the accent's hue
  await setUpAccent('espresso');
  for (const [name, hex] of Object.entries(APP_COLOURS)) await appColour(`espresso/${name}`, hex);
  appVars.set(v('drawer/bg').id, v('espresso/drawer-bg'));
  appVars.set(v('drawer/hover').id, v('espresso/drawer-hover'));

  await buildComponents();

  if (!exists('Timer & sessions')) { const f = await screen('Timer & sessions', SW, SH); await timerPage(f); await useAppAccent(f); }
  if (!exists('Timer & sessions · running')) {
    const f = await screen('Timer & sessions · running', SW, SH); const page = await timerPage(f);
    const player = page.children[0]; player.swapComponent(ESP.PlayerCard.children.find(x => x.name === 'Running=True'));
    await useAppAccent(f);
  }
  if (!exists('Tasks')) {
    const f = await screen('Tasks', SW, SH); const { page } = await win(f, 'Tasks', null, 'Tasks');
    page.counterAxisAlignItems = 'MIN';
    const side = await bandCard('Task lists', 'Task lists', 'Quarterly report'); side.body.itemSpacing = 8; page.appendChild(side.card); side.card.resize(300, side.card.height); side.card.counterAxisSizingMode = 'FIXED'; side.card.primaryAxisSizingMode = 'AUTO';
    for (const [n, l, sel] of [['Quarterly report', '2 of 5', true], ['Inbox', '0 of 3', false], ['Groceries', '1 of 6', false], ['Reading list', '4 of 9', false]]) {
      const q = ESP.QueueItem.children.find(x => x.name === `Selected=${sel ? 'True' : 'False'}`).createInstance(); side.body.appendChild(q); fill(q); prop(q, 'Name', n); prop(q, 'Lengths', l);
    }
    const foot = auto('VERTICAL', 'Foot'); pad(foot, 'space/16', null, null, null); side.body.appendChild(foot);
    foot.appendChild(use('Button', 'Style=Secondary, Size=md', { Label: 'New task list', 'Show icon': true, Icon: 'Plus' }));
    const count = await text('2 of 5', 'sm/SemiBold', 'text/2', 'Count');
    const main = await bandCard('Task list', 'Task list', 'Quarterly report', [count]); page.appendChild(main.card); fill(main.card);
    const chips = auto('HORIZONTAL', 'Used by', 'space/6'); main.band.appendChild(chips);
    chips.appendChild(use('Chip', 'Tone=Default', { Label: 'Morning focus' })); chips.appendChild(use('Chip', 'Tone=Default', { Label: 'Deep work' }));
    const pb = use('ProgressBar', 'Tone=Default, Size=md'); main.body.appendChild(pb); fill(pb);
    const rows = auto('VERTICAL', 'Tasks', 'space/4'); main.body.appendChild(rows); fill(rows);
    for (const [t, d] of [['Gather last quarter’s numbers', true], ['Outline the sections', true], ['Write the summary', false], ['Make the charts', false], ['Send it for review', false]]) {
      const r = ESP.TaskItem.children.find(x => x.name === `Done=${d ? 'True' : 'False'}`).createInstance(); rows.appendChild(r); fill(r); prop(r, 'Task', t);
    }
    const add = ESP.AddTaskRow.createInstance(); rows.appendChild(add); fill(add);
    await useAppAccent(f);
  }
  if (!exists('Timer & sessions · account menu')) {
    const f = await screen('Timer & sessions · account menu', SW, SH); await timerPage(f);
    const menu = auto('VERTICAL', 'Account menu'); menu.resize(232, 100); menu.counterAxisSizingMode = 'FIXED'; menu.primaryAxisSizingMode = 'AUTO'; pad(menu, 'space/6', 'space/6', 'space/6', 'space/6');
    radius(menu, 'radius/lg'); menu.fills = [await paint('espresso/drawer-hover-2')];
    const elev = (await figma.getLocalEffectStylesAsync()).find(s => s.name === 'elevation/overlay'); if (elev) await menu.setEffectStyleIdAsync(elev.id);
    for (const [label, ic] of [['Profile', 'User'], ['Appearance', 'Palette'], ['Settings', 'Settings']]) { const it = use('MenuItem', 'Kind=Default', { Label: label, Icon: ic }); menu.appendChild(it); fill(it); }
    const dv = figma.createRectangle(); dv.name = 'Divider'; dv.resize(200, 1); dv.fills = [await paint('espresso/drawer-hover-3')]; const dw = auto('VERTICAL', 'Divider'); pad(dw, 'space/6', 'space/4', 'space/6', 'space/4'); dw.appendChild(dv); menu.appendChild(dw); fill(dw); fill(dv);
    const out = use('MenuItem', 'Kind=Default', { Label: 'Sign out', Icon: 'LogOut' }); menu.appendChild(out); fill(out);
    float(f, menu, 36, SH - menu.height - 96);
    await useAppAccent(f);
  }
  // Sign in (auth/LoginScreen.tsx, mode "login")
  if (!exists('Sign in')) await authScreen('Sign in', 'Welcome back', 'Sign in to pick up where you left off.', [['Username', 'san'], ['Password', '••••••••••']], 'Sign in', 'No account? Create the main account');

  // ── The other pages ──
  if (!exists('Notes')) { const f = await screen('Notes', SW, SH); await notesPage(f); await useAppAccent(f); }
  if (!exists('Notes · editor')) { const f = await screen('Notes · editor', SW, SH); await noteEditorPage(f); await useAppAccent(f); }
  if (!exists('Calendar · week')) { const f = await screen('Calendar · week', SW, SH); await calendarPage(f); await useAppAccent(f); }
  if (!exists('Stats')) { const f = await screen('Stats', SW, SH); await statsPage(f); await useAppAccent(f); }
  if (!exists('Goals & landmarks')) { const f = await screen('Goals & landmarks', SW, SH); await goalsPage(f); await useAppAccent(f); }
  if (!exists('Rewards')) { const f = await screen('Rewards', SW, SH); await rewardsPage(f); await useAppAccent(f); }

  // ── The account's dialogs, over the Timer page (src/components/auth/UserMenuModal.tsx) ──
  // Settings is longer than the window: its start, then scrolled to its end
  if (!exists('Settings')) { const f = await screen('Settings', SW, SH); await timerPage(f); await settingsModal(f); await useAppAccent(f); }
  if (!exists('Settings · scrolled')) { const f = await screen('Settings · scrolled', SW, SH); await timerPage(f); await settingsModal(f, true); await useAppAccent(f); }
  // Profile (auth/UserMenuModal.tsx ProfileView, ui/AvatarPicker.tsx, features/profile.css)
  if (!exists('Profile')) {
    const f = await screen('Profile', SW, SH); await timerPage(f);
    const body = await modalOver(f, 'Profile', MODAL_WIDE);
    const who = auto('HORIZONTAL', 'Identity', 'space/24'); who.counterAxisAlignItems = 'CENTER'; body.appendChild(who); fill(who);
    const photo = auto('HORIZONTAL', 'Photo'); fixed(photo, 136, 136); photo.primaryAxisAlignItems = 'CENTER'; photo.counterAxisAlignItems = 'CENTER'; radius(photo, 'radius/pill'); photo.fills = [await paint('accent/accent')];
    photo.appendChild(await text('SM', '4xl/Bold', 'accent/on-accent', 'Initials')); who.appendChild(photo);
    const edit = auto('HORIZONTAL', 'Change photo'); fixed(edit, 44, 44); edit.primaryAxisAlignItems = 'CENTER'; edit.counterAxisAlignItems = 'CENTER'; radius(edit, 'radius/pill'); edit.fills = [await paint('surface/3')]; await elevate(edit);
    edit.appendChild(await iconInst('Edit', 'text/1', 18)); float(photo, edit, 46, 46);
    const fields = auto('VERTICAL', 'Fields', 'space/16'); who.appendChild(fields); fill(fields);
    await field(fields, 'Name', await input('San Milano')); await field(fields, 'Username', await input('san'));
    const pw = auto('HORIZONTAL', 'Password', 'space/12'); pw.counterAxisAlignItems = 'CENTER'; pad(pw, 'space/16', 'space/16', 'space/16', 'space/16'); radius(pw, 'radius/xl'); pw.fills = [await paint('surface/2')]; body.appendChild(pw); fill(pw);
    const lock = auto('HORIZONTAL', 'Icon'); fixed(lock, 36, 36); lock.primaryAxisAlignItems = 'CENTER'; lock.counterAxisAlignItems = 'CENTER'; radius(lock, 'radius/pill'); lock.fills = [await paint('surface/3')]; lock.appendChild(await iconInst('Lock', 'text/2', 18)); pw.appendChild(lock);
    const pt = auto('VERTICAL', 'Text'); pw.appendChild(pt); fill(pt);
    pt.appendChild(await text('Password', 'md/SemiBold', 'text/1', 'Title')); pt.appendChild(await text('Use at least 8 characters.', 'sm/Regular', 'text/2', 'Hint'));
    pw.appendChild(use('Button', 'Style=Tonal, Size=sm', { Label: 'Change password' }));
    formActions(body, 'Save changes');
    await useAppAccent(f);
  }
  // Appearance (auth/AppearanceView.tsx): the library's panel, with Espresso's own accent picked
  if (!exists('Appearance')) {
    const f = await screen('Appearance', SW, SH); await timerPage(f);
    const body = await modalOver(f, 'Appearance', MODAL_WIDE);
    const panel = use('AppearancePanel'); body.appendChild(panel); fill(panel);
    // The panel comes with the library's accent picked: move the mark to solar lime, softly (a swap inside an instance)
    for (const sw of panel.findAll(n => n.type === 'INSTANCE' && n.name !== 'solar-lime' && !n.name.startsWith('Selected=') && n.componentProperties.Selected && n.componentProperties.Selected.value === 'True')) {
      const was = sw.findOne(n => n.name === 'Swatch'), own = was ? was.fills : null;   // its own colour, to keep through the swap
      soft(() => prop(sw, 'Selected', 'False')); if (own) for (const n of sw.findAll(n => n.name === 'Swatch')) n.fills = own;
    }
    const mine = panel.findOne(n => n.type === 'INSTANCE' && n.name === 'solar-lime');
    if (mine) {
      soft(() => prop(mine, 'Selected', 'True'));
      for (const n of mine.findAll(n => n.name === 'Swatch')) n.fills = [await paint('accent/accent')];
      for (const n of mine.findAll(n => n.name === 'Ring')) n.strokes = [await paint('accent/accent')];
      for (const n of mine.findAll(n => n.name === 'Check')) await recolor(n, 'accent/on-accent');
    }
    await useAppAccent(f);
  }
  // New session (modals/SessionModal.tsx, ui/Stepper.tsx, ui/InputChip.tsx)
  if (!exists('New session')) {
    const f = await screen('New session', SW, SH); await timerPage(f);
    const body = await modalOver(f, 'New session'); bindNum(body, 'itemSpacing', 'space/20');
    await field(body, 'Session name', await input('Deep work'));
    const lengths = auto('HORIZONTAL', 'Lengths', 'space/16'); body.appendChild(lengths); fill(lengths);
    await field(lengths, 'Focus', await stepper('50', 'min')); await field(lengths, 'Break', await stepper('10', 'min'));
    const lists = await field(body, 'Task lists');
    const chips = auto('HORIZONTAL', 'Attached', 'space/8'); lists.appendChild(chips); chips.appendChild(await inputChip('Quarterly report', 3)); chips.appendChild(await inputChip('Inbox', 3));
    put(lists, await input('Add a task list…', false, true), 'fill');
    await field(body, 'Reward on completion (optional)', await input('Coffee with a friend', true, true));
    formActions(body, 'Create session', 'Cancel');
    await useAppAccent(f);
  }
  // Help, and two of its views (src/components/help/HelpModal.tsx, features/help.css)
  if (!exists('Help')) { const f = await screen('Help', SW, SH); await timerPage(f); await helpModal(f); await useAppAccent(f); }
  if (!exists('Help · About')) { const f = await screen('Help · About', SW, SH); await timerPage(f); capModal(await helpModal(f, 'about')); await useAppAccent(f); }
  if (!exists('Help · What\'s new')) { const f = await screen('Help · What\'s new', SW, SH); await timerPage(f); capModal(await helpModal(f, 'new')); await useAppAccent(f); }
  // Notification settings, from the bell (modals/NotificationModal.tsx): something changed, so Cancel shows
  if (!exists('Notification settings')) {
    const f = await screen('Notification settings', SW, SH); await timerPage(f);
    await notificationForm(await modalOver(f, 'Notification settings'), 'Cancel');
    await useAppAccent(f);
  }
  // The tour (src/components/onboarding/OnboardingTour.tsx, features/tour.css): its welcome, then a step
  if (!exists('Onboarding · welcome')) {
    const f = await screen('Onboarding · welcome', SW, SH); await timerPage(f);
    const back = await backdrop(f, 'Tour');
    const c = auto('VERTICAL', 'Welcome', 'space/12'); setWidth(c, 440); bindNum(c, 'width', 'size/tour-card-width-wide'); pad(c, 'space/32', 'space/32', 'space/32', 'space/32'); radius(c, 'radius/3xl'); c.fills = [await paint('surface/3')]; await elevate(c); back.appendChild(c);
    const mark = auto('HORIZONTAL', 'Badge'); fixed(mark, 52, 52); bindNum(mark, 'width', 'size/tour-badge-size'); bindNum(mark, 'height', 'size/tour-badge-size'); mark.primaryAxisAlignItems = 'CENTER'; mark.counterAxisAlignItems = 'CENTER'; radius(mark, 'radius/xl'); mark.fills = [await paint('accent/accent')];
    mark.appendChild(await iconInst('Timer', 'accent/on-accent', 26)); c.appendChild(mark);
    await para(c, 'Hi San, welcome to Pastel Espresso', 'xl/Bold', 'text/1', 'Title');
    await para(c, 'A calm place to focus, one session at a time. Want a quick look around? It takes about a minute.', 'md/Regular', 'text/2', 'Body');
    const foot = auto('HORIZONTAL', 'Actions', 'space/8'); foot.primaryAxisAlignItems = 'MAX'; pad(foot, 'space/8', null, null, null); c.appendChild(foot); fill(foot);
    foot.appendChild(use('Button', 'Style=Secondary, Size=md', { Label: 'Maybe later' })); foot.appendChild(use('Button', 'Style=Primary, Size=md', { Label: 'Show me around' }));
    const x = use('IconButton', 'Size=sm, State=Default', { Icon: 'Close' }); x.name = 'Close tour'; float(c, x, 440 - 32 - 10, 10);
    await useAppAccent(f);
  }
  if (!exists('Onboarding · a tour step')) {
    const f = await screen('Onboarding · a tour step', SW, SH); const page = await timerPage(f);
    // The first step lights the player: it sits at the page's start, 280 from the left and 72 from the top (see win())
    const player = page.children[0], gap = 8, x = 280 - gap, y = 72 - gap, w = player.width + 2 * gap, h = player.height + 2 * gap;
    await spotlight(f, x, y, w, h);
    const c = use('TourCard', null, { Title: 'Your timer', Body: 'Sessions play like tracks. Press play to focus, and the break comes right after.' });
    inner(c, 'Style=Secondary, Size=sm', 'Label', 'Back'); inner(c, 'Style=Primary, Size=sm', 'Label', 'Next');
    float(f, c, x + w + 16, y + 24);
    await useAppAccent(f);
  }
  // The first run: one account that looks after every profile (auth/LoginScreen.tsx, mode "setup")
  if (!exists('Create the main account')) {
    await authScreen('Create the main account', 'Let’s set up Pastel Espresso', 'One quick step, no Next › Next › Finish required. This main account looks after every profile on this device.',
      [['Display name', 'San Milano'], ['Username', 'san'], ['Password', '••••••••••'], ['Confirm password', '••••••••••']], 'Create main account', 'Already have an account? Sign in');
  }
  // A reward was claimed (src/components/rewards/CelebrationOverlay.tsx, features/celebration.css)
  if (!exists('Reward claimed')) {
    const f = await screen('Reward claimed', SW, SH); await rewardsPage(f);
    const back = await backdrop(f, 'Celebration');
    const c = auto('VERTICAL', 'Celebration card', 'space/8'); setWidth(c, 400); c.counterAxisAlignItems = 'CENTER'; pad(c, 'space/40', 'space/32', 'space/32', 'space/32'); radius(c, 'radius/3xl'); c.fills = [await paint('accent/accent')]; await elevate(c); back.appendChild(c);
    c.appendChild(await iconInst('Gift', 'accent/on-accent', 60));
    c.appendChild(await text('Reward claimed', '2xl/Bold', 'accent/on-accent', 'Title'));
    const d = await para(c, 'After Friday’s deep work.', 'md/Regular', 'accent/on-accent-2', 'Description'); d.textAlignHorizontal = 'CENTER';
    const hold = auto('VERTICAL', 'Action'); pad(hold, 'space/16', null, null, null); c.appendChild(hold);
    // On the accent, the button turns the pair round: the ink as its fill, the accent as its text
    const ok = use('Button', 'Style=Primary, Size=md', { Label: 'Awesome!' }); ok.fills = [await paint('accent/on-accent')]; for (const t of ok.findAll(n => n.type === 'TEXT')) t.fills = [await paint('accent/accent')]; hold.appendChild(ok);
    await useAppAccent(f);
  }
  // An update is ready (src/components/updates/UpdateNotice.tsx, features/updates.css): the card sits bottom right
  if (!exists('Update ready')) {
    const f = await screen('Update ready', SW, SH); await timerPage(f);
    const c = use('UpdateCard', null, { Title: 'Version 1.4.0 is ready', Body: 'Update now and Pastel Espresso reopens where you left off. Your data stays as it is.' });
    inner(c, 'Style=Secondary, Size=sm', 'Label', 'Maybe later'); inner(c, 'Style=Primary, Size=sm', 'Label', 'Update and restart');
    const prog = c.findOne(n => n.type === 'INSTANCE' && n.name.startsWith('Tone=')); if (prog) prog.visible = false;   // the bar shows once it downloads
    const ic = c.findOne(n => n.type === 'INSTANCE' && n.name === 'Icon'); if (ic) { soft(() => ic.swapComponent(icon('Sparkle'))); await recolor(ic, 'accent/on-container'); }
    float(f, c, SW - c.width - 24, SH - c.height - 24);
    await useAppAccent(f);
  }
  // The window stopped drawing (src/components/shell/CrashScreen.tsx): the library's screen, with Espresso's words
  if (!exists('Something unexpected happened')) {
    const f = await screen('Something unexpected happened', SW, SH);
    const c = use('CrashScreen', null, { Title: 'Something unexpected happened', Body: 'Pastel Espresso stopped drawing this screen. Your saved data is safe. Reload to pick up where you left off.' });
    f.appendChild(c); c.x = 0; c.y = 0; c.resize(SW, SH);
    for (const n of ['Problem space', 'Technical details (folded)']) { const x = c.findOne(k => k.name === n); if (x) x.visible = false; }   // Espresso keeps the details for "Copy details"
    inner(c, 'Style=Primary, Size=md', 'Label', 'Reload'); inner(c, 'Style=Secondary, Size=md', 'Label', 'Copy details');
    setText(c, 'Hint', 'If it keeps happening, copy the details and include them when you report it.');
    const mark = c.findOne(n => n.type === 'INSTANCE' && n.name === 'Icon'); if (mark) { soft(() => mark.swapComponent(icon('Timer'))); await recolor(mark, 'accent/on-accent'); }
    await useAppAccent(f);
  }

  // ── The small windows ──
  if (!exists('Mini player · compact')) { const f = await miniPlayer('Mini player · compact', 400, 152); await useAppAccent(f); }
  if (!exists('Mini player · tall')) { const f = await miniPlayer('Mini player · tall', 320, 420); await useAppAccent(f); }
  if (!exists('Mini player · wide')) { const f = await miniPlayer('Mini player · wide', 640, 300); await useAppAccent(f); }
  // The alert in its own window (src/island/IslandApp.tsx, components/alerts/AlertCard.tsx, features/alerts.css): before a break, in the break's colour
  if (!exists('Alert island')) {
    const f = await screen('Alert island', 400, 120); f.fills = [await paint('surface/3')];
    f.layoutMode = 'HORIZONTAL'; f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED'; pad(f, 'space/16', 'space/16', 'space/16', 'space/16'); bindNum(f, 'itemSpacing', 'space/12');
    const bell = auto('HORIZONTAL', 'Icon'); fixed(bell, 42, 42); bell.primaryAxisAlignItems = 'CENTER'; bell.counterAxisAlignItems = 'CENTER'; radius(bell, 'radius/pill'); bell.fills = [await paint('espresso/break')];
    bell.appendChild(await iconInst('Bell', 'espresso/on-break', 20)); f.appendChild(bell);
    const main = auto('VERTICAL', 'Main', 'space/8'); f.appendChild(main); fill(main);
    const words = auto('VERTICAL', 'Text'); main.appendChild(words); fill(words);
    await para(words, 'Focus session complete', 'md/SemiBold', 'text/1', 'Title'); await para(words, 'Nice work. Time for a break.', 'sm/Regular', 'text/2', 'Body');
    const acts = auto('HORIZONTAL', 'Actions', 'space/8'); main.appendChild(acts);
    const go = use('Button', 'Style=Primary, Size=sm', { Label: 'Start break' }); go.fills = [await paint('espresso/break')]; for (const t of go.findAll(n => n.type === 'TEXT')) t.fills = [await paint('espresso/on-break')]; acts.appendChild(go);
    acts.appendChild(use('Button', 'Style=Secondary, Size=sm', { Label: 'Open app' }));
    // Dismiss: the ring around it runs down until the alert hides
    const x = auto('HORIZONTAL', 'Dismiss'); fixed(x, 36, 36); x.primaryAxisAlignItems = 'CENTER'; x.counterAxisAlignItems = 'CENTER'; radius(x, 'radius/pill'); f.appendChild(x);
    float(x, await ring(34, 3, 'text/1', 0.7), 1, 1); x.appendChild(await iconInst('Close', 'text/1', 14));
    await useAppAccent(f);
  }
}

runScreens('Pastel Espresso', buildScreens);
