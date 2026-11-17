/* global APP_COLOURS, appVars, use, find, prop, v, paint, text, iconInst, recolor, auto, fixed, fill, fillBoth,
   bindNum, radius, pad, screen, float, exists, appSection, appColour, setUpAccent, useAppAccent, runScreens, log */
// Pastel Espresso's screens, for Figma: its own components, then its desktop windows, built from
// the Pastel Studio library and re-coloured with Espresso's accent (solar lime) and its drawer.
// Sizes, colours and text come from src/styles and src/constants/strings.ts.

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
async function sectionFor(name) {
  let s = appSection.children.find(n => n.type === 'SECTION' && n.name === name);
  if (!s) { s = figma.createSection(); s.name = name; appSection.appendChild(s); s.fills = [await paint('surface/bg')]; log.push(`+ ${name}`); }
  return s;
}

// ══ Espresso's own components ════════════════════════════
async function buildComponents() {
  const sec = await sectionFor('Espresso components');
  const have = name => sec.findOne(n => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === name);
  const keep = (name, node) => { ESP[name] = node; return node; };
  const add = async (node, x, y) => { sec.appendChild(node); node.x = x; node.y = y; await useAppAccent(node); };
  let y = 64;

  // App mark: the logo tile at the start of the top bar (src/styles/components/app-mark.css)
  if (!keep('AppMark', have('AppMark'))) {
    const m = figma.createComponent(); m.name = 'AppMark'; m.layoutMode = 'HORIZONTAL'; m.primaryAxisAlignItems = 'CENTER'; m.counterAxisAlignItems = 'CENTER';
    fixed(m, 32, 32); bindNum(m, 'width', 'size/icon-button-size-sm'); bindNum(m, 'height', 'size/icon-button-size-sm'); radius(m, 'radius/md');
    m.fills = [await paint('accent/accent')]; m.appendChild(await iconInst('Timer', 'accent/on-accent', 16));
    m.description = 'The app mark: Espresso’s logo on a 32px accent tile (radius md). It opens the app menu. The logo here is a stand-in (IconTimer).';
    keep('AppMark', m); await add(m, 64, y);
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
    keep('UserBadge', set); await add(set, 200, y);
  }
  y += 160;

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
    keep('PlayerCard', set); await add(set, 64, y);
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
    keep('QueueItem', set); await add(set, 900, y);
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
    keep('TaskItem', set); await add(set, 1540, y);
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
    keep('TaskListHeading', set); await add(set, 1540, y + 200);
  }
  if (!keep('AddTaskRow', have('AddTaskRow'))) {
    const c = figma.createComponent(); c.name = 'AddTaskRow'; c.layoutMode = 'HORIZONTAL'; c.counterAxisAlignItems = 'CENTER';
    c.resize(640, 44); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED';
    pad(c, null, 'space/8', null, 'space/16'); bindNum(c, 'itemSpacing', 'space/12'); radius(c, 'radius/md'); c.fills = [await paint('espresso/surface-inset')];
    c.appendChild(await iconInst('Plus', 'text/2', 16)); c.appendChild(await text('Add a task', 'md/Regular', 'text/2', 'Placeholder'));
    c.description = 'The last row of a task list: type a task and press Enter. A tonal “Add” button appears once there is text.';
    keep('AddTaskRow', c); await add(c, 1540, y + 380);
  }
  y += 1000;

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
    keep('Drawer', set); await add(set, 64, y);
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
    keep('TopBar', c); await add(c, 500, y);
  }
  // Lay the components section out
  sec.resizeWithoutConstraints(Math.max(...sec.children.map(n => n.x + n.width)) + 64, Math.max(...sec.children.map(n => n.y + n.height)) + 64);
}

// ══ Screens ══════════════════════════════════════════════
// The window: the top bar across, the drawer at the left, the page beside it
async function win(f, title, drawer) {
  f.layoutMode = 'VERTICAL'; f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED';
  const top = ESP.TopBar.createInstance(); f.appendChild(top); fill(top); prop(top, 'Title', title);
  const body = auto('HORIZONTAL', 'Body'); f.appendChild(body); fillBoth(body);
  const nav = auto('VERTICAL', 'Nav'); pad(nav, 'space/4', null, 'space/20', 'space/20'); body.appendChild(nav); nav.layoutSizingVertical = 'FILL';
  const d = ESP.Drawer.children.find(x => x.name === `Layout=${drawer || 'Expanded'}`).createInstance(); nav.appendChild(d); d.layoutSizingVertical = 'FILL';
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
    const f = await screen('Tasks', SW, SH); const { page } = await win(f, 'Tasks');
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
    const menu = auto('VERTICAL', 'Account menu'); menu.resize(232, 100); menu.counterAxisSizingMode = 'FIXED'; pad(menu, 'space/6', 'space/6', 'space/6', 'space/6');
    radius(menu, 'radius/lg'); menu.fills = [await paint('espresso/drawer-hover-2')];
    const elev = (await figma.getLocalEffectStylesAsync()).find(s => s.name === 'elevation/overlay'); if (elev) await menu.setEffectStyleIdAsync(elev.id);
    for (const [label, ic] of [['Profile', 'User'], ['Appearance', 'Palette'], ['Settings', 'Settings']]) { const it = use('MenuItem', 'Kind=Default', { Label: label, Icon: ic }); menu.appendChild(it); fill(it); }
    const dv = figma.createRectangle(); dv.name = 'Divider'; dv.resize(200, 1); dv.fills = [await paint('espresso/drawer-hover-3')]; const dw = auto('VERTICAL', 'Divider'); pad(dw, 'space/6', 'space/4', 'space/6', 'space/4'); dw.appendChild(dv); menu.appendChild(dw); fill(dw); fill(dv);
    const out = use('MenuItem', 'Kind=Default', { Label: 'Sign out', Icon: 'LogOut' }); menu.appendChild(out); fill(out);
    float(f, menu, 36, SH - menu.height - 96);
    await useAppAccent(f);
  }
  if (!exists('Sign in')) {
    const f = await screen('Sign in', SW, SH);
    const bar = auto('HORIZONTAL', 'Title bar'); fixed(bar, SW, 68); bar.primaryAxisAlignItems = 'MAX'; bar.counterAxisAlignItems = 'CENTER'; pad(bar, null, 'space/8', null, null);
    bar.appendChild(find('WindowControls').createInstance()); f.appendChild(bar); bar.x = 0; bar.y = 0;
    const c = auto('VERTICAL', 'Sign-in card', 'space/8'); c.resize(420, 100); c.counterAxisSizingMode = 'FIXED';
    pad(c, 'space/40', 'space/40', 'space/32', 'space/40'); radius(c, 'radius/3xl'); c.fills = [await paint('surface/1')];
    const logoWrap = auto('VERTICAL', 'Logo'); pad(logoWrap, null, null, 'space/16', null); c.appendChild(logoWrap);
    const logo = auto('HORIZONTAL', 'Tile'); fixed(logo, 56, 56); logo.primaryAxisAlignItems = 'CENTER'; logo.counterAxisAlignItems = 'CENTER'; radius(logo, 'radius/xl'); logo.fills = [await paint('accent/accent')];
    logo.appendChild(await iconInst('Timer', 'accent/on-accent', 30)); logoWrap.appendChild(logo);
    c.appendChild(await text('Welcome back', '2xl/Bold', 'text/1', 'Title'));
    const sub = await text('Sign in to pick up where you left off.', 'md/Regular', 'text/2', 'Subtitle'); c.appendChild(sub); fill(sub); sub.textAutoResize = 'HEIGHT';
    const form = auto('VERTICAL', 'Form', 'space/16'); pad(form, 'space/16', null, null, null); c.appendChild(form); fill(form);
    for (const [label, value, filled] of [['Username', 'san', true], ['Password', '••••••••••', true]]) {
      const fld = auto('VERTICAL', label, 'space/8'); form.appendChild(fld); fill(fld);
      fld.appendChild(await text(label, 'sm/SemiBold', 'text/2', 'Label'));
      const inp = auto('HORIZONTAL', 'Input'); inp.counterAxisAlignItems = 'CENTER'; fixed(inp, 340, 44); pad(inp, null, 'space/16', null, 'space/16'); radius(inp, 'radius/pill'); inp.fills = [await paint('field/bg')];
      inp.appendChild(await text(value, 'md/Regular', filled ? 'text/1' : 'text/3', 'Value')); fld.appendChild(inp); fill(inp);
    }
    const go = use('Button', 'Style=Primary, Size=lg', { Label: 'Sign in' }); form.appendChild(go); fill(go);
    const sw = auto('HORIZONTAL', 'Switch'); sw.primaryAxisAlignItems = 'CENTER'; pad(sw, 'space/8', null, null, null); c.appendChild(sw); fill(sw);
    sw.appendChild(use('TextButton', 'Tone=Accent, State=Default', { Label: 'No account? Create the main account' }));
    f.appendChild(c); c.x = (SW - c.width) / 2; c.y = (SH - c.height) / 2;
    await useAppAccent(f);
  }
}

runScreens('Pastel Espresso', buildScreens);
