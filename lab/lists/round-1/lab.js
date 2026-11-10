/* Component lab: lists. Plain script (no modules), so the page also opens from a double-click.
   Three columns render from the same data shape; each keeps its own copy. */
/* global document, window, setTimeout, clearTimeout, requestAnimationFrame */
(() => {
  'use strict';

  // ── Icons: the app's own set (components/ui/icons/AppIcons.tsx) ──
  const stroke = (inner, size = 18, width = 2) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  const I = {
    plus: (s = 16, w = 2.4) => stroke('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', s, w),
    check: (s = 15) => stroke('<polyline points="20 6 9 17 4 12"/>', s, 2.6),
    down: (s = 16) => stroke('<polyline points="6 9 12 15 18 9"/>', s, 2.2),
    up: (s = 16) => stroke('<polyline points="18 15 12 9 6 15"/>', s, 2.2),
    right: (s = 16) => stroke('<polyline points="9 18 15 12 9 6"/>', s, 2.2),
    left: (s = 16) => stroke('<polyline points="15 18 9 12 15 6"/>', s, 2.2),
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
  const seed = () => ({
    session: 'Pomodoro classic',
    lists: [
      { id: 'l1', name: 'Project tasks', collapsed: false, tasks: [
        { id: 't1', text: 'Review sprint deliverables', done: false },
        { id: 't2', text: 'Write feature documentation', done: false },
        { id: 't3', text: 'Test calendar and time tracking', done: false }
      ] },
      { id: 'l2', name: 'Errands', collapsed: false, tasks: [
        { id: 't4', text: 'Book the dentist', done: true, time: '4m' },
        { id: 't5', text: 'Renew the library card', done: false }
      ] }
    ],
    // Lists that exist but aren't in this session: what "add" and "switch" offer.
    library: [
      { id: 'l3', name: 'Reading', collapsed: false, tasks: [
        { id: 't6', text: 'Finish chapter 4', done: false },
        { id: 't7', text: 'Notes on the grid essay', done: false }
      ] },
      { id: 'l4', name: 'Weekly review', collapsed: false, tasks: [
        { id: 't8', text: 'Clear the inbox', done: false },
        { id: 't9', text: 'Plan next week', done: false },
        { id: 't10', text: 'Back up the laptop', done: false }
      ] }
    ],
    tab: 'l1',
    sessions: [
      { id: 's1', name: 'Pomodoro classic', meta: '25′ focus · 5′ break', reward: true },
      { id: 's2', name: 'Deep work', meta: '50′ focus · 10′ break', reward: true },
      { id: 's3', name: 'Quick sprint', meta: '15′ focus · 3′ break', reward: false }
    ],
    active: 's1',
    n: 100,
    made: 0
  });

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const findList = (s, id) => s.lists.find(l => l.id === id);
  const left = l => l.tasks.filter(t => !t.done).length;
  const done = l => l.tasks.length - left(l);
  const pct = l => (l.tasks.length ? Math.round((done(l) / l.tasks.length) * 100) : 0);
  const move = (arr, from, to) => { if (from < 0 || to < 0 || to >= arr.length) return; const [x] = arr.splice(from, 1); arr.splice(to, 0, x); };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

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

  // ── Popovers: the app's .popover, .menu and .select-menu styles ──
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
  function showPopover(el, anchor, align) {
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
    }
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    anchor.setAttribute('aria-expanded', 'true');
    const items = () => Array.from(el.querySelectorAll('button:not(:disabled)'));
    const out = e => { if (!el.contains(e.target) && !anchor.contains(e.target)) closePopover(); };
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); closePopover(); anchor.focus(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const list = items();
      const at = list.indexOf(document.activeElement);
      const next = e.key === 'ArrowDown' ? (at + 1) % list.length : (at - 1 + list.length) % list.length;
      list[next].focus();
    };
    document.addEventListener('pointerdown', out, true);
    document.addEventListener('keydown', key, true);
    window.addEventListener('resize', closePopover);
    pop = { el, anchor, out, key };
    const first = items()[0];
    if (first) first.focus({ preventScroll: true });
  }
  /** A menu under its anchor. An item runs, opens a second menu (`menu`), or names a dialog (`dialog`). */
  function openMenu(v, anchor, items, align = 'end') {
    const same = pop && pop.anchor === anchor;
    closePopover();
    if (same) return;
    const el = document.createElement('div');
    el.className = 'popover is-below menu';
    el.setAttribute('role', 'menu');
    el.innerHTML = items.map((it, i) => it.divider
      ? '<div class="menu-divider"></div>'
      : `<button type="button" role="menuitem" class="menu-item ${it.danger ? 'is-danger' : ''}" data-i="${i}" ${it.disabled ? 'disabled' : ''}>` +
        `<span class="menu-item-icon">${it.icon || ''}</span><span class="menu-item-label">${esc(it.label)}</span>` +
        `${it.hint ? `<span class="menu-item-hint">${esc(it.hint)}</span>` : ''}</button>`).join('');
    el.addEventListener('click', e => {
      const b = e.target.closest('.menu-item');
      if (!b) return;
      const it = items[Number(b.dataset.i)];
      closePopover();
      if (it.menu) return openMenu(v, anchor, it.menu(), align);
      if (it.dialog) return dialogNote(it.dialog);
      it.run();
      v.render();
    });
    showPopover(el, anchor, align);
  }
  /** Current only: the header's select, listing every list. */
  function openSelect(v, anchor, l) {
    const same = pop && pop.anchor === anchor;
    closePopover();
    if (same) return;
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

  // ── Actions on a column's data ──
  function takeFromLibrary(s, id) {
    if (id === 'new') return { id: `l${s.n++}`, name: `New list ${++s.made}`, collapsed: false, tasks: [] };
    return s.library.splice(s.library.findIndex(l => l.id === id), 1)[0];
  }
  function attachList(v, id) {
    const s = v.state;
    const l = takeFromLibrary(s, id);
    l.collapsed = false;
    s.lists.push(l);
    s.tab = l.id;
    v.focus = l.id;
  }
  function detachList(v, id, keep = true) {
    const s = v.state;
    const at = s.lists.findIndex(l => l.id === id);
    const [l] = s.lists.splice(at, 1);
    if (keep) s.library.push(l);
    if (s.tab === id) s.tab = (s.lists[Math.min(at, s.lists.length - 1)] || {}).id;
  }
  function swapList(v, id, withId) {
    const s = v.state;
    const at = s.lists.findIndex(l => l.id === id);
    const incoming = takeFromLibrary(s, withId);
    s.library.push(s.lists[at]);
    s.lists[at] = incoming;
    if (s.tab === id) s.tab = incoming.id;
  }

  // ── Menus ──
  const taskMenu = (v, l, t) => {
    const at = l.tasks.indexOf(t);
    const items = [
      t.done
        ? { label: 'Mark as not done', icon: I.reset(), run: () => { t.done = false; delete t.time; } }
        : { label: 'Mark as complete', icon: I.check(), run: () => { t.done = true; } },
      { label: 'Rename', icon: I.edit(), dialog: 'Rename' },
      { label: 'Duplicate', icon: I.copy(), run: () => l.tasks.splice(at + 1, 0, { ...t, id: `t${v.state.n++}` }) }
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
  const pickerMenu = (v, pick) => [
    ...(v.state.library.length
      ? v.state.library.map(x => ({ label: x.name, icon: I.list(), hint: `${left(x)} left`, run: () => pick(x.id) }))
      : [{ label: 'No other lists', disabled: true }]),
    { divider: true },
    { label: 'New task list', icon: I.plus(15), run: () => pick('new') }
  ];
  const listMenu = (v, l) => {
    const s = v.state;
    const at = s.lists.indexOf(l);
    const items = [];
    if (v.key === 'cur') {
      items.push({ label: 'New task', icon: I.plus(15), run: () => { l.collapsed = false; v.focus = l.id; } });
    } else {
      items.push({ label: 'Switch list…', icon: I.swap(), menu: () => pickerMenu(v, id => swapList(v, l.id, id)) });
    }
    items.push({ label: 'Rename', icon: I.edit(), dialog: 'Rename' }, { label: 'Duplicate', icon: I.copy(), dialog: 'Duplicate' });
    if (v.key === 'a') {
      items.push(
        { label: 'Move up', icon: I.up(), disabled: at === 0, run: () => move(s.lists, at, at - 1) },
        { label: 'Move down', icon: I.down(), disabled: at === s.lists.length - 1, run: () => move(s.lists, at, at + 1) }
      );
    }
    if (v.key === 'b') {
      items.push(
        { label: 'Move left', icon: I.left(), disabled: at === 0, run: () => move(s.lists, at, at - 1) },
        { label: 'Move right', icon: I.right(), disabled: at === s.lists.length - 1, run: () => move(s.lists, at, at + 1) }
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
    const s = v.state;
    const fold = to => () => s.lists.forEach(l => { l.collapsed = to; });
    const items = [];
    // Tabs need none of these three: the plus adds a list and nothing folds.
    if (v.key !== 'b') {
      items.push(
        { label: 'Add a task list', icon: I.plus(15), menu: () => pickerMenu(v, id => attachList(v, id)) },
        { label: 'Collapse all', icon: I.up(), run: fold(true) },
        { label: 'Expand all', icon: I.down(), run: fold(false) }
      );
    }
    items.push({ label: 'Open in Tasks', icon: I.external(), dialog: 'Open in Tasks' }, { label: 'Edit session', icon: I.edit(), dialog: 'Edit session' });
    return items;
  };
  const duplicateSession = (s, x) => s.sessions.splice(s.sessions.indexOf(x) + 1, 0, { ...x, id: `s${s.n++}`, name: `${x.name} copy` });
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
  const cardHeader = (s, extra = '') => `
    <div class="card-header has-overline">
      <div class="card-header-top"><span class="overline">Session</span>
        <div class="card-header-actions">${extra}<button type="button" class="icon-btn" data-act="session-menu" aria-haspopup="menu" aria-expanded="false" aria-label="Session actions" title="Session actions">${I.more()}</button></div>
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

  // ── Current: the app's own markup and classes ──
  const curTasks = v => {
    const s = v.state;
    const row = (l, t) => `
      <div class="task-row draggable-item ${t.done ? 'done' : ''}" draggable="true" data-drag="task" data-drop="task" data-list="${l.id}" data-id="${t.id}">
        <span class="drag-handle" title="Drag to reorder">${I.grip()}</span>
        <input type="checkbox" class="checkbox" data-list="${l.id}" data-task="${t.id}" aria-label="${esc(t.text)}" ${t.done ? 'checked' : ''}>
        <span class="task-text">${esc(t.text)}</span>${badge(t)}
        <button type="button" class="icon-btn sm on-3" data-act="task-menu" data-list="${l.id}" data-task="${t.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Task actions" title="Task actions">${I.more()}</button>
      </div>`;
    const panel = l => `
      <section class="list-panel draggable-item ${l.collapsed ? 'is-collapsed' : ''}" data-drop="list" data-id="${l.id}">
        <span class="drag-handle list-panel-grip" title="Drag to reorder">${I.grip()}</span>
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
        <button type="button" class="list-picker-trigger list-picker-trigger--add" data-act="add-list" data-align="start" aria-haspopup="menu" aria-expanded="false">
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
        <span class="drag-handle queue-item-grip" title="Drag to reorder">${I.grip()}</span>
        <div class="queue-item-name-row">${on ? I.equalizer() : ''}<span class="queue-item-name" title="${esc(x.name)}">${esc(x.name)}</span></div>
        <div class="queue-item-meta-row"><div class="queue-item-meta lab-meta">${sessionMeta(s, x)}</div>
          <div class="queue-item-actions">${tool('q-edit', x, 'Edit', I.edit(14), surface)}${tool('q-dup', x, 'Duplicate', I.copy(14), surface)}${tool('q-del', x, 'Delete', I.trash(14), surface, 'danger')}</div></div>
      </div>`;
    }).join('')}</div></div>`;
  };

  // ── One row for both options: a lead slot, the text, then what trails ──
  const taskRow = (p, l, t, tonal) => `
    <div class="${p}-row draggable-item ${t.done ? 'done' : ''}" draggable="true" data-drag="task" data-drop="task" data-list="${l.id}" data-id="${t.id}">
      ${p === 'lb' ? `<span class="drag-handle ${p}-grip" title="Drag to reorder">${I.grip()}</span>` : ''}
      <input type="checkbox" class="checkbox lab-check ${tonal ? 'lab-check--tonal' : ''}" data-list="${l.id}" data-task="${t.id}" aria-label="${esc(t.text)}" ${t.done ? 'checked' : ''}>
      <span class="${p}-text">${esc(t.text)}</span>${badge(t)}
      ${p === 'la' ? `<span class="drag-handle ${p}-grip" title="Drag to reorder">${I.grip()}</span>` : ''}
      <button type="button" class="icon-btn sm on-3 ${p}-more" data-act="task-menu" data-list="${l.id}" data-task="${t.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Task actions" title="Task actions">${I.more()}</button>
    </div>`;
  const addRow = (p, l) => `
    <form class="${p}-add ${(l.draft || '').trim() ? 'has-text' : ''}" data-add data-list="${l.id}">
      <span class="${p}-add-icon" aria-hidden="true">${I.plus(16, 2.2)}</span>
      <input type="text" class="${p}-add-input" placeholder="Add a task" autocomplete="off" aria-label="Add a task to ${esc(l.name)}" value="${esc(l.draft || '')}">
      <button type="submit" class="btn-action tonal xs ${p}-add-btn">Add</button>
    </form>`;
  const sessionRow = (p, s, x) => {
    const on = x.id === s.active;
    return `<div class="${p}-row ${p}-row--two draggable-item ${on ? 'is-active' : ''}" role="button" tabindex="0" aria-pressed="${on}" draggable="true" data-drag="session" data-drop="session" data-act="select-session" data-id="${x.id}">
      ${p === 'lb' ? `<span class="drag-handle ${p}-grip" title="Drag to reorder">${I.grip()}</span>` : ''}
      <div class="${p}-main"><span class="${p}-title" title="${esc(x.name)}">${esc(x.name)}</span><span class="${p}-meta lab-meta">${sessionMeta(s, x)}</span></div>
      ${p === 'la' && on ? `<span class="la-playing" title="Selected">${I.equalizer()}</span>` : ''}
      ${p === 'la' ? `<span class="drag-handle la-grip" title="Drag to reorder">${I.grip()}</span>` : ''}
      <span class="${p}-trail">${p === 'lb' && on ? `<span class="lb-playing" title="Selected">${I.equalizer()}</span>` : ''}<button type="button" class="icon-btn sm ${on ? 'on-accent-container' : 'on-3'} ${p}-more" data-act="queue-menu" data-id="${x.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Session actions" title="Session actions">${I.more()}</button></span>
    </div>`;
  };

  // ── Option A: stacked lists that fold ──
  const aTasks = v => {
    const s = v.state;
    const list = l => `
      <section class="la-list draggable-item ${l.collapsed ? 'is-collapsed' : ''}" data-drop="list" data-id="${l.id}">
        <header class="la-head" draggable="true" data-drag="list" data-id="${l.id}">
          <div class="la-toggle" role="button" tabindex="0" data-act="collapse" data-list="${l.id}" aria-expanded="${!l.collapsed}" aria-label="${esc(l.name)}: ${l.collapsed ? 'expand' : 'collapse'}">
            <span class="la-caret" aria-hidden="true">${I.right(16)}</span><span class="la-name">${esc(l.name)}</span>
          </div>
          <span class="la-count">${done(l)} of ${l.tasks.length}</span>
          <span class="drag-handle la-grip" title="Drag to reorder">${I.grip()}</span>
          <button type="button" class="icon-btn sm on-0 la-more" data-act="list-menu" data-list="${l.id}" aria-haspopup="menu" aria-expanded="false" aria-label="List actions" title="List actions">${I.more()}</button>
        </header>
        ${l.collapsed ? '' : `${l.tasks.length ? progress(l, 'la-progress') : ''}
          <div class="la-rows">${l.tasks.map(t => taskRow('la', l, t, false)).join('')}${addRow('la', l)}</div>`}
      </section>`;
    return `<div class="card">${cardHeader(s)}
      <div class="la-lists">${s.lists.map(list).join('')}
        <div><button type="button" class="btn-action" data-act="add-list" data-align="start" aria-haspopup="menu" aria-expanded="false">${I.plus(16)}Add task list</button></div>
      </div></div>`;
  };
  const aQueue = v => `<div class="card">${queueHeader()}<div class="la-rows">${v.state.sessions.map(x => sessionRow('la', v.state, x)).join('')}</div></div>`;

  // ── Option B: lists as tabs, flat rows ──
  const bTasks = v => {
    const s = v.state;
    const l = findList(s, s.tab) || s.lists[0];
    if (!l) {
      return `<div class="card">${cardHeader(s)}<div class="lb-none"><p>No task list in this session yet.</p>
        <button type="button" class="btn-action tonal" data-act="add-list" data-align="start" aria-haspopup="menu" aria-expanded="false">${I.plus(16)}Add task list</button></div></div>`;
    }
    const tab = x => {
      const on = x.id === l.id;
      const n = left(x);
      return `<div class="lb-tab ${on ? 'is-active' : ''}" role="tab" tabindex="0" aria-selected="${on}" draggable="true" data-drag="list" data-drop="list" data-act="tab" data-list="${x.id}" data-id="${x.id}">
        <span class="lb-tab-name">${esc(x.name)}</span>
        <span class="lb-tab-count" title="${x.tasks.length && !n ? 'All done' : plural(n, 'task left', 'tasks left')}">${x.tasks.length && !n ? I.check(13) : n}</span></div>`;
    };
    return `<div class="card">${cardHeader(s)}
      <div class="lb-bar">
        <div class="lb-tabs" role="tablist" aria-label="Task lists in this session">${s.lists.map(tab).join('')}
          <button type="button" class="icon-btn sm lb-tab-add" data-act="add-list" data-align="start" aria-haspopup="menu" aria-expanded="false" aria-label="Add task list" title="Add task list">${I.plus(16, 2.2)}</button>
        </div>
        <button type="button" class="icon-btn sm" data-act="list-menu" data-list="${l.id}" aria-haspopup="menu" aria-expanded="false" aria-label="${esc(l.name)}: list actions" title="List actions">${I.more()}</button>
      </div>
      ${progress(l, 'lb-progress')}
      <div class="lb-rows" role="tabpanel" aria-label="${esc(l.name)}">${l.tasks.map(t => taskRow('lb', l, t, true)).join('')}${addRow('lb', l)}</div>
    </div>`;
  };
  const bQueue = v => `<div class="card">${queueHeader()}<div class="lb-rows">${v.state.sessions.map(x => sessionRow('lb', v.state, x)).join('')}</div></div>`;

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
      l.tasks.push({ id: `t${s().n++}`, text, done: false });
      l.draft = '';
      v.focus = l.id;   // stay in the field: the next task is one Enter away
      v.render();
    });
    r.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (el && r.contains(el)) act(v, el, e);
    });
    // Rows and tabs that act like buttons (they aren't <button>s, so Firefox can drag them).
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
      case 'tab': s.tab = l.id; v.refocus = `[data-act="tab"][data-list="${l.id}"]`; return v.render();
      case 'task-menu': return openMenu(v, el, taskMenu(v, l, l.tasks.find(t => t.id === d.task)));
      case 'list-menu': return openMenu(v, el, listMenu(v, l));
      case 'session-menu': return openMenu(v, el, sessionMenu(v));
      case 'add-list': return openMenu(v, el, pickerMenu(v, id => attachList(v, id)), d.align || 'end');
      case 'swap-select': return openSelect(v, el, l);
      case 'select-session': s.active = session.id; return v.render();
      case 'add-session': s.sessions.push({ id: `s${s.n++}`, name: `New session ${++s.made}`, meta: '25′ focus · 5′ break', reward: false }); return v.render();
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
  const variants = [['cur', curTasks, curQueue], ['a', aTasks, aQueue], ['b', bTasks, bQueue]].map(([key, tasks, queue]) => {
    const root = document.querySelector(`[data-variant="${key}"]`);
    const v = { key, root, state: seed(), focus: null, refocus: null, fresh: null };
    v.render = () => {
      closePopover();
      root.querySelector('[data-slot="tasks"]').innerHTML = tasks(v);
      root.querySelector('[data-slot="queue"]').innerHTML = queue(v);
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
