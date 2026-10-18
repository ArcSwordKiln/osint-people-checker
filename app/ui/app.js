// Marlowe window. Renders every screen from case data and exposes window.marlowe
// so the shell (and the README capture scripts) can drive it.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Line icons, 16 px grid.
  const I = {
    account: '<circle cx="8" cy="5.6" r="2.7"/><path d="M2.8 14c.7-2.9 2.8-4.3 5.2-4.3s4.5 1.4 5.2 4.3"/>',
    photo: '<rect x="2" y="3" width="12" height="10" rx="1.6"/><circle cx="6" cy="6.8" r="1.2"/><path d="M2.4 12l3.6-3.4 2.5 2.4 2-1.9 3.1 3"/>',
    phone: '<rect x="4.5" y="1.8" width="7" height="12.4" rx="1.6"/><path d="M7 11.8h2"/>',
    listing: '<path d="M2.5 2.5h5.2l5.8 5.8-5.2 5.2-5.8-5.8z"/><circle cx="5.4" cy="5.4" r=".9"/>',
    web: '<circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c1.8 1.7 2.7 3.7 2.7 6S9.8 12.3 8 14c-1.8-1.7-2.7-3.7-2.7-6S6.2 3.7 8 2z"/>',
    record: '<path d="M4 1.8h5.2L12 4.6v9.6H4z"/><path d="M9 1.8v3h3M6 8.2h4M6 10.7h4"/>',
    cert: '<rect x="3.5" y="7" width="9" height="7" rx="1.4"/><path d="M5.6 7V5.1a2.4 2.4 0 0 1 4.8 0V7"/>',
    archive: '<rect x="2" y="2.8" width="12" height="3.4" rx=".8"/><path d="M3 6.2v7h10v-7M6.5 9h3"/>',
    breach: '<path d="M8 1.8 13.5 4v4c0 3.1-2.3 5.3-5.5 6.2C4.8 13.3 2.5 11.1 2.5 8V4z"/><path d="M8 5.2v3.2M8 10.6v.1"/>',
    arrow: '<path d="M3 8h10M9 4l4 4-4 4"/>',
    pdf: '<path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10"/>',
    eye: '<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>',
    check: '<path d="M3 8.5 6.5 12 13 4.5"/>',
    plus: '<path d="M5.5 1v9M1 5.5h9"/>',
  };
  const icon = (k) => `<svg viewBox="0 0 16 16">${I[k]}</svg>`;
  const ico = (k) => `<span class="ico">${icon(k)}</span>`;

  // Deterministic SHA-256-looking hashes so every screen agrees.
  function hash(seed) {
    let h = 2166136261;
    for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    let out = '';
    for (let i = 0; i < 64; i++) { h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) ^ i; out += ((h >>> 7) & 15).toString(16); }
    return out;
  }
  const short = (h) => `${h.slice(0, 6)}…${h.slice(-4)}`;

  const CASES = {
    seller: {
      tab: 'sunny.deals24', reason: 'A seller', subject: 'sunny.deals24', meta: 'Swapyard profile · started 14:02',
      verdict: 'flags', vlabel: 'Red flags', kind: 'Trust check for a seller',
      headline: 'Don’t pay this seller in advance.',
      reasons: [
        ['This account is 6 days old, and so is everything linked to it.', ['A1', 'A9']],
        ['The profile photo is a stock photo. It’s on 3 accounts with 3 different names.', ['A3', 'A4', 'A5']],
        ['The same phone number is selling the same console in Leeds and Bristol this week.', ['A6', 'A7']],
      ],
      found: 'sunny.deals24 joined Swapyard 6 days ago with one listing: a boxed games console for £210, about half the usual price. The shop in its bio went online 9 days ago. Nothing about this seller existed before last week.',
      exhibits: [
        ['A1', 'account', 'Swapyard profile', 'sunny.deals24 · member since 24 Oct', '14:02:03', 1],
        ['A2', 'listing', 'Listing: games console, £210', 'Posted 29 Oct · Manchester', '14:02:04', 1],
        ['A3', 'photo', 'Stock photo page', 'Same photo, online since March 2019', '14:02:11', 1],
        ['A4', 'account', 'mike.trades.uk', 'Same photo · created 28 Oct', '14:02:14', 1],
        ['A5', 'account', 'gamebox_outlet', 'Same photo · links the same shop', '14:02:15', 1],
        ['A6', 'listing', 'Listing in Leeds', 'Same phone number · posted 25 Oct', '14:02:19', 1],
        ['A7', 'listing', 'Listing in Bristol', 'Same phone number · posted 27 Oct', '14:02:20', 0],
        ['A8', 'web', 'sunnydeals-outlet24.shop', 'Shop home page', '14:02:24', 1],
        ['A9', 'record', 'Domain record', 'Registered 21 Oct 2026 · owner hidden', '14:02:26', 0],
        ['A10', 'cert', 'Certificate log', 'First certificate 21 Oct 2026', '14:02:27', 0],
        ['A11', 'archive', 'Archive history', 'No copies before 22 Oct 2026', '14:02:29', 1],
        ['A12', 'phone', '+44 7700 900461', 'In 3 listings this week', '14:02:31', 1],
      ],
      log: [
        ['14:02:03', 'Swapyard profile found', 'A1'],
        ['14:02:11', 'Profile photo found on a stock photo site', 'A3'],
        ['14:02:15', 'Same photo on 2 more accounts', 'A5'],
        ['14:02:20', 'Phone number in 2 other listings', 'A7'],
        ['14:02:26', 'Domain record read', 'A9'],
        ['14:02:31', 'Archive history checked', 'A12'],
      ],
    },
    landlord: {
      tab: 'Flat on Hale Street', reason: 'A landlord', subject: '+44 7700 900318', meta: 'Rental listing · started yesterday',
      verdict: 'careful', vlabel: 'Be careful', kind: 'Trust check for a landlord',
      headline: 'See the flat in person before you pay.',
      reasons: [
        ['The photos are also in a 2024 listing with a different address.', ['A2', 'A3']],
        ['This number has only been on listings since August.', ['A5']],
        ['The agency name doesn’t match a registered company.', ['A6']],
      ],
    },
    recruiter: {
      tab: 'larchfield.io', reason: 'A recruiter or job', subject: 'hr@larchfield.io', meta: 'Job offer by email · started 3 days ago',
      verdict: 'fine', vlabel: 'Looks fine', kind: 'Trust check for a recruiter',
      headline: 'Nothing here looks wrong.',
      reasons: [
        ['The company’s domain is 11 years old and its email is set up properly.', ['A2']],
        ['The same job is on the company’s own careers page.', ['A4']],
        ['The recruiter’s profile is 6 years old and links back to the company.', ['A5']],
      ],
    },
  };
  const exhibit = (x) => CASES.seller.exhibits.find((e) => e[0] === x);

  // Trail of the seller case: board coordinates of each card's top-left.
  const COL = [36, 296, 610, 870];
  const COL_W = [170, 190, 190, 190];
  const CARD_H = 66;
  const TRAIL = [
    { id: 'root', col: 0, y: 189, k: 'Start', v: 'sunny.deals24', s: 'Swapyard · 6 days old', ex: 'A1', depth: 0 },
    { id: 'photo', col: 1, y: 42, k: 'Photo', v: 'Profile photo', s: 'Stock photo since 2019', ex: 'A3', bad: 1, from: 'root', why: 'photo match', depth: 1 },
    { id: 'phone', col: 1, y: 210, k: 'Phone', v: '+44 7700 900461', s: 'In the listing text', ex: 'A12', from: 'root', why: 'in listing', depth: 1 },
    { id: 'shop', col: 1, y: 336, k: 'Website', v: 'sunnydeals-outlet24.shop', s: 'Link in the bio', ex: 'A8', from: 'root', why: 'link in bio', depth: 1, long: 1 },
    { id: 'mike', col: 2, y: 0, k: 'Account', v: 'mike.trades.uk', s: 'Created 2 days ago', ex: 'A4', bad: 1, from: 'photo', why: 'same photo', depth: 2 },
    { id: 'gamebox', col: 2, y: 84, k: 'Account', v: 'gamebox_outlet', s: 'Created 8 days ago', ex: 'A5', bad: 1, from: 'photo', why: 'same photo', depth: 2 },
    { id: 'leeds', col: 2, y: 168, k: 'Listing', v: 'Leeds, 25 Oct', s: 'Same console, £205', ex: 'A6', from: 'phone', why: 'same number', depth: 2 },
    { id: 'bristol', col: 2, y: 252, k: 'Listing', v: 'Bristol, 27 Oct', s: 'Same console, £215', ex: 'A7', from: 'phone', why: 'same number', depth: 2 },
    { id: 'rdap', col: 2, y: 336, k: 'Record', v: 'Domain record', s: 'Registered 9 days ago', ex: 'A9', bad: 1, from: 'shop', why: 'who owns it', depth: 2 },
    { id: 'cert', col: 3, y: 336, k: 'Record', v: 'Certificate log', s: 'First seen 21 Oct 2026', ex: 'A10', from: 'rdap', why: 'first cert', depth: 3 },
  ];

  const TABS = [
    { label: 'sunny.deals24', dot: 'flags', mono: 1 },
    { label: 'Flat on Hale Street', dot: 'careful' },
    { label: 'larchfield.io', dot: 'fine', mono: 1 },
  ];
  const CHIPS = ['A seller', 'A recruiter or job', 'A landlord', 'A website or shop', 'Myself'];

  const state = { tabs: TABS.map((t) => ({ ...t })), active: 0, chip: -1, text: '', focus: false };

  function chrome() {
    $('#app').innerHTML = `
      <div class="titlebar">
        <div class="brand"><img src="${ICON}" alt="">Marlowe</div>
        <div class="tabs" id="tabs"></div>
        <div class="winctl"><span><svg viewBox="0 0 11 11"><path d="M0 5.5h11"/></svg></span><span><svg viewBox="0 0 11 11"><rect x=".5" y=".5" width="10" height="10"/></svg></span><span><svg viewBox="0 0 11 11"><path d="M0 0l11 11M11 0 0 11"/></svg></span></div>
      </div>
      <div class="view" id="view"></div>
      <div class="status"><span>3,412 sources</span><span>Local AI · llama3.1:8b</span><span class="ok">Nothing leaves this PC</span><span class="right">Case log · 23 entries</span></div>`;
    drawTabs();
  }
  // The app icon, resolved next to this script so it works from any page.
  const ICON = new URL('../icons/128x128.png', document.currentScript.src).href;

  function drawTabs() {
    $('#tabs').innerHTML = state.tabs.map((t, i) => `<div class="tab${i === state.active ? ' on' : ''}"><i class="tdot ${t.dot || ''}"></i><span class="${t.mono ? 'mono' : ''}">${t.label}</span></div>`).join('')
      + `<span class="newtab"><svg viewBox="0 0 11 11">${I.plus}</svg></span>`;
  }

  const view = (html) => { $('#view').innerHTML = html; };

  // Home --------------------------------------------------------------------
  function homeHTML() {
    const input = state.text
      ? `<span>${state.text}</span>${state.focus ? '<i class="caret"></i>' : ''}`
      : `${state.focus ? '<i class="caret"></i>' : ''}<span class="ph">nickname, email, phone number or link</span>`;
    return `<div class="home"><div class="col">
      <div class="kicker">New case</div>
      <h1>Who are you checking?</h1>
      <p class="sub">Pick what fits, then type a nickname, email, phone number or link.</p>
      <div class="chips">${CHIPS.map((c, i) => `<span class="chip${i === state.chip ? ' on' : ''}" data-chip="${i}">${c}</span>`).join('')}</div>
      <div class="field${state.focus ? ' focus' : ''}"><div class="input">${input}</div><span class="hint">Enter</span><button class="btn ink" data-act="check">Check</button></div>
      <div class="note">Marlowe only reads public pages. Every case keeps a log of what it checked.</div>
      <div class="recent"><div class="label">Recent cases</div><div class="cards">
        <div class="icard"><div class="k">A landlord</div><div class="v">+44 7700 900318</div><div class="f"><span class="pill sm careful">Be careful</span><span>Yesterday</span></div></div>
        <div class="icard"><div class="k">A recruiter or job</div><div class="v">hr@larchfield.io</div><div class="f"><span class="pill sm fine">Looks fine</span><span>3 days ago</span></div></div>
        <div class="icard"><div class="k">Myself</div><div class="v">alexmorgan_</div><div class="f"><span>Watching · 3 to fix</span><span>Last week</span></div></div>
      </div></div>
    </div></div>`;
  }
  function home(opts = {}) {
    Object.assign(state, { chip: -1, text: '', focus: false }, opts);
    state.tabs = [{ label: 'New case' }, ...TABS];
    state.active = 0;
    drawTabs();
    view(homeHTML());
  }
  const redrawHome = () => view(homeHTML());

  // Case shell ---------------------------------------------------------------
  function caseHTML(c, tab, body, { scanning = false } = {}) {
    const tabs = [['verdict', 'Verdict'], ['evidence', 'Evidence', '12'], ['trail', 'Trail'], ['timeline', 'Timeline'], ['report', 'Report']];
    return `<div class="case">
      <div class="casehead">
        <div class="top"><span class="reason">${c.reason}</span><span class="subject">${c.subject}</span><span class="meta">${c.meta}</span>
          <div class="acts"><span class="btn line">${icon('eye')}Watch</span><span class="btn line">${icon('pdf')}Save PDF</span></div></div>
        <div class="ctabs">${tabs.map(([k, l, n]) => `<span class="${scanning ? 'muted' : k === tab ? 'on' : ''}">${l}${n && !scanning ? `<em>${n}</em>` : ''}</span>`).join('')}</div>
      </div>
      <div class="body" id="body">${body}</div>
    </div>`;
  }
  function openCase(id) {
    const c = CASES[id];
    state.tabs = TABS.map((t) => ({ ...t }));
    state.active = Object.keys(CASES).indexOf(id);
    return c;
  }

  // Scanning -----------------------------------------------------------------
  async function scan(id = 'seller', ms = 3600) {
    const c = openCase(id);
    state.tabs[state.active].dot = '';
    drawTabs();
    view(caseHTML(c, 'verdict', `<div class="scan">
      <div><h2>Reading public sources</h2><div class="count" id="count">0 of 3,412</div><div class="bar"><i id="fill" style="width:0"></i></div><div class="log" id="log"></div></div>
      <div class="stamp"><div class="n" id="rc">0</div><div class="t">receipts saved</div><div class="s">A page snapshot, an archive copy, the time and a SHA-256 hash for every finding.</div></div>
    </div>`, { scanning: true }));
    const counts = { A1: 1, A3: 3, A5: 5, A7: 7, A9: 10, A12: 12 };
    const t0 = performance.now();
    let shown = 0;
    while (true) {
      const t = Math.min(1, (performance.now() - t0) / ms);
      const e = 1 - Math.pow(1 - t, 1.6);
      $('#count').textContent = `${Math.round(3412 * e).toLocaleString('en-US')} of 3,412`;
      $('#fill').style.width = `${e * 100}%`;
      const due = Math.min(c.log.length, Math.floor(t * (c.log.length + 0.6)));
      while (shown < due) {
        const [time, text, ex] = c.log[shown++];
        const row = document.createElement('div');
        row.innerHTML = `<time>${time}</time><span>${text}</span><span class="ex">${ex}</span>`;
        $('#log').appendChild(row);
        $('#rc').textContent = counts[ex];
      }
      if (t >= 1) break;
      await sleep(40);
    }
    const w = document.createElement('div');
    w.className = 'wait';
    w.innerHTML = '<time>14:02:33</time><span>Writing the verdict<b>…</b></span><span></span>';
    $('#log').appendChild(w);
    await sleep(900);
  }

  // Snapshot drawings of saved pages (vector, so they stay sharp at any size).
  function shot(kind, x) {
    const bar = (url) => `<div class="bar"><i></i><i></i><i></i><span>${url}</span></div>`;
    const e = x ? exhibit(x) : null;
    if (kind === 'photo') {
      const tiles = ['t-sky', 'face hit', 't-field', 'face b', 't-city', 't-sea', 'face c', 't-sky b'];
      return `<div class="page">${bar('imagerillo.com/photo/48213-portrait')}
        <div class="grid">${tiles.map((t) => `<i class="${t}"></i>`).join('')}</div></div>`;
    }
    if (kind === 'account') {
      const name = e && e[2] !== 'Swapyard profile' ? e[2] : 'sunny.deals24';
      const since = { 'mike.trades.uk': '28 Oct 2026', gamebox_outlet: '22 Oct 2026' }[name] || '24 Oct 2026';
      return `<div class="page">${bar(`swapyard.co.uk/u/${name}`)}
        <div class="prof"><i class="face hit-none"></i><div><b>${name}</b><small>Member since ${since} · 0 reviews</small></div></div>
        <div class="item"><i class="console"></i><div><small>Games console, boxed</small><b>£210</b></div></div></div>`;
    }
    if (kind === 'listing') {
      const city = e ? (e[2].match(/Leeds|Bristol/) || ['Manchester'])[0] : 'Leeds';
      const price = { Leeds: '£205', Bristol: '£215' }[city] || '£210';
      return `<div class="page">${bar('swapyard.co.uk/item/games-console-boxed')}
        <div class="listing"><i class="console big"></i><div><b>Games console, boxed, as new</b><span>${price}</span><small>${city} · posted this week</small><small>Call or text +44 7700 900461</small></div></div></div>`;
    }
    if (kind === 'web') {
      return `<div class="page">${bar('sunnydeals-outlet24.shop')}
        <div class="shop"><div class="hero">Big brands. Small prices.</div><div class="prods"><i class="console"></i><i class="console"></i><i class="console"></i></div></div></div>`;
    }
    const lines = {
      record: ['domain       sunnydeals-outlet24.shop', 'registered   2026-10-21T09:14:52Z', 'registrant   REDACTED FOR PRIVACY', 'status       client transfer prohibited', 'nameservers  ns1.parkdns.net'],
      cert: ['issuer       R11', 'not before   2026-10-21 10:02 UTC', 'subject      sunnydeals-outlet24.shop', 'entries      2'],
    }[kind] || ['first capture  2026-10-22', 'captures       3', 'source         web.archive.org'];
    return `<div class="page">${bar(kind === 'record' ? 'rdap · domain record' : kind === 'cert' ? 'certificate transparency log' : 'web.archive.org')}<pre class="rec">${lines.join('\n')}</pre></div>`;
  }

  // Verdict ------------------------------------------------------------------
  const chips = (ids) => ids.map((x) => `<span class="ex" data-ex="${x}">${x}</span>`).join('');
  function verdictHTML(c, animate) {
    const a = (k) => (animate ? ` style="animation-delay:${k}ms" ` : ' ');
    const thumbs = ['A1', 'A3', 'A6', 'A8', 'A9'];
    return `<div class="verdict">
      <div class="left">
        <div class="vtop${animate ? ' fade' : ''}"${a(0)}><span class="pill ${c.verdict}">${c.vlabel}</span><span class="label">${c.kind}</span></div>
        <h2 class="${animate ? 'fade' : ''}"${a(150)}>${c.headline}</h2>
        <div class="rule" ${animate ? 'style="animation: grow 0.6s 0.3s ease-out both"' : ''}></div>
        <ol class="reasons">${c.reasons.map(([t, ids], i) => `<li class="${animate ? 'fade' : ''}"${a(700 + i * 520)}><span class="no">${i + 1}</span><span class="tx">${t}${chips(ids)}</span></li>`).join('')}</ol>
        <div class="strip${animate ? ' fade' : ''}"${a(2300)}><div class="label">Receipts<span>12 saved · showing 5</span></div>
          <div class="thumbs">${thumbs.map((x) => { const e = exhibit(x); return `<div class="thumb"><div class="mini"><div class="mini-in">${shot(e[1], x)}</div></div><div class="cap"><span class="ex">${x}</span>${e[2]}</div></div>`; }).join('')}</div></div>
      </div>
      <div class="side${animate ? ' fade' : ''}"${a(2500)}>
        <div class="found"><div class="label">What Marlowe found</div><p>${c.found || ''}</p></div>
        <div class="acts"><span class="btn ink" data-act="dig">Keep digging${icon('arrow')}</span><span class="btn line">See the timeline${icon('arrow')}</span></div>
        <div class="receipt"><span><b>12 receipts</b> · SHA-256 · 9 archived</span></div>
      </div>
    </div>`;
  }
  function result(id = 'seller', { animate = false } = {}) {
    const c = openCase(id);
    drawTabs();
    view(caseHTML(c, 'verdict', verdictHTML(c, animate)));
  }

  function hover(exId = 'A3') {
    unhover();
    const chip = [...document.querySelectorAll(`.reasons .ex[data-ex="${exId}"]`)].pop();
    if (!chip) return;
    chip.classList.add('hot');
    const e = exhibit(exId);
    const h = hash(exId);
    const host = $('#body');
    const hr = host.getBoundingClientRect(), r = chip.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'pop';
    pop.innerHTML = `<div class="shot">${shot(e[1], exId)}</div><div class="cap"><b>${exId} · ${e[2]}</b><br>Captured 30 Oct 2026 · ${e[4]} UTC<br>sha256 ${h.slice(0, 20)}…${h.slice(-6)}<br><span class="ok">Archived copy saved</span></div>`;
    pop.style.left = `${Math.min(r.left - hr.left - 20, hr.width - 330)}px`;
    pop.style.top = `${r.bottom - hr.top + 10}px`;
    host.appendChild(pop);
  }
  function unhover() {
    document.querySelectorAll('.pop').forEach((p) => p.remove());
    document.querySelectorAll('.ex.hot').forEach((p) => p.classList.remove('hot'));
  }

  // Evidence -----------------------------------------------------------------
  function evidence(id = 'seller', sel = 'A3') {
    const c = openCase(id);
    drawTabs();
    const e = exhibit(sel);
    const h = hash(sel);
    view(caseHTML(c, 'evidence', `<div class="evidence">
      <div class="list">
        <h2>12 receipts</h2>
        <p class="lede">Each page was saved the moment Marlowe found it. If it disappears, you still have it.</p>
        <div class="rows">
          <div class="hd"><span>Exhibit</span><span>What</span><span>Captured (UTC)</span><span>SHA-256</span><span>Archive</span></div>
          ${c.exhibits.slice(0, 8).map(([x, k, t, s, time, arc]) => `<div class="r${x === sel ? ' on' : ''}"><span><span class="ex">${x}</span></span><span class="what">${ico(k)}<span style="min-width:0"><b>${t}</b><small>${s}</small></span></span><span class="mono">30 Oct, ${time}</span><span class="mono">${short(hash(x))}</span><span class="arc${arc ? '' : ' local'}">${arc ? 'Wayback' : 'Local'}</span></div>`).join('')}
          <div class="more">A9 to A12 · domain record, certificate log, archive history, phone number</div>
        </div>
      </div>
      <div class="inspector">
        <div class="label">${sel} · ${e[2]}</div>
        <div class="shotbox">${shot(e[1], sel)}</div>
        <dl><dt>Found</dt><dd style="font-family:var(--sans);font-size:12px;word-break:normal">${e[3]}</dd><dt>Captured</dt><dd>2026-10-30 ${e[4]} UTC</dd><dt>SHA-256</dt><dd>${h}</dd><dt>Archive</dt><dd>web.archive.org/web/20261030${e[4].replace(/:/g, '')}/…</dd></dl>
        <div class="match">${icon('check')}Hash matches the saved page</div>
        <div class="btns"><span class="btn line">Open saved page</span><span class="btn line">Open archive</span></div>
      </div>
    </div>`));
  }

  // Trail --------------------------------------------------------------------
  function trailHTML(depth) {
    return `<div class="trail">
      <div class="bar2"><h2>How Marlowe got here</h2><span class="lede">Every step says why it was taken.</span>
        <span class="seg"><span class="l">Depth</span><span class="o">1</span><span class="o">2</span><span class="o on">3</span></span>
        <span class="btn ink" data-act="dig">Keep digging${icon('arrow')}</span></div>
      <div class="board" id="board"><svg class="strings" id="strings"></svg>
        ${TRAIL.map((n) => `<div class="tcard${n.depth === 0 ? ' root' : ''}${n.depth > depth ? ' hide' : ''}" data-id="${n.id}" style="left:${COL[n.col]}px;top:${n.y}px;width:${COL_W[n.col]}px">
          <div class="k"><span>${n.k}</span><span class="ex">${n.ex}</span></div><div class="v"${n.long ? ' style="font-size:11.5px"' : ''}>${n.v}</div><div class="s${n.bad ? ' bad' : ''}">${n.s}</div></div>`).join('')}
        ${TRAIL.filter((n) => n.from).map((n) => { const m = mid(n); return `<span class="why${n.depth > depth ? ' hide' : ''}" data-why="${n.id}" style="left:${m.x}px;top:${m.y}px">${n.why}</span>`; }).join('')}
      </div>
      <div class="foot">Right-click a card to cut its branch. Nothing is searched without a reason you can see.</div>
    </div>`;
  }
  const node = (id) => TRAIL.find((n) => n.id === id);
  function ends(n) {
    const p = node(n.from);
    return { x1: COL[p.col] + COL_W[p.col], y1: p.y + CARD_H / 2, x2: COL[n.col], y2: n.y + CARD_H / 2 };
  }
  function mid(n) {
    const { x1, y1, x2, y2 } = ends(n);
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 + 4 };
  }
  function pathFor(n) {
    const { x1, y1, x2, y2 } = ends(n);
    const dx = (x2 - x1) * 0.55;
    // A little slack so the string hangs instead of looking ruled.
    const sag = Math.min(14, Math.abs(y2 - y1) * 0.08 + 6);
    return `M${x1} ${y1} C${x1 + dx} ${y1 + sag} ${x2 - dx} ${y2 + sag} ${x2} ${y2}`;
  }
  function drawStrings(depth, animateDepth = -1) {
    const svg = $('#strings');
    const cross = node('gamebox'), shop = node('shop');
    const cx1 = COL[cross.col], cy1 = cross.y + CARD_H - 10, cx2 = COL[shop.col] + COL_W[shop.col], cy2 = shop.y + 14;
    svg.innerHTML = TRAIL.filter((n) => n.from && n.depth <= depth).map((n) => `<path d="${pathFor(n)}"${n.depth === animateDepth ? ' data-new="1"' : ''}/>`).join('')
      + (depth >= 2 ? `<path class="cross"${animateDepth === 2 ? ' data-new="1"' : ''} d="M${cx1} ${cy1} C${cx1 - 70} ${cy1 + 100} ${cx2 + 50} ${cy2 - 110} ${cx2} ${cy2}"/>` : '');
    svg.querySelectorAll('path[data-new]').forEach((p) => {
      if (p.classList.contains('cross')) {
        p.animate([{ opacity: 0 }, { opacity: 0.6 }], { duration: 500, delay: 400, fill: 'both' });
        return;
      }
      const L = p.getTotalLength();
      p.style.strokeDasharray = `${L}`;
      p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 520, easing: 'ease-out', fill: 'both' });
    });
  }
  function trail(id = 'seller', depth = 3) {
    const c = openCase(id);
    drawTabs();
    view(caseHTML(c, 'trail', trailHTML(depth)));
    drawStrings(depth);
  }
  async function dig() {
    for (let d = 1; d <= 3; d++) {
      drawStrings(d, d);
      for (const n of TRAIL.filter((x) => x.depth === d)) {
        await sleep(170);
        $(`.tcard[data-id="${n.id}"]`).classList.remove('hide');
        const w = $(`.why[data-why="${n.id}"]`);
        if (w) w.classList.remove('hide');
      }
      await sleep(560);
    }
  }

  // Timeline -----------------------------------------------------------------
  function timeline(id = 'seller') {
    const c = openCase(id);
    drawTabs();
    const W = 1016;
    const yx = (y, m = 0) => ((y - 2019) * 12 + m) / (8 * 12) * W;
    const years = Array.from({ length: 8 }, (_, i) => 2019 + i);
    const d0 = 18, d1 = 31, dx = (d) => ((d - d0) / (d1 - d0)) * W;
    const EV = [
      [21, 'Shop domain registered, first certificate issued', ['A9', 'A10'], -1, 34],
      [22, 'gamebox_outlet created', ['A5'], 1, 34],
      [24, 'Swapyard account created', ['A1'], -1, 34],
      [25, 'Same console listed in Leeds', ['A6'], 1, 34],
      [27, 'Same console listed in Bristol', ['A7'], -1, 34],
      [28, 'mike.trades.uk created', ['A4'], 1, 34],
      [29, 'Console listed here for £210', ['A2'], -1, 100],
    ];
    const AX = 170, DH = 330;
    const evs = EV.map(([d, t, ex, side, len]) => {
      const x = dx(d);
      const lead = side < 0 ? `top:${AX - len}px;height:${len}px` : `top:${AX}px;height:${len}px`;
      const box = side < 0 ? `bottom:${DH - (AX - len) + 4}px` : `top:${AX + len + 4}px`;
      return `<i class="lead" style="left:${x}px;${lead}"></i><i class="dot new" style="left:${x}px;top:${AX}px"></i>
        <div class="ev" style="left:${x}px;${box}"><b>${d} Oct</b>${t}<br>${ex.map((e) => `<span class="ex">${e}</span>`).join('')}</div>`;
    }).join('');
    const z0 = yx(2026, 9);
    view(caseHTML(c, 'timeline', `<div class="tl" id="tl">
      <div class="head"><h2>Timeline</h2><span class="flag">Almost everything here is less than 10 days old</span></div>
      <div class="years">
        <div class="axis" style="top:44px"></div>
        ${years.map((y) => `<i class="tick" style="left:${yx(y)}px;top:44px"></i><span class="tlab" style="left:${yx(y) + W / 16}px;top:56px">${y}</span>`).join('')}
        <i class="tick" style="left:${W}px;top:44px"></i>
        <i class="dot" style="left:${yx(2019, 2)}px;top:44px"></i>
        <div class="callout" style="left:${yx(2019, 2) + 12}px;top:2px">The profile photo first appears on a stock photo site <span class="ex">A3</span><small>March 2019</small></div>
        <div class="zoomband" id="zA" style="left:${z0}px;width:${W - z0}px;top:32px;height:24px"></div>
        <div class="callout" style="right:${W - z0 + 10}px;top:6px;text-align:right;color:var(--flags)">Everything else<small style="color:var(--ink-3)">October 2026</small></div>
      </div>
      <div class="days">
        <div class="zoomband" id="zB" style="left:${dx(20.5)}px;width:${dx(30.5) - dx(20.5)}px;top:${AX - 22}px;height:44px"></div>
        <div class="axis" style="top:${AX}px"></div>
        ${Array.from({ length: d1 - d0 + 1 }, (_, i) => `<i class="tick" style="left:${dx(d0 + i)}px;top:${AX - 3}px"></i>`).join('')}
        <span class="tlab" style="left:0;top:${AX + 12}px;transform:none">18 Oct</span>
        <span class="dcap">October 2026, day by day</span>
        <i class="lead" style="left:${dx(30)}px;top:${AX}px;height:120px;background:none;border-left:1px dashed var(--ink-3)"></i>
        <span class="tlab" style="left:${dx(30)}px;top:${AX + 126}px;color:var(--ink-2)">Today, 30 Oct</span>
        ${evs}
      </div>
    </div>`));
  }

  // Report -------------------------------------------------------------------
  function report(id = 'seller') {
    const c = openCase(id);
    drawTabs();
    view(caseHTML(c, 'report', `<div class="report">
      <div class="desk"><div class="sheet">
        <div class="rh"><b>Marlowe</b><span>Case report · 30 Oct 2026</span></div>
        <h3>sunny.deals24</h3>
        <div class="kv"><span>Reason</span><span>A seller · Swapyard listing</span><span>Started</span><span>30 Oct 2026, 14:02 UTC</span><span>Sources read</span><span>3,412 · 12 exhibits saved</span></div>
        <div class="vrd"><span class="pill flags">Red flags</span><p>${c.headline}</p>
          <ol>${c.reasons.map(([t, ids]) => `<li>${t}${ids.map((x) => `<span class="ex">${x}</span>`).join('')}</li>`).join('')}</ol></div>
        <h4>Exhibits</h4>
        <table>${c.exhibits.slice(0, 6).map(([x, , t, , time]) => `<tr><td class="m">${x}</td><td>${t}</td><td class="m">${time} UTC</td><td class="m">${hash(x).slice(0, 14)}…</td></tr>`).join('')}</table>
        <div class="pf"><span>Each exhibit: page snapshot, archive copy, capture time, SHA-256.</span><span>1 of 4</span></div>
      </div></div>
      <div class="opts">
        <h2>Report</h2>
        <p class="lede">A PDF you can send to the marketplace, your bank or the police.</p>
        <div class="tg">
          <div><span>Page snapshots<small>One page per exhibit</small></span><i class="sw on"></i></div>
          <div><span>Case log<small>What was checked, and when</small></span><i class="sw on"></i></div>
          <div><span>Hide phone numbers<small>Shows +44 7700 9•••••</small></span><i class="sw"></i></div>
          <div><span>Hash table<small>For anyone who wants to verify</small></span><i class="sw on"></i></div>
        </div>
        <div class="file">marlowe-sunny.deals24-2026-10-30.pdf<br>4 pages · 12 exhibits · 2.1 MB</div>
        <span class="btn ink">${icon('pdf')}Save PDF</span>
      </div>
    </div>`));
  }

  // Check yourself -----------------------------------------------------------
  function me() {
    state.tabs = [{ label: 'Me', dot: 'fine' }, ...TABS];
    state.active = 0;
    drawTabs();
    const ok = '<span class="box"><svg viewBox="0 0 12 12"><path d="M2.5 6.3 5 8.6l4.5-5"/></svg></span>';
    const no = '<span class="box"></span>';
    const row = (done, k, t, s, act) => `<div class="todo${done ? ' done' : ''}">${done ? ok : no}${ico(k)}<span><b>${t}</b><small>${s}</small></span>${done ? `<span class="sent">${act}</span>` : `<span class="btn line">${act}</span>`}</div>`;
    const c = { reason: 'Myself', subject: 'alexmorgan_', meta: '1 nickname, 1 email · started 09:40' };
    view(caseHTML(c, 'verdict', `<div class="me">
      <div class="main">
        <h2>23 places show something about you.</h2>
        <p class="lede">Most of it is fine. These 6 are worth fixing, easiest first.</p>
        <div class="prog"><span class="track"><i style="width:50%"></i></span>3 of 6 done</div>
        <div class="group"><div class="gh">People-search sites that list you</div>
          ${row(1, 'record', 'Openroster', 'Name, age range, town', 'Request sent')}
          ${row(0, 'record', 'Kinlookup', 'Name and an old phone number', 'Opt out')}
        </div>
        <div class="group"><div class="gh">Old accounts you may have forgotten</div>
          ${row(1, 'account', 'Forum account from 2014', 'Showed your email on your profile', 'Deleted')}
          ${row(0, 'photo', 'Photo site from 2016', '3 public albums under your nickname', 'Delete account')}
        </div>
        <div class="group"><div class="gh">Breaches</div>
          ${row(1, 'breach', 'Fitness app, 2019', 'Email and password hash', 'Password changed')}
          ${row(0, 'breach', 'Game forum, 2021', 'Email and password', 'Change password')}
        </div>
      </div>
      <div class="side2">
        <div class="label">What to do first</div>
        <ol>
          <li><span>Change the game forum password, and anywhere you used it too.</span></li>
          <li><span>Opt out of Kinlookup. It shows an old phone number.</span></li>
          <li><span>Delete the 2016 photo site account. Its albums use your nickname.</span></li>
        </ol>
        <div class="watch"><div class="row">Watch me<i class="sw on"></i></div><p>Tells you when your name or email turns up somewhere new. Runs for 90 days, then asks again. You can watch yourself, your own domains or your company, never another person.</p></div>
      </div>
    </div>`));
    $('.ctabs').innerHTML = '<span class="on">Your footprint</span><span>Evidence<em>23</em></span><span>Timeline</span><span>Report</span>';
  }

  // Verdict cards for the README (three cases side by side).
  function vcard(id) {
    const c = CASES[id];
    return `<div class="vcard"><div class="vk"><span class="reason">${c.reason}</span><span class="vs">${c.subject}</span></div>
      <span class="pill ${c.verdict}">${c.vlabel}</span><h2>${c.headline}</h2><div class="rule"></div>
      <ol class="reasons">${c.reasons.map(([t, ids], i) => `<li><span class="no">${i + 1}</span><span class="tx">${t}${chips(ids)}</span></li>`).join('')}</ol></div>`;
  }

  // Typing helpers for the shell's guided tour and the README recordings.
  async function type(text, each = 70) {
    state.focus = true;
    for (let i = 0; i <= text.length; i++) {
      state.text = text.slice(0, i);
      redrawHome();
      await sleep(i === 0 ? 200 : each + ((i * 13) % 40));
    }
  }
  function select(i) { state.chip = i; redrawHome(); }
  function focus() { state.focus = true; redrawHome(); }
  function press() { const b = $('[data-act="check"]'); if (b) b.classList.add('press'); }

  window.marlowe = { home, select, focus, type, press, scan, result, hover, unhover, evidence, trail, dig, timeline, report, me, vcard, shot, hash, CASES };

  chrome();
  home();
})();
