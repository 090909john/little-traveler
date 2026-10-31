// 小小旅行家：主流程
(() => {
  const FAST = /[?&]fast=1/.test(location.search);
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const D = {}; let levelCounter = 0; let busy = false;
  const state = { screen: 'start', dest: null, leg: -1, phase: 'idle', level: null };
  window.LT = { state, data: D };
  const wait = ms => new Promise(r => setTimeout(r, FAST ? Math.min(ms, 30) : ms));

  // ---- 防誤觸 ----
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  let lastTouch = 0;
  document.addEventListener('touchend', e => { const n = Date.now(); if (n - lastTouch < 350) e.preventDefault(); lastTouch = n; }, { passive: false });
  document.addEventListener('selectstart', e => e.preventDefault());

  function show(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + name));
    state.screen = name;
  }
  const proj = ([lon, lat]) => { const p = D.map.projection; return [+((lon - p.lonMin) * p.scaleX).toFixed(1), +((p.latMax - lat) * p.scaleY).toFixed(1)]; };
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  async function loadData() {
    const names = ['map', 'stops', 'routes', 'vehicles', 'levels'];
    const res = await Promise.all(names.map(n => fetch(`data/${n}.json`).then(r => { if (!r.ok) throw new Error(n); return r.json(); })));
    names.forEach((n, i) => D[n] = res[i]);
  }

  // ---- 地圖 ----
  let svg, routeLayer, vehicleEl;
  function drawMap() {
    svg = $('map'); svg.innerHTML = '';
    el('rect', { x: 0, y: 0, width: 400, height: 745, fill: '#7ec8f0', rx: 30 }, svg);
    for (let i = 0; i < 14; i++) el('path', { d: `M${20 + (i % 4) * 95},${40 + i * 48} q10,-8 20,0 t20,0`, stroke: '#a9dcf7', 'stroke-width': 3, fill: 'none' }, svg);
    el('path', { class: 'land', d: 'M' + D.map.outline.map(p => proj(p).join(',')).join(' L') + ' Z' }, svg);
    el('text', { class: 'sea-label', x: 20, y: 380 }, svg).textContent = '台灣海峽';
    el('text', { class: 'sea-label', x: 300, y: 560 }, svg).textContent = '太平洋';
    routeLayer = el('g', {}, svg);
    const passport = Store.load().stamps;
    drawStop(D.stops.home, true);
    D.stops.stops.forEach(s => drawStop(s, false, !!passport[s.id]));
    vehicleEl = el('text', { class: 'vehicle', visibility: 'hidden' }, svg);
  }
  function drawStop(s, isHome, done) {
    const [x, y] = proj(s.lonlat);
    const g = el('g', { class: 'stop' + (isHome ? ' home' : '') + (done ? ' done' : ''), 'data-id': s.id, transform: `translate(${x},${y})` }, svg);
    el('circle', { r: 28 }, g);
    el('text', { class: 'em' }, g).textContent = s.emoji;
    el('text', { class: 'nm', y: isHome ? -36 : 46 }, g).textContent = s.name + (done ? ' ✅' : '');
    if (!isHome) g.addEventListener('click', () => chooseDest(s.id));
  }

  // ---- 旅程 ----
  async function chooseDest(id) {
    if (busy) return; busy = true;
    Sound.play('tap');
    const s = D.stops.stops.find(x => x.id === id), legs = D.routes.routes[id];
    state.dest = s; state.leg = -1; routeLayer.innerHTML = '';
    const msg = `我們要去${s.name}囉！`; $('map-prompt').textContent = msg; Sound.say(msg);
    const legPaths = legs.map(l => {
      const pts = l.path.map(proj);
      const p = el('path', { class: 'route', d: PathAnim.smoothD(pts) }, routeLayer);
      const end = pts[pts.length - 1];
      if (l !== legs[legs.length - 1]) { el('circle', { class: 'waypoint', cx: end[0], cy: end[1], r: 9 }, routeLayer); el('text', { class: 'wp-label', x: end[0], y: end[1] - 14 }, routeLayer).textContent = l.to; }
      return p;
    });
    // 整條路線合成一條，分 3 段：每過一關前進 1/3
    const all = []; legs.forEach(l => l.path.forEach((pt, k) => { if (k || !all.length) all.push(pt); }));
    const full = el('path', { class: 'route', d: PathAnim.smoothD(all.map(proj)), opacity: 0 }, routeLayer);
    const prog = el('path', { class: 'route done', d: full.getAttribute('d') }, routeLayer);
    const L = full.getTotalLength(); prog.style.strokeDasharray = `${L} ${L}`; prog.style.strokeDashoffset = L;
    const STEPS = 3;
    const okAll = D.vehicles.order.filter(k => legs.every(l => l.vehicles.includes(k)));
    await wait(1500);
    state.leg = 0;
    const v = await chooseVehicle({ to: s.name, vehicles: okAll.length ? okAll : legs[0].vehicles });
    const veh = D.vehicles.vehicles[v];
    vehicleEl.textContent = veh.emoji; vehicleEl.setAttribute('visibility', 'visible'); svg.appendChild(vehicleEl);
    const p0 = full.getPointAtLength(0); vehicleEl.setAttribute('transform', `translate(${p0.x},${p0.y})`);
    for (let i = 0; i < STEPS; i++) {
      state.leg = i;
      await runLevel(v, i, STEPS);
      show('map');
      const m = `前進 ${i + 1}/${STEPS}！`; $('map-prompt').textContent = m; Sound.say(m);
      state.phase = 'driving'; Sound.play(veh.sound);
      await PathAnim.follow(full, vehicleEl, FAST ? 200 : 2500, i / STEPS, (i + 1) / STEPS, f => prog.style.strokeDashoffset = L * (1 - f));
      await wait(400);
    }
    vehicleEl.setAttribute('visibility', 'hidden');
    arrive(s); busy = false;
  }

  function chooseVehicle(leg) {
    state.phase = 'vehicle';
    return new Promise(resolve => {
      const ov = $('overlay-vehicle'), box = $('vehicle-choices'), msgEl = $('vehicle-msg');
      const prompt = `要坐什麼去${leg.to}呢？`; $('vehicle-prompt').textContent = prompt; Sound.say(prompt);
      msgEl.textContent = ''; box.innerHTML = '';
      let picked = false;
      const btns = {};
      D.vehicles.order.forEach(k => {
        const v = D.vehicles.vehicles[k];
        const b = document.createElement('button'); b.className = 'choice'; b.dataset.vehicle = k;
        b.innerHTML = `<span class="e">${v.emoji}</span>${v.name}`; box.appendChild(b); btns[k] = b;
        b.addEventListener('click', async () => {
          if (picked) return; picked = true;
          let use = k;
          if (!leg.vehicles.includes(k)) {
            use = leg.vehicles[0];
            const m = v.cantSay.replace('{ok}', D.vehicles.vehicles[use].name);
            b.classList.add('no'); btns[use].classList.add('glow');
            msgEl.textContent = m; Sound.play('soft'); Sound.say(m);
            await wait(2600);
          } else { Sound.play('good'); await wait(500); }
          ov.classList.add('hidden'); resolve(use);
        });
      });
      ov.classList.remove('hidden');
    });
  }

  async function drive(pathEl, vKey) {
    state.phase = 'driving';
    const v = D.vehicles.vehicles[vKey];
    vehicleEl.textContent = v.emoji; vehicleEl.setAttribute('visibility', 'visible');
    svg.appendChild(vehicleEl);
    Sound.play(v.sound);
    await PathAnim.follow(pathEl, vehicleEl, FAST ? 200 : 3500);
  }

  async function runLevel(vKey, idx, total) {
    state.phase = 'level';
    const type = D.levels.types[levelCounter++ % D.levels.types.length];
    const pool = [D.vehicles.vehicles[vKey].theme, state.dest.theme, ...D.levels.extraThemes].filter((t, i, a) => a.findIndex(x => x.word === t.word) === i);
    show('level');
    const run = Levels.run(type, pool, D.levels, { title: $('level-title'), dots: $('level-dots'), prompt: $('level-prompt'), body: $('level-body'), msg: $('level-msg') }, { fast: FAST });
    state.level = run.api;
    $('level-title').textContent += `（第 ${idx + 1}/${total} 關）`;
    await run.done;
    state.level = null;
    const m = idx + 1 < total ? '過關了！往前走一段！' : '全部過關！出發去目的地！'; $('level-msg').textContent = m; Sound.say(m);
    await wait(1200);
  }

  function arrive(s) {
    state.phase = 'arrived';
    const st = Store.addStamp(s.id);
    show('arrive');
    $('arrive-title').textContent = `到${s.name}了！`;
    $('arrive-stamp').innerHTML = `<span class="e">${s.emoji}</span>${s.name}`;
    $('arrive-fact').textContent = s.fact;
    Sound.play('stamp');
    Sound.say(`到${s.name}了！${s.fact}`);
    Fireworks.start($('fireworks'), FAST ? 500 : 4500);
    return st;
  }

  function showPassport() {
    Sound.play('tap');
    const p = Store.load().stamps;
    $('stamps').innerHTML = D.stops.stops.map(s => {
      const g = p[s.id];
      return `<div><div class="stamp${g ? '' : ' empty'}"><span class="e">${s.emoji}</span>${s.name}${g ? `<span class="cnt">×${g.count}</span>` : ''}</div></div>`;
    }).join('');
    show('passport');
    const n = Object.keys(p).length;
    Sound.say(n ? `你已經蒐集了${n}個印章！` : '還沒有印章，快去旅行吧！');
  }
  function backToMap() { Sound.play('tap'); drawMap(); $('map-prompt').textContent = '你想去哪裡玩？'; state.phase = 'idle'; show('map'); Sound.say('你想去哪裡玩？'); }

  $('btn-start').addEventListener('click', async () => {
    Sound.unlock(); Sound.play('good');
    try { await loadData(); } catch (e) { $('btn-start').textContent = '載入失敗，再按一次'; console.warn(e); return; }
    backToMap();
  });
  $('btn-passport').addEventListener('click', () => { if (!busy) showPassport(); });
  $('btn-passport2').addEventListener('click', showPassport);
  $('btn-again').addEventListener('click', backToMap);
  $('btn-back').addEventListener('click', backToMap);
})();
