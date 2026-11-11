/* Component lab: goal card, round 1. Plain script (no modules), so the page also opens from a
   double-click. Three columns (Current, B1, B2) render from the same data shape; each keeps its
   own copy. Current uses GoalCard's markup and classes as of 1.4 (8ff66a3). */
/* global document, window, setTimeout, clearTimeout */
(() => {
  'use strict';

  // ── Icons: the app's own set (components/ui/icons/AppIcons.tsx) ──
  const stroke = (inner, size = 18, width = 2) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  const I = {
    plus: (s = 16, w = 2.4) => stroke('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', s, w),
    check: (s = 15, w = 2.6) => stroke('<polyline points="20 6 9 17 4 12"/>', s, w),
    reset: (s = 15) => stroke('<path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 3 3 9 9 9"/>', s),
    edit: (s = 15) => stroke('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>', s),
    copy: (s = 15) => stroke('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>', s),
    trash: (s = 15) => stroke('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', s),
    up: (s = 15) => stroke('<polyline points="18 15 12 9 6 15"/>', s, 2.2),
    down: (s = 15) => stroke('<polyline points="6 9 12 15 18 9"/>', s, 2.2),
    flag: (s = 15) => stroke('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>', s),
    note: (s = 15) => stroke('<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/>', s),
    calendar: (s = 12) => stroke('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>', s),
    more: (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>`
  };

  // ── Dates, relative to today, as the app's ScheduleBadge shows them ──
  const DAY = 864e5;
  const iso = offset => new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);
  const short = d => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const daysTo = d => Math.round((new Date(`${d}T12:00:00`) - new Date(`${iso(0)}T12:00:00`)) / DAY);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  function schedule(start, due, completed, compact) {
    if (!start && !due) return '';
    const range = start && due ? `${short(start)} → ${short(due)}` : due ? `Due ${short(due)}` : `Starts ${short(start)}`;
    let status = '';
    let tone = 'neutral';
    if (completed) tone = 'done';
    else if (start && daysTo(start) > 0) status = `Starts in ${plural(daysTo(start), 'day', 'days')}`;
    else if (due) {
      const d = daysTo(due);
      if (d > 0) status = `${plural(d, 'day', 'days')} left`;
      else if (d === 0) { status = 'Due today'; tone = 'warn'; }
      else { status = `Overdue ${plural(-d, 'day', 'days')}`; tone = 'warn'; }
    }
    return `<span class="schedule-badge tone-${tone} ${compact ? 'is-compact' : ''}">${I.calendar(compact ? 12 : 14)}` +
      `<span class="schedule-badge-range">${range}</span>${status ? `<span class="schedule-badge-status">${status}</span>` : ''}</span>`;
  }

  // ── Data ──
  let uid = 0;
  const lm = (name, extra = {}) => ({ id: `m${++uid}`, name, completed: false, ...extra });
  const seed = () => ({
    made: 0,
    goals: [
      {
        id: 'g1', name: 'Complete 4 focus sessions', period: 'Daily', reward: '🌿 Walk in the park',
        start: iso(-2), due: iso(5), description: '', completed: false,
        landmarks: [
          lm('Finish 1st morning session', { completed: true }),
          lm('Finish 2nd afternoon session', { due: iso(1) }),
          lm('Review the week’s notes', { reward: '☕ Coffee break' })
        ]
      },
      {
        id: 'g2', name: 'Clear 10 tasks this week', period: 'Weekly', reward: '', start: '', due: '',
        description: 'Inbox zero for the work list first, then the errands.', completed: false, landmarks: []
      },
      {
        id: 'g3', name: 'Read two chapters of the grid systems book and take notes', period: 'Monthly', reward: '',
        start: '', due: iso(12), description: '', completed: false,
        landmarks: [lm('Chapter 3: the module', { completed: true }), lm('Chapter 4: the baseline', { completed: true })]
      }
    ]
  });

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const done = g => g.landmarks.filter(l => l.completed).length;
  const pct = g => (g.landmarks.length ? Math.round((done(g) / g.landmarks.length) * 100) : (g.completed ? 100 : 0));
  const isDone = g => pct(g) === 100;
  const move = (arr, from, to) => { if (to < 0 || to >= arr.length) return; const [x] = arr.splice(from, 1); arr.splice(to, 0, x); };

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

  // ── Menus: the app's .popover and .menu ──
  let pop = null;
  function closePopover() {
    if (!pop) return;
    pop.el.remove();
    pop.anchor.setAttribute('aria-expanded', 'false');
    pop.anchor.classList.remove('is-active');
    document.removeEventListener('pointerdown', pop.out, true);
    document.removeEventListener('keydown', pop.key, true);
    window.removeEventListener('resize', closePopover);
    pop = null;
  }
  function openMenu(v, anchor, items) {
    const same = pop && pop.anchor === anchor;
    closePopover();
    if (same) return;
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
      if (it.dialog) return dialogNote(it.dialog);
      it.run();
      v.render();
      return undefined;
    });
    document.body.appendChild(el);
    const a = anchor.getBoundingClientRect();
    const x = Math.max(8, Math.min(a.right - el.offsetWidth, window.innerWidth - el.offsetWidth - 8));
    let y = a.bottom + 4;
    if (y + el.offsetHeight > window.innerHeight - 8) { y = a.top - el.offsetHeight - 4; el.classList.replace('is-below', 'is-above'); }
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    anchor.setAttribute('aria-expanded', 'true');
    anchor.classList.add('is-active');
    const all = () => Array.from(el.querySelectorAll('button:not(:disabled)'));
    const out = e => { if (!el.contains(e.target) && !anchor.contains(e.target)) closePopover(); };
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); closePopover(); anchor.focus(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const list = all();
      const at = list.indexOf(document.activeElement);
      list[e.key === 'ArrowDown' ? (at + 1) % list.length : (at - 1 + list.length) % list.length].focus();
    };
    document.addEventListener('pointerdown', out, true);
    document.addEventListener('keydown', key, true);
    window.addEventListener('resize', closePopover);
    pop = { el, anchor, out, key };
    const first = all()[0];
    if (first) first.focus({ preventScroll: true });
  }

  // ── Menus' items ──
  const goalMenu = (v, g) => {
    const items = [{ label: 'Edit goal', icon: I.edit(), dialog: 'Edit goal' }];
    if (v.key === 'cur') items.push({ label: 'Add landmark', icon: I.flag(), dialog: 'Add landmark' });
    else if (!g.description && !g.writing) items.push({ label: 'Add a description', icon: I.note(), run: () => { g.writing = true; v.focus = `textarea[data-goal="${g.id}"]`; } });
    if (!g.landmarks.length) {
      items.push(g.completed
        ? { label: 'Mark as not done', icon: I.reset(), run: () => { g.completed = false; } }
        : { label: 'Mark as complete', icon: I.check(), run: () => { g.completed = true; } });
    }
    items.push(
      { label: 'Duplicate', icon: I.copy(), run: () => { const s = v.state; s.goals.splice(s.goals.indexOf(g) + 1, 0, { ...g, id: `g${++uid}`, name: `${g.name} (Copy)`, landmarks: g.landmarks.map(l => ({ ...l, id: `m${++uid}` })) }); } },
      { divider: true },
      { label: 'Delete', icon: I.trash(), danger: true, run: () => v.state.goals.splice(v.state.goals.indexOf(g), 1) }
    );
    return items;
  };
  const landmarkMenu = (g, l) => {
    const at = g.landmarks.indexOf(l);
    return [
      l.completed
        ? { label: 'Mark as not done', icon: I.reset(), run: () => { l.completed = false; } }
        : { label: 'Mark as complete', icon: I.check(), run: () => { l.completed = true; } },
      { label: 'Edit', icon: I.edit(), dialog: 'Edit landmark (name, dates, reward)' },
      { label: 'Duplicate', icon: I.copy(), run: () => g.landmarks.splice(at + 1, 0, { ...l, id: `m${++uid}` }) },
      { label: 'Move up', icon: I.up(), disabled: at === 0, run: () => move(g.landmarks, at, at - 1) },
      { label: 'Move down', icon: I.down(), disabled: at === g.landmarks.length - 1, run: () => move(g.landmarks, at, at + 1) },
      { divider: true },
      { label: 'Delete', icon: I.trash(), danger: true, run: () => g.landmarks.splice(at, 1) }
    ];
  };

  // ── Current: GoalCard's markup and classes ──
  const curCard = g => {
    const has = g.landmarks.length > 0;
    const complete = isDone(g);
    const label = `${done(g)} of ${g.landmarks.length} landmarks`;
    const rows = g.landmarks.map(l => `
      <div class="landmark-item ${l.completed ? 'landmark-done' : ''}" data-goal="${g.id}" data-lm="${l.id}">
        <input type="checkbox" class="checkbox" data-goal="${g.id}" data-lm="${l.id}" aria-label="${esc(l.name)}" ${l.completed ? 'checked' : ''}>
        <span class="landmark-text">${esc(l.name)}</span>
        ${schedule(l.start, l.due, l.completed, true)}
        ${l.reward ? `<span class="landmark-reward-tag">${esc(l.reward)}</span>` : ''}
        <div class="landmark-actions">
          <button type="button" class="icon-btn xs on-2" data-act="dialog" data-what="Edit landmark" aria-label="Edit" title="Edit">${I.edit(12)}</button>
          <button type="button" class="icon-btn xs on-2" data-act="lm-dup" data-goal="${g.id}" data-lm="${l.id}" aria-label="Duplicate" title="Duplicate">${I.copy(12)}</button>
          <button type="button" class="icon-btn xs danger on-2" data-act="lm-del" data-goal="${g.id}" data-lm="${l.id}" aria-label="Delete" title="Delete">${I.trash(12)}</button>
        </div>
      </div>`).join('');
    return `
      <div class="goal-card">
        <div class="goal-card-body">
          <div class="goal-card-header">
            <div class="goal-card-top"><span class="overline">${g.period}</span>
              <button type="button" class="icon-btn on-2" data-act="goal-menu" data-goal="${g.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Goal actions" title="Goal actions">${I.more()}</button></div>
            <div class="goal-card-title">${esc(g.name)}</div>
            ${g.reward ? `<div class="goal-card-meta"><span class="goal-reward-badge">${esc(g.reward)}</span></div>` : ''}
            ${schedule(g.start, g.due, complete, false)}
          </div>
          <textarea class="inline-textarea goal-description" rows="1" data-desc="${g.id}" placeholder="Write a description" aria-label="Description">${esc(g.description)}</textarea>
          ${has ? `<div class="goal-card-progress"><div class="goal-progress-row"><span>${label}</span><span>${pct(g)}%</span></div>
            <div class="progress-track lg" role="progressbar" aria-label="${label}" aria-valuenow="${pct(g)}"><div class="progress-fill ${complete ? 'is-complete' : ''}" style="width: ${pct(g)}%;"></div></div></div>` : ''}
          ${has ? `<div class="goal-landmarks"><div class="landmarks-title">Landmarks</div>${rows}</div>` : ''}
          <div class="goal-card-footer">
            <button type="button" class="btn-action sm" data-act="dialog" data-what="Add landmark">${I.plus(14)}Landmark</button>
            <span class="goal-saved" role="status"></span>
            <button type="button" class="btn-action tonal sm goal-complete-btn" data-act="${has ? 'nothing' : 'complete'}" data-goal="${g.id}" aria-pressed="${complete}" ${has ? 'aria-disabled="true" title="Completes when every landmark is done"' : ''}>${I.check(14)}${complete ? 'Done' : 'Complete'}</button>
          </div>
        </div>
      </div>`;
  };

  // ── The options: the app's band, task rows and add row ──
  const optCard = (v, g) => {
    const has = g.landmarks.length > 0;
    const complete = isDone(g);
    const count = `${done(g)} of ${g.landmarks.length}`;
    const bar = cls => `<div class="progress-track ${cls}" role="progressbar" aria-label="${count} landmarks done" aria-valuenow="${pct(g)}"><div class="progress-fill ${complete ? 'is-complete' : ''}" style="width: ${pct(g)}%;"></div></div>`;
    const chips = [
      complete ? `<span class="gb-done">${I.check(13)}Done</span>` : '',
      g.reward ? `<span class="chip">${esc(g.reward)}</span>` : '',
      schedule(g.start, g.due, complete, true)
    ].join('');
    const rows = g.landmarks.map(l => `
      <div class="task-row ${l.completed ? 'done' : ''}" data-goal="${g.id}" data-lm="${l.id}">
        <input type="checkbox" class="checkbox" data-goal="${g.id}" data-lm="${l.id}" aria-label="${esc(l.name)}" ${l.completed ? 'checked' : ''}>
        <span class="task-text">${esc(l.name)}</span>
        ${l.due || l.start || l.reward ? `<span class="gb-row-meta">${schedule(l.start, l.due, l.completed, true)}${l.reward ? `<span class="chip">${esc(l.reward)}</span>` : ''}</span>` : ''}
        <button type="button" class="icon-btn sm on-3 is-quiet" data-act="lm-menu" data-goal="${g.id}" data-lm="${l.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Landmark actions" title="Landmark actions">${I.more()}</button>
      </div>`).join('');
    const add = `
      <form class="add-task-row ${(g.draft || '').trim() ? 'has-text' : ''}" data-add="${g.id}">
        <span class="add-task-icon" aria-hidden="true">${I.plus(16, 2.2)}</span>
        <input type="text" class="form-input add-task-input" placeholder="Add a landmark" autocomplete="off" aria-label="Add a landmark to ${esc(g.name)}" value="${esc(g.draft || '')}">
        <button type="submit" class="btn-action tonal xs add-task-btn">Add</button>
      </form>`;
    const showDesc = g.description || g.writing;
    return `
      <div class="card gb-card">
        <div class="card-header has-overline">
          <div class="card-header-top"><span class="overline card-overline">${g.period}</span>
            ${v.key === 'b2' && has ? `<span class="card-header-count">${count}</span>` : ''}
            <div class="card-header-actions"><button type="button" class="icon-btn on-2" data-act="goal-menu" data-goal="${g.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Goal actions" title="Goal actions">${I.more()}</button></div>
          </div>
          <div class="card-header-main">
            <h2 class="card-title">${esc(g.name)}</h2>
            ${chips ? `<div class="card-subtitle-row">${chips}</div>` : ''}
            ${v.key === 'b2' && has ? bar('gb-band-bar') : ''}
          </div>
        </div>
        <div class="gb-body">
          ${showDesc ? `<textarea class="inline-textarea gb-desc" rows="1" data-desc="${g.id}" data-goal="${g.id}" placeholder="Write a description" aria-label="Description">${esc(g.description)}</textarea>` : ''}
          ${v.key === 'b1' && has ? `<div class="gb-list"><div class="gb-head"><span class="gb-head-name">Landmarks</span><span class="gb-count">${count}</span></div>${bar('')}
            <div class="task-list-items">${rows}${add}</div></div>` : `<div class="task-list-items">${rows}${add}</div>`}
          ${!has && !complete ? `<div class="gb-foot"><button type="button" class="btn-action tonal" data-act="complete" data-goal="${g.id}">${I.check(16)}Complete goal</button></div>` : ''}
        </div>
      </div>`;
  };

  // ── Wiring ──
  function wire(v) {
    const r = v.root;
    const goal = id => v.state.goals.find(g => g.id === id);
    const landmark = (g, id) => g.landmarks.find(l => l.id === id);
    r.addEventListener('change', e => {
      const c = e.target.closest('input[type="checkbox"][data-lm]');
      if (!c) return;
      const g = goal(c.dataset.goal);
      landmark(g, c.dataset.lm).completed = c.checked;
      v.fresh = c.checked ? c.dataset.lm : null;
      v.refocus = `input[data-lm="${c.dataset.lm}"]`;
      v.render();
    });
    r.addEventListener('input', e => {
      const input = e.target.closest('form[data-add] input');
      if (input) {
        goal(input.form.dataset.add).draft = input.value;
        input.form.classList.toggle('has-text', !!input.value.trim());
      }
      // Descriptions grow with their text, as the app's InlineTextArea does.
      const ta = e.target.closest('textarea[data-desc]');
      if (ta) { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight}px`; }
    });
    // A description saves when it loses focus; an empty one goes away.
    r.addEventListener('focusout', e => {
      const ta = e.target.closest('textarea[data-desc]');
      if (!ta) return;
      const g = goal(ta.dataset.desc);
      g.description = ta.value.trim();
      if (g.writing) { g.writing = false; v.render(); }
    });
    r.addEventListener('submit', e => {
      const form = e.target.closest('form[data-add]');
      if (!form) return;
      e.preventDefault();
      const g = goal(form.dataset.add);
      const text = (g.draft || '').trim();
      if (!text) return;
      g.landmarks.push(lm(text));
      g.completed = false;
      g.draft = '';
      v.focus = `form[data-add="${g.id}"] input`;   // the next landmark is one Enter away
      v.render();
    });
    r.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (!el || !r.contains(el)) return;
      const d = el.dataset;
      const g = d.goal ? goal(d.goal) : null;
      switch (d.act) {
        case 'goal-menu': return openMenu(v, el, goalMenu(v, g));
        case 'lm-menu': return openMenu(v, el, landmarkMenu(g, landmark(g, d.lm)));
        case 'lm-dup': { const l = landmark(g, d.lm); g.landmarks.splice(g.landmarks.indexOf(l) + 1, 0, { ...l, id: `m${++uid}` }); return v.render(); }
        case 'lm-del': g.landmarks.splice(g.landmarks.indexOf(landmark(g, d.lm)), 1); return v.render();
        case 'complete': g.completed = !g.completed; return v.render();
        case 'dialog': return dialogNote(d.what);
        default: return undefined;
      }
    });
  }

  // ── Mount ──
  const variants = ['cur', 'b1', 'b2'].map(key => {
    const root = document.querySelector(`[data-variant="${key}"]`);
    const v = { key, root, state: seed(), focus: null, refocus: null, fresh: null };
    v.render = () => {
      closePopover();
      root.querySelector('[data-slot="cards"]').innerHTML = v.state.goals.map(g => (key === 'cur' ? curCard(g) : optCard(v, g))).join('');
      root.querySelectorAll('textarea[data-desc]').forEach(ta => { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight}px`; });
      const el = v.focus ? root.querySelector(v.focus) : v.refocus ? root.querySelector(v.refocus) : null;
      if (el) el.focus({ preventScroll: true });
      const ticked = v.fresh ? root.querySelector(`input[data-lm="${v.fresh}"]`) : null;
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
