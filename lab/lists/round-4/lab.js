/* Component lab: lists, round 4. Plain script (no modules), so the page also opens from a
   double-click. Three columns render from the same data shape; each keeps its own copy.
   A5 and A6 share the list markup (what differs is in lab.css) and each has its own picker. */
/* global document, window, setTimeout, clearTimeout, requestAnimationFrame */
(() => {
  'use strict';

  // ── Icons: the app's own set (components/ui/icons/AppIcons.tsx) ──
  const stroke = (inner, size = 18, width = 2) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  const I = {
    plus: (s = 16, w = 2.4) => stroke('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', s, w),
    check: (s = 15) => stroke('<polyline points="20 6 9 17 4 12"/>', s, 2.6),
    close: (s = 16) => stroke('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>', s),
    search: (s = 15) => stroke('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', s),
    down: (s = 16) => stroke('<polyline points="6 9 12 15 18 9"/>', s, 2.2),
    up: (s = 16) => stroke('<polyline points="18 15 12 9 6 15"/>', s, 2.2),
    right: (s = 16) => stroke('<polyline points="9 18 15 12 9 6"/>', s, 2.2),
    list: (s = 15) => stroke('<line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>', s),
    gift: (s = 13) => stroke('<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5" rx="1"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>', s),
    unlink: (s = 15) => stroke('<path d="M18.84 12.25l1.72-1.71a4.5 4.5 0 0 0-6.36-6.37l-1.72 1.72"/><path d="M5.16 11.75l-1.72 1.71a4.5 4.5 0 0 0 6.36 6.37l1.72-1.72"/><line x1="8" y1="2" x2="8" y2="5"/><line x1="2" y1="8" x2="5" y2="8"/><line x1="16" y1="19" x2="16" y2="22"/><line x1="19" y1="16" x2="22" y2="16"/>', s),
    edit: (s = 15) => stroke('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>', s),
    trash: (s = 15) => stroke('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', s),
    copy: (s = 15) => stroke('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>', s),
    swap: (s = 15) => stroke('<polyline points="4 16 8 20 12 16"/><line x1="8" y1="20" x2="8" y2="4"/><polyline points="12 8 16 4 20 8"/><line x1="16" y1="4" x2="16" y2="20"/>', s),
    reset: (s = 15) => stroke('<path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 3 3 9 9 9"/>', s),
    external: (s = 15) => stroke('<path d="M18 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5.5"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>', s),
    more: (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>`,
    grip: () => '<svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor" aria-hidden="true"><circle cx="2" cy="3" r="1.25"/><circle cx="6" cy="3" r="1.25"/><circle cx="2" cy="7" r="1.25"/><circle cx="6" cy="7" r="1.25"/><circle cx="2" cy="11" r="1.25"/><circle cx="6" cy="11" r="1.25"/></svg>',
    equalizer: () => '<span class="equalizer" aria-hidden="true" style="width: 14px; height: 14px;"><span></span><span></span><span></span></span>'
  };

  // ── Data ──
  let uid = 0;
  const tasks = (...texts) => texts.map(text => ({ id: `t${++uid}`, text, done: false }));
  const list = (name, ...texts) => ({ id: `l${++uid}`, name, collapsed: false, tasks: tasks(...texts) });
  const seed = () => {
    const project = list('Project tasks', 'Review sprint deliverables', 'Write feature documentation', 'Test calendar and time tracking');
    const errands = list('Errands', 'Book the dentist', 'Renew the library card');
    Object.assign(errands.tasks[0], { done: true, time: '4m' });
    return {
      session: 'Pomodoro classic',
      lists: [project, errands],
      // Lists that exist but aren't in this session: enough of them that finding one needs a search.
      library: [
        list('Reading', 'Finish chapter 4', 'Notes on the grid essay'),
        list('Weekly review', 'Clear the inbox', 'Plan next week', 'Back up the laptop'),
        list('Groceries', 'Coffee beans', 'Oat milk', 'Lemons', 'Rice'),
        list('Home repairs', 'Fix the hallway light', 'Oil the door hinges'),
        list('Trip to Lisbon', 'Book the flights', 'Find a place to stay', 'Renew the passport'),
        list('Blog drafts', 'Outline the Swiss grid post'),
        list('Client onboarding', 'Send the welcome pack', 'Schedule the kickoff', 'Share the brief'),
        list('Invoices', 'October invoices', 'Chase the late payment'),
        list('Garden', 'Prune the roses', 'Order tulip bulbs'),
        list('Gift ideas', 'Something for Ana'),
        list('Learning Rust', 'Chapter 10: traits', 'Rewrite the parser'),
        list('Workout plan', 'Monday run', 'Wednesday weights', 'Saturday swim')
      ],
      sessions: [
        { id: 's1', name: 'Pomodoro classic', meta: '25′ focus · 5′ break', reward: true },
        { id: 's2', name: 'Deep work', meta: '50′ focus · 10′ break', reward: true },
        { id: 's3', name: 'Quick sprint', meta: '15′ focus · 3′ break', reward: false }
      ],
      active: 's1',
      made: 0
    };
  };

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const findList = (s, id) => s.lists.find(l => l.id === id);
  const left = l => l.tasks.filter(t => !t.done).length;
  const done = l => l.tasks.length - left(l);
  const pct = l => (l.tasks.length ? Math.round((done(l) / l.tasks.length) * 100) : 0);
  const move = (arr, from, to) => { if (from < 0 || to < 0 || to >= arr.length) return; const [x] = arr.splice(from, 1); arr.splice(to, 0, x); };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  // Loose matching, like the app's lib/fuzzy.ts: every word, any order, accents ignored.
  const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const matches = (name, query) => fold(query).split(/\s+/).filter(Boolean).every(word => fold(name).includes(word));

  // ── Toast (for what the lab doesn't wire) ──
  let toastTimer = 0;
  const toast = text => {
    const el = document.getElementById('toast');
    el.textContent = text;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 3200);
  };
  const dialogNote = what => toast(`${what} opens a dialog in the app. It isn't wired in this demo.`);

  // ── Popovers: the app's .popover, .menu, .select-menu and .list-picker styles ──
  let pop = null;
  function closePopover() {
    if (!pop) return;
    pop.el.remove();
    pop.anchor.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', pop.out, true);
    document.removeEventListener('keydown', pop.key, true);
    window.removeEventListener('resize', closePopover);
    pop = null;
  }
  /** Returns true when the anchor's own popover was open (the click closes it). */
  function toggledOff(anchor) {
    const same = pop && pop.anchor === anchor;
    closePopover();
    return same;
  }
  function showPopover(el, anchor, align, { arrows = true, focus } = {}) {
    document.body.appendChild(el);
    const a = anchor.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let x = align === 'end' ? a.right - w : a.left;
    x = Math.max(8, Math.min(x, window.innerWidth - w - 8));
    let y = a.bottom + 4;
    if (y + h > window.innerHeight - 8 && a.top - h - 4 > 8) {
      y = a.top - h - 4;
      el.classList.replace('is-below', 'is-above');
    } else if (y + h > window.innerHeight - 8) {
      y = Math.max(8, window.innerHeight - h - 8);
    }
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    anchor.setAttribute('aria-expanded', 'true');
    const items = () => Array.from(el.querySelectorAll('button:not(:disabled)'));
    const out = e => { if (!el.contains(e.target) && !anchor.contains(e.target)) closePopover(); };
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); closePopover(); anchor.focus(); return; }
      if (!arrows || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      e.preventDefault();
      const all = items();
      const at = all.indexOf(document.activeElement);
      all[e.key === 'ArrowDown' ? (at + 1) % all.length : (at - 1 + all.length) % all.length].focus();
    };
    document.addEventListener('pointerdown', out, true);
    document.addEventListener('keydown', key, true);
    window.addEventListener('resize', closePopover);
    pop = { el, anchor, out, key };
    const first = focus || items()[0];
    if (first) first.focus({ preventScroll: true });
  }
  /** A menu under its anchor. An item runs, opens something else (`open`), or names a dialog (`dialog`). */
  function openMenu(v, anchor, items, align = 'end') {
    if (toggledOff(anchor)) return;
    const el = document.createElement('div');
    el.className = 'popover is-below menu';
    el.setAttribute('role', 'menu');
    el.innerHTML = items.map((it, i) => it.divider
      ? '<div class="menu-divider"></div>'
      : `<button type="button" role="menuitem" class="menu-item ${it.danger ? 'is-danger' : ''}" data-i="${i}" ${it.disabled ? 'disabled' : ''}>` +
        `<span class="menu-item-icon">${it.icon || ''}</span><span class="menu-item-label">${esc(it.label)}</span></button>`).join('');
    el.addEventListener('click', e => {
      const b = e.target.closest('.menu-item');
      if (!b) return;
      const it = items[Number(b.dataset.i)];
      closePopover();
      if (it.open) return it.open(anchor);
      if (it.dialog) return dialogNote(it.dialog);
      it.run();
      v.render();
    });
    showPopover(el, anchor, align);
  }
  /** Current only: the header's select, listing every list. */
  function openSelect(v, anchor, l) {
    if (toggledOff(anchor)) return;
    const s = v.state;
    const el = document.createElement('div');
    el.className = 'popover is-below select-menu';
    el.style.minWidth = `${anchor.offsetWidth}px`;
    el.innerHTML = `<ul role="listbox" class="select-options">${[...s.lists, ...s.library].map(x => {
      const inUse = x.id !== l.id && s.lists.includes(x);
      const on = x.id === l.id;
      return `<li role="presentation"><button type="button" role="option" class="select-option ${on ? 'is-selected' : ''}" data-id="${x.id}" aria-selected="${on}" ${inUse ? 'disabled' : ''}>` +
        `<span class="select-option-check" aria-hidden="true">${on ? I.check(15) : ''}</span><span class="select-option-label">${esc(x.name)}</span>` +
        `<span class="select-option-meta">${inUse ? 'In this session' : `${left(x)} left`}</span></button></li>`;
    }).join('')}</ul><div class="select-create"><button type="button" class="select-create-btn" data-id="new">${I.plus(16)}New task list</button></div>`;
    el.addEventListener('click', e => {
      const b = e.target.closest('button[data-id]');
      if (!b) return;
      closePopover();
      if (b.dataset.id !== l.id) swapList(v, l.id, b.dataset.id);
      v.render();
    });
    showPopover(el, anchor, 'start');
  }
  // ── The list picker ──
  // Each column has its own: Current is the app's (ui/ListPicker); A5 and A6 are the redesigns.
  // They share the behaviour: typing filters, the arrows move the highlight, Enter picks, and a
  // name with no match can be created.
  const lpShell = (title, closeSurface, createSurface, searchInBand) => {
    const search = `<label class="lp-search">${I.search()}<input type="text" placeholder="Search lists" aria-label="Search task lists" autocomplete="off"></label>`;
    return `<div class="lp-band"><div class="lp-bandrow"><h3 class="lp-title">${esc(title)}</h3>
        <button type="button" class="icon-btn sm ${closeSurface}" data-close aria-label="Close" title="Close">${I.close()}</button></div>${searchInBand ? search : ''}</div>
      <div class="lp-body">${searchInBand ? '' : search}
        <div class="lp-scroll"><ul role="listbox" aria-label="${esc(title)}" data-rows></ul></div>
        <div class="lp-foot"><button type="button" class="btn-action ${createSurface} lp-create" data-create></button></div>
      </div>`;
  };
  const lpRow = meta => (l, i) => `<li role="presentation"><button type="button" role="option" tabindex="-1" data-index="${i}" class="lp-row">` +
    `<span class="lp-name">${esc(l.name)}</span><span class="lp-meta">${meta(l)}</span></button></li>`;
  const pickers = {
    // The app's: a head, a pill search, the lists in a sunken box, a lime create row.
    cur: {
      cls: 'list-picker',
      shell: title => `<div class="list-picker-body">
        <div class="list-picker-head"><h3 class="list-picker-title">${esc(title)}</h3>
          <button type="button" class="icon-btn sm on-3" data-close aria-label="Close" title="Close">${I.close()}</button></div>
        <div class="list-picker-search">${I.search()}<input type="text" placeholder="Search lists…" aria-label="Search task lists" autocomplete="off"></div>
        <div class="list-picker-list"><ul role="listbox" aria-label="${esc(title)}" data-rows></ul></div>
        <div class="list-picker-foot"><button type="button" class="list-picker-row list-picker-create" data-create></button></div>
      </div>`,
      row: (l, i) => `<li role="presentation"><button type="button" role="option" tabindex="-1" data-index="${i}" class="list-picker-row">` +
        `<span class="list-picker-tile" aria-hidden="true">${I.list(16)}</span><span class="list-picker-text"><span class="list-picker-name">${esc(l.name)}</span>` +
        `<span class="list-picker-meta">${plural(left(l), 'task left', 'tasks left')}</span></span></button></li>`,
      empty: text => `<li role="presentation" class="list-picker-empty">${text}</li>`,
      create: label => `<span class="list-picker-tile" aria-hidden="true">${I.plus(18)}</span><span class="list-picker-name">${label}</span>`
    },
    // A5: a menu. The title on a band; the search a well under it; one-line rows with no fill.
    a5: {
      cls: 'lp lp--menu',
      shell: title => lpShell(title, 'on-2', 'on-3', false),
      row: lpRow(l => `${left(l)} left`),
      empty: text => `<li role="presentation" class="lp-empty">${text}</li>`,
      create: label => `${I.plus(16)}<span>${label}</span>`
    },
    // A6: a small card. The band holds the title and the search; rows are raised, two lines.
    a6: {
      cls: 'lp lp--card',
      shell: title => lpShell(title, 'on-3', 'on-2', true),
      row: lpRow(l => plural(left(l), 'task left', 'tasks left')),
      empty: text => `<li role="presentation" class="lp-empty">${text}</li>`,
      create: label => `${I.plus(16)}<span>${label}</span>`
    }
  };
  /** Builds a column's picker. `pick(id, name)` gets a list's id, or 'new' with the typed name. */
  function buildPicker(v, { title, pick, close }) {
    const t = pickers[v.key];
    const el = document.createElement('div');
    el.className = `popover is-below ${t.cls}`;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', title);
    el.innerHTML = t.shell(title);
    const input = el.querySelector('input');
    const ul = el.querySelector('[data-rows]');
    const create = el.querySelector('[data-create]');
    let rows = [];
    let at = 0;
    const name = () => input.value.trim();
    const createName = () => (name() && !v.state.library.some(l => fold(l.name) === fold(name())) ? name() : '');
    // The highlight moves without redrawing, so pointing at a row never rebuilds the list.
    const mark = scroll => {
      ul.querySelectorAll('[data-index]').forEach((b, i) => {
        b.classList.toggle('is-highlighted', i === at);
        b.setAttribute('aria-selected', String(i === at));
        if (scroll && i === at) b.scrollIntoView({ block: 'nearest' });
      });
      create.classList.toggle('is-highlighted', at === rows.length);
    };
    const draw = () => {
      rows = v.state.library.filter(l => matches(l.name, name()));
      at = Math.min(at, rows.length);
      ul.innerHTML = rows.length
        ? rows.map(t.row).join('')
        : t.empty(name() ? 'No list has that name. Press Enter to create it.' : 'Every list is already in this session.');
      create.innerHTML = t.create(createName() ? `Create "${esc(createName())}"` : 'New task list');
      mark(false);
    };
    const choose = index => {
      const l = rows[index];
      pick(l ? l.id : 'new', l ? undefined : createName() || undefined);
    };
    input.addEventListener('input', () => { at = 0; draw(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const count = rows.length + 1;
        at = (at + (e.key === 'ArrowDown' ? 1 : -1) + count) % count;
        mark(true);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        choose(at);
      }
    });
    el.addEventListener('mousemove', e => {
      const row = e.target.closest('[data-index]');
      const next = row ? Number(row.dataset.index) : e.target.closest('[data-create]') ? rows.length : at;
      if (next !== at) { at = next; mark(false); }
    });
    el.addEventListener('click', e => {
      if (e.target.closest('[data-close]')) return close();
      if (e.target.closest('[data-create]')) return choose(rows.length);
      const row = e.target.closest('[data-index]');
      if (row) choose(Number(row.dataset.index));
      return undefined;
    });
    draw();
    return el;
  }
  function openPicker(v, anchor, { title, pick, align = 'start' }) {
    if (toggledOff(anchor)) return;
    const el = buildPicker(v, { title, pick: (id, name) => { closePopover(); pick(id, name); v.render(); }, close: closePopover });
    showPopover(el, anchor, align, { arrows: false, focus: el.querySelector('input') });
  }
  /** The same picker, shown open in the page so the three can be compared without opening them. */
  const inlinePicker = v => {
    const el = buildPicker(v, {
      title: 'Add a task list',
      pick: (id, name) => { attachList(v, id, name); v.render(); },
      close: () => toast('Close shuts the picker when it is opened from "Add task list".')
    });
    el.classList.add('lab-inline');
    return el;
  };

  // ── Actions on a column's data ──
  function takeFromLibrary(s, id, name) {
    if (id === 'new') return { id: `l${++uid}`, name: name || `New list ${++s.made}`, collapsed: false, tasks: [] };
    return s.library.splice(s.library.findIndex(l => l.id === id), 1)[0];
  }
  function attachList(v, id, name) {
    const l = takeFromLibrary(v.state, id, name);
    l.collapsed = false;
    v.state.lists.push(l);
    v.focus = l.id;
  }
  function detachList(v, id, keep = true) {
    const s = v.state;
    const [l] = s.lists.splice(s.lists.findIndex(x => x.id === id), 1);
    if (keep) s.library.push(l);
  }
  function swapList(v, id, withId, name) {
    const s = v.state;
    const at = s.lists.findIndex(l => l.id === id);
    const incoming = takeFromLibrary(s, withId, name);
    s.library.push(s.lists[at]);
    s.lists[at] = incoming;
  }
  const addPicker = v => anchor => openPicker(v, anchor, { title: 'Add a task list', pick: (id, name) => attachList(v, id, name), align: anchor.dataset.align || 'end' });

  // ── Menus ──
  const taskMenu = (v, l, t) => {
    const at = l.tasks.indexOf(t);
    const items = [
      t.done
        ? { label: 'Mark as not done', icon: I.reset(), run: () => { t.done = false; delete t.time; } }
        : { label: 'Mark as complete', icon: I.check(), run: () => { t.done = true; } },
      { label: 'Rename', icon: I.edit(), dialog: 'Rename' },
      { label: 'Duplicate', icon: I.copy(), run: () => l.tasks.splice(at + 1, 0, { ...t, id: `t${++uid}` }) }
    ];
    // The options add a way to reorder without dragging.
    if (v.key !== 'cur') {
      items.push(
        { label: 'Move up', icon: I.up(), disabled: at === 0, run: () => move(l.tasks, at, at - 1) },
        { label: 'Move down', icon: I.down(), disabled: at === l.tasks.length - 1, run: () => move(l.tasks, at, at + 1) }
      );
    }
    items.push({ divider: true }, { label: 'Delete', icon: I.trash(), danger: true, run: () => l.tasks.splice(at, 1) });
    return items;
  };
  const listMenu = (v, l) => {
    const s = v.state;
    const at = s.lists.indexOf(l);
    const items = [];
    if (v.key === 'cur') {
      items.push({ label: 'New task', icon: I.plus(15), run: () => { l.collapsed = false; v.focus = l.id; } });
    } else {
      items.push({
        label: 'Switch list…',
        icon: I.swap(),
        open: anchor => openPicker(v, anchor, { title: `Switch "${l.name}" for…`, pick: (id, name) => swapList(v, l.id, id, name), align: 'end' })
      });
    }
    items.push({ label: 'Rename', icon: I.edit(), dialog: 'Rename' }, { label: 'Duplicate', icon: I.copy(), dialog: 'Duplicate' });
    if (v.key !== 'cur') {
      items.push(
        { label: 'Move up', icon: I.up(), disabled: at === 0, run: () => move(s.lists, at, at - 1) },
        { label: 'Move down', icon: I.down(), disabled: at === s.lists.length - 1, run: () => move(s.lists, at, at + 1) }
      );
    }
    items.push(
      { label: 'Remove from session', icon: I.unlink(), run: () => detachList(v, l.id) },
      { divider: true },
      { label: 'Delete', icon: I.trash(), danger: true, run: () => detachList(v, l.id, false) }
    );
    return items;
  };
  const sessionMenu = v => {
    const foldAll = to => () => v.state.lists.forEach(l => { l.collapsed = to; });
    return [
      { label: 'Add a task list', icon: I.plus(15), open: addPicker(v) },
      { label: 'Collapse all', icon: I.up(), run: foldAll(true) },
      { label: 'Expand all', icon: I.down(), run: foldAll(false) },
      { label: 'Open in Tasks', icon: I.external(), dialog: 'Open in Tasks' },
      { label: 'Edit session', icon: I.edit(), dialog: 'Edit session' }
    ];
  };
  const duplicateSession = (s, x) => s.sessions.splice(s.sessions.indexOf(x) + 1, 0, { ...x, id: `s${++uid}`, name: `${x.name} copy` });
  const deleteSession = (s, x) => {
    s.sessions.splice(s.sessions.indexOf(x), 1);
    if (s.active === x.id) s.active = (s.sessions[0] || {}).id;
  };
  const queueMenu = (v, x) => {
    const s = v.state;
    const at = s.sessions.indexOf(x);
    return [
      { label: 'Edit', icon: I.edit(), dialog: 'Edit session' },
      { label: 'Duplicate', icon: I.copy(), run: () => duplicateSession(s, x) },
      { label: 'Move up', icon: I.up(), disabled: at === 0, run: () => move(s.sessions, at, at - 1) },
      { label: 'Move down', icon: I.down(), disabled: at === s.sessions.length - 1, run: () => move(s.sessions, at, at + 1) },
      { divider: true },
      { label: 'Delete', icon: I.trash(), danger: true, run: () => deleteSession(s, x) }
    ];
  };

  // ── Shared pieces ──
  const cardHeader = (s, surface = '') => `
    <div class="card-header has-overline">
      <div class="card-header-top"><span class="overline">Session</span>
        <div class="card-header-actions"><button type="button" class="icon-btn ${surface}" data-act="session-menu" aria-haspopup="menu" aria-expanded="false" aria-label="Session actions" title="Session actions">${I.more()}</button></div>
      </div>
      <div class="card-header-main"><h2 class="card-title" title="${esc(s.session)}">${esc(s.session)}</h2></div>
    </div>`;
  const progress = (l, cls = '') => `<div class="progress-track ${cls}" role="progressbar" aria-label="${done(l)} of ${l.tasks.length} completed" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct(l)}" title="${done(l)} of ${l.tasks.length} completed"><div class="progress-fill" style="width: ${pct(l)}%;"></div></div>`;
  const badge = t => (t.done && t.time ? `<span class="task-time-badge" title="Time to complete">${esc(t.time)}</span>` : '');
  const sessionMeta = (s, x) => {
    const lists = x.id === s.active ? s.lists.length : 0;
    return `<span>${esc(x.meta)}</span>${lists ? `<span class="lab-meta-item" title="${plural(lists, 'task list', 'task lists')}">${I.list(13)} ${lists}</span>` : ''}${x.reward ? `<span class="lab-meta-item" title="Has a reward">${I.gift()}</span>` : ''}`;
  };
  const queueHeader = () => `<div class="panel-card-header"><span class="panel-card-title">Sessions</span><button type="button" class="btn-action tonal sm" data-act="add-session">${I.plus(15)}New session</button></div>`;
  const grip = (cls = '') => `<span class="drag-handle ${cls}" title="Drag to reorder">${I.grip()}</span>`;

  // ── Current: the app's own markup and classes ──
  const curTasks = v => {
    const s = v.state;
    const row = (l, t) => `
      <div class="task-row draggable-item ${t.done ? 'done' : ''}" draggable="true" data-drag="task" data-drop="task" data-list="${l.id}" data-id="${t.id}">
        ${grip()}
        <input type="checkbox" class="checkbox" data-list="${l.id}" data-task="${t.id}" aria-label="${esc(t.text)}" ${t.done ? 'checked' : ''}>
        <span class="task-text">${esc(t.text)}</span>${badge(t)}
        <button type="button" class="icon-btn sm on-3" data-act="task-menu" data-list="${l.id}" data-task="${t.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Task actions" title="Task actions">${I.more()}</button>
      </div>`;
    const panel = l => `
      <section class="list-panel draggable-item ${l.collapsed ? 'is-collapsed' : ''}" data-drop="list" data-id="${l.id}">
        ${grip('list-panel-grip')}
        <header class="list-panel-header drag-surface" draggable="true" data-drag="list" data-id="${l.id}">
          <div class="list-panel-title"><span class="overline">Task list</span>
            <div class="select select--header"><button type="button" class="select-trigger" data-act="swap-select" data-list="${l.id}" aria-haspopup="listbox" aria-expanded="false" aria-label="Choose a task list…">
              <span class="select-value">${esc(l.name)}</span><span class="select-value-addon"><span class="chip">${left(l)} left</span></span>
              <span class="select-chevron" aria-hidden="true">${I.down(18)}</span></button></div>
          </div>
          <button type="button" class="icon-btn on-2 list-panel-collapse" data-act="collapse" data-list="${l.id}" aria-label="${l.collapsed ? 'Expand list' : 'Collapse list'}" title="${l.collapsed ? 'Expand list' : 'Collapse list'}" aria-expanded="${!l.collapsed}">${I.down(18)}</button>
          <button type="button" class="icon-btn on-2" data-act="list-menu" data-list="${l.id}" aria-haspopup="menu" aria-expanded="false" aria-label="List actions" title="List actions">${I.more()}</button>
        </header>
        ${l.collapsed ? '' : `<div class="task-list-body">
          ${l.tasks.length ? `<div class="list-progress">${progress(l)}<div class="list-progress-row"><span>${done(l)} of ${l.tasks.length} completed</span><span>${pct(l)}%</span></div></div>` : ''}
          <form class="add-task-form" data-add data-list="${l.id}">
            <input type="text" class="form-input" placeholder="Add a task and press Enter…" autocomplete="off" aria-label="Add a task" value="${esc(l.draft || '')}">
            <button type="submit" class="btn-action primary" ${(l.draft || '').trim() ? '' : 'disabled'}>${I.plus(16)}Add</button>
          </form>
          <div class="task-list-items">${l.tasks.length ? l.tasks.map(t => row(l, t)).join('') : '<p class="lab-empty">No tasks yet.</p>'}</div>
        </div>`}
      </section>`;
    return `<div class="card session-tasks">${cardHeader(s)}
      <div class="list-panel-stack">${s.lists.map(panel).join('')}
        <button type="button" class="list-picker-trigger list-picker-trigger--add" data-act="add-list" data-align="start" aria-haspopup="dialog" aria-expanded="false">
          <span class="list-picker-trigger-icon">${I.plus(16)}</span><span class="list-picker-trigger-label">${s.lists.length ? 'Add another task list' : 'Add a task list'}</span>
          <span class="list-picker-trigger-chevron" aria-hidden="true">${I.down(16)}</span></button>
      </div></div>`;
  };
  const curQueue = v => {
    const s = v.state;
    const tool = (act, x, label, icon, on, danger = '') => `<button type="button" class="icon-btn xs ${danger} ${on}" data-act="${act}" data-id="${x.id}" aria-label="${label}" title="${label}">${icon}</button>`;
    return `<div class="card queue-panel">${queueHeader()}<div class="queue-list">${s.sessions.map(x => {
      const on = x.id === s.active;
      const surface = on ? 'on-accent-container' : 'on-3';
      return `<div class="queue-item draggable-item ${on ? 'active' : ''}" role="button" tabindex="0" aria-pressed="${on}" draggable="true" data-drag="session" data-drop="session" data-act="select-session" data-id="${x.id}">
        ${grip('queue-item-grip')}
        <div class="queue-item-name-row">${on ? I.equalizer() : ''}<span class="queue-item-name" title="${esc(x.name)}">${esc(x.name)}</span></div>
        <div class="queue-item-meta-row"><div class="queue-item-meta lab-meta">${sessionMeta(s, x)}</div>
          <div class="queue-item-actions">${tool('q-edit', x, 'Edit', I.edit(14), surface)}${tool('q-dup', x, 'Duplicate', I.copy(14), surface)}${tool('q-del', x, 'Delete', I.trash(14), surface, 'danger')}</div></div>
      </div>`;
    }).join('')}</div></div>`;
  };

  // ── Options A5 and A6: one markup. A row is: grip, lead slot, text, what trails, menu. ──
  const aTasks = v => {
    const s = v.state;
    const row = (l, t) => `
      <div class="la-row draggable-item ${t.done ? 'done' : ''}" draggable="true" data-drag="task" data-drop="task" data-list="${l.id}" data-id="${t.id}">
        ${grip('la-grip')}
        <input type="checkbox" class="checkbox lab-check" data-list="${l.id}" data-task="${t.id}" aria-label="${esc(t.text)}" ${t.done ? 'checked' : ''}>
        <span class="la-text">${esc(t.text)}</span>${badge(t)}
        <button type="button" class="icon-btn sm on-3 la-more" data-act="task-menu" data-list="${l.id}" data-task="${t.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Task actions" title="Task actions">${I.more()}</button>
      </div>`;
    const add = l => `
      <form class="la-add ${(l.draft || '').trim() ? 'has-text' : ''}" data-add data-list="${l.id}">
        <span class="la-add-icon" aria-hidden="true">${I.plus(16, 2.2)}</span>
        <input type="text" class="la-add-input" placeholder="Add a task" autocomplete="off" aria-label="Add a task to ${esc(l.name)}" value="${esc(l.draft || '')}">
        <button type="submit" class="btn-action tonal xs la-add-btn">Add</button>
      </form>`;
    const section = l => `
      <section class="la-list draggable-item ${l.collapsed ? 'is-collapsed' : ''}" data-drop="list" data-id="${l.id}">
        <header class="la-head" draggable="true" data-drag="list" data-id="${l.id}">
          ${grip('la-grip')}
          <div class="la-toggle" role="button" tabindex="0" data-act="collapse" data-list="${l.id}" aria-expanded="${!l.collapsed}" aria-label="${esc(l.name)}, ${done(l)} of ${l.tasks.length} done: ${l.collapsed ? 'expand' : 'collapse'}">
            <span class="la-caret" aria-hidden="true">${I.right(16)}</span><span class="la-name">${esc(l.name)}</span>
            <span class="la-count">${done(l)} of ${l.tasks.length}</span>
          </div>
          <button type="button" class="icon-btn sm on-2 la-more" data-act="list-menu" data-list="${l.id}" aria-haspopup="menu" aria-expanded="false" aria-label="List actions" title="List actions">${I.more()}</button>
        </header>
        ${l.collapsed ? '' : `${l.tasks.length ? progress(l, 'la-progress') : ''}
          <div class="la-rows">${l.tasks.map(t => row(l, t)).join('')}${add(l)}</div>`}
      </section>`;
    return `<div class="card la-card">
      <div class="la-cardhead">${cardHeader(s, 'on-2')}</div>
      <div class="la-cardbody"><div class="la-lists">${s.lists.map(section).join('')}
        <div><button type="button" class="btn-action" data-act="add-list" data-align="start" aria-haspopup="dialog" aria-expanded="false">${I.plus(16)}Add task list</button></div>
      </div></div></div>`;
  };
  const aQueue = v => {
    const s = v.state;
    return `<div class="card la-card">
      <div class="la-cardhead"><div class="panel-card-header"><span class="panel-card-title">Sessions</span></div></div>
      <div class="la-cardbody"><div class="la-rows la-rows--two">${s.sessions.map(x => {
        const on = x.id === s.active;
        return `<div class="la-row la-row--two draggable-item ${on ? 'is-active' : ''}" role="button" tabindex="0" aria-pressed="${on}" draggable="true" data-drag="session" data-drop="session" data-act="select-session" data-id="${x.id}">
          ${grip('la-grip')}
          <div class="la-main"><span class="la-title" title="${esc(x.name)}">${esc(x.name)}</span><span class="la-meta lab-meta">${sessionMeta(s, x)}</span></div>
          <button type="button" class="icon-btn sm ${on ? 'on-accent-container' : 'on-3'} la-more" data-act="queue-menu" data-id="${x.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Session actions" title="Session actions">${I.more()}</button>
        </div>`;
      }).join('')}</div>
      <div class="la-foot"><button type="button" class="btn-action" data-act="add-session">${I.plus(16)}New session</button></div></div></div>`;
  };

  // ── Wiring ──
  function wire(v) {
    const r = v.root;
    const s = () => v.state;
    r.addEventListener('change', e => {
      const c = e.target.closest('input[type="checkbox"][data-task]');
      if (!c) return;
      const t = findList(s(), c.dataset.list).tasks.find(x => x.id === c.dataset.task);
      t.done = c.checked;
      if (!t.done) delete t.time;
      v.fresh = t.done ? t.id : null;   // only the box just ticked plays the pop
      v.refocus = `input[data-task="${t.id}"]`;
      v.render();
    });
    r.addEventListener('input', e => {
      const input = e.target.closest('form[data-add] input');
      if (!input) return;
      const form = input.form;
      findList(s(), form.dataset.list).draft = input.value;
      const has = !!input.value.trim();
      form.classList.toggle('has-text', has);
      if (v.key === 'cur') form.querySelector('button[type="submit"]').disabled = !has;
    });
    r.addEventListener('submit', e => {
      const form = e.target.closest('form[data-add]');
      if (!form) return;
      e.preventDefault();
      const l = findList(s(), form.dataset.list);
      const text = (l.draft || '').trim();
      if (!text) return;
      l.tasks.push({ id: `t${++uid}`, text, done: false });
      l.draft = '';
      v.focus = l.id;   // stay in the field: the next task is one Enter away
      v.render();
    });
    r.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (el && r.contains(el)) act(v, el, e);
    });
    // Rows and headings that act like buttons (they aren't <button>s, so Firefox can drag them).
    r.addEventListener('keydown', e => {
      if ((e.key !== 'Enter' && e.key !== ' ') || !e.target.matches('[data-act]:not(button)')) return;
      e.preventDefault();
      e.target.click();
    });
    dragReorder(v);
  }
  function act(v, el, e) {
    const s = v.state;
    const d = el.dataset;
    const l = d.list ? findList(s, d.list) : null;
    const session = d.id ? s.sessions.find(x => x.id === d.id) : null;
    switch (d.act) {
      case 'collapse': l.collapsed = !l.collapsed; v.refocus = `[data-act="collapse"][data-list="${l.id}"]`; return v.render();
      case 'task-menu': return openMenu(v, el, taskMenu(v, l, l.tasks.find(t => t.id === d.task)));
      case 'list-menu': return openMenu(v, el, listMenu(v, l));
      case 'session-menu': return openMenu(v, el, sessionMenu(v));
      case 'add-list': return addPicker(v)(el);
      case 'swap-select': return openSelect(v, el, l);
      case 'select-session': s.active = session.id; v.refocus = `[data-act="select-session"][data-id="${session.id}"]`; return v.render();
      case 'add-session': s.sessions.push({ id: `s${++uid}`, name: `New session ${++s.made}`, meta: '25′ focus · 5′ break', reward: false }); return v.render();
      case 'queue-menu': e.stopPropagation(); return openMenu(v, el, queueMenu(v, session));
      case 'q-edit': e.stopPropagation(); return dialogNote('Edit session');
      case 'q-dup': e.stopPropagation(); duplicateSession(s, session); return v.render();
      case 'q-del': e.stopPropagation(); deleteSession(s, session); return v.render();
      default: return undefined;
    }
  }
  /** Drag to reorder: tasks within their list, lists within the session, sessions within the queue. */
  function dragReorder(v) {
    const r = v.root;
    let d = null;
    const target = e => {
      if (!d || !e.target.closest) return null;
      const t = e.target.closest(`[data-drop="${d.kind}"]`);
      return t && t.dataset.id !== d.id && (d.kind !== 'task' || t.dataset.list === d.list) ? t : null;
    };
    const clear = keep => r.querySelectorAll('.drag-over').forEach(n => n !== keep && n.classList.remove('drag-over'));
    r.addEventListener('dragstart', e => {
      const el = e.target.closest && e.target.closest('[data-drag]');
      if (!el) return;
      d = { kind: el.dataset.drag, id: el.dataset.id, list: el.dataset.list };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', d.id);
      const box = el.closest('.draggable-item') || el;
      requestAnimationFrame(() => box.classList.add('dragging'));
    });
    r.addEventListener('dragover', e => {
      const t = target(e);
      clear(t);
      if (!t) return;
      e.preventDefault();
      t.classList.add('drag-over');
    });
    r.addEventListener('drop', e => {
      const t = target(e);
      if (!t) return;
      e.preventDefault();
      const s = v.state;
      const arr = d.kind === 'task' ? findList(s, d.list).tasks : d.kind === 'list' ? s.lists : s.sessions;
      move(arr, arr.findIndex(x => x.id === d.id), arr.findIndex(x => x.id === t.dataset.id));
      d = null;
      v.render();
    });
    r.addEventListener('dragend', () => {
      d = null;
      clear(null);
      r.querySelectorAll('.dragging').forEach(n => n.classList.remove('dragging'));
    });
  }

  // ── Mount ──
  const variants = [['cur', curTasks, curQueue], ['a5', aTasks, aQueue], ['a6', aTasks, aQueue]].map(([key, renderTasks, renderQueue]) => {
    const root = document.querySelector(`[data-variant="${key}"]`);
    const v = { key, root, state: seed(), focus: null, refocus: null, fresh: null };
    v.render = () => {
      closePopover();
      root.querySelector('[data-slot="tasks"]').innerHTML = renderTasks(v);
      root.querySelector('[data-slot="queue"]').innerHTML = renderQueue(v);
      root.querySelector('[data-slot="picker"]').replaceChildren(inlinePicker(v));
      const el = v.focus ? root.querySelector(`form[data-list="${v.focus}"] input`) : v.refocus ? root.querySelector(v.refocus) : null;
      if (el) el.focus({ preventScroll: true });
      const ticked = v.fresh ? root.querySelector(`input[data-task="${v.fresh}"]`) : null;
      if (ticked) ticked.classList.add('is-fresh');
      v.focus = null;
      v.refocus = null;
      v.fresh = null;
    };
    wire(v);
    v.render();
    return v;
  });

  // ── Page tools ──
  const setTheme = theme => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.getElementById('themeDark').setAttribute('aria-pressed', String(theme === 'dark'));
    document.getElementById('themeLight').setAttribute('aria-pressed', String(theme === 'light'));
  };
  document.getElementById('themeDark').addEventListener('click', () => setTheme('dark'));
  document.getElementById('themeLight').addEventListener('click', () => setTheme('light'));
  document.getElementById('reset').addEventListener('click', () => variants.forEach(v => { v.state = seed(); v.render(); }));
})();
