// 關卡：數數看 / 比多少。答錯→正確答案發亮，不重來、不扣分、無倒數
const Levels = (() => {
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');

  function makeQuestion(type, cfg, prev) {
    const { min, max } = cfg.range;
    if (type === 'count') {
      let n = rnd(min, max); while (prev && n === prev.answer) n = rnd(min, max);
      const opts = new Set([n]);
      while (opts.size < 3) { const c = n + rnd(-3, 3); if (c >= min && c <= max) opts.add(c); }
      return { type, answer: n, options: shuffle([...opts]) };
    }
    let a, b; do { a = rnd(min, max); b = rnd(min, max); } while (b === a || (prev && a === prev.left && b === prev.right));
    return { type, left: a, right: b, answer: a > b ? 'left' : 'right' };
  }

  // ui: {title, dots, prompt, body, msg}; 回傳 Promise 於完成時 resolve
  function run(type, themes, cfg, ui, opts = {}) {
    themes = Array.isArray(themes) ? themes : [themes];
    const n = rnd(cfg.questionsPerLevel.min, cfg.questionsPerLevel.max);
    const tcfg0 = cfg[type], prompts = tcfg0.prompts || [tcfg0.prompt];
    const tq = shuffle([...themes]), pq = shuffle([...prompts]);
    const qs = []; for (let k = 0; k < n; k++) { const q = makeQuestion(type, cfg, qs[k - 1]); q.theme = tq[k % tq.length]; q.prompt = pq[k % pq.length]; qs.push(q); }
    const tcfg = cfg[type];
    ui.title.textContent = tcfg.title;
    const api = { questions: qs, index: 0 };
    return { api, done: new Promise(resolve => {
      let i = 0;
      function dots() { ui.dots.innerHTML = qs.map((_, k) => `<span class="${k < i ? 'on' : ''}"></span>`).join(''); }
      function next() {
        dots(); api.index = i;
        if (i >= qs.length) { resolve(); return; }
        const q = qs[i], theme = q.theme; ui.msg.textContent = ''; ui.body.innerHTML = '';
        const prompt = fill(q.prompt, theme); ui.prompt.textContent = prompt; Sound.say(prompt);
        let locked = false;
        const answered = (correct, el, rightEl) => {
          if (locked) return;
          if (correct) {
            locked = true; Sound.play('good'); el.classList.add('right');
            const p = cfg.praise[rnd(0, cfg.praise.length - 1)]; ui.msg.textContent = p; Sound.say(p);
            setTimeout(() => { i++; next(); }, opts.fast ? 50 : 1200);
          } else {
            Sound.play('soft'); el.classList.add('wrong'); setTimeout(() => el.classList.remove('wrong'), 450);
            rightEl.classList.add('glow'); ui.msg.textContent = cfg.hint; Sound.say(cfg.hint);
          }
        };
        if (q.type === 'count') {
          const objs = document.createElement('div'); objs.className = 'objects';
          objs.textContent = theme.emoji.repeat(q.answer);
          objs.innerHTML = Array(q.answer).fill(`<span>${theme.emoji}</span>`).join('');
          const row = document.createElement('div'); row.className = 'numrow';
          const btns = q.options.map(v => { const b = document.createElement('button'); b.className = 'numbtn'; b.textContent = v; b.dataset.value = v; row.appendChild(b); return b; });
          const rightEl = btns.find(b => +b.dataset.value === q.answer);
          btns.forEach(b => b.addEventListener('click', () => answered(+b.dataset.value === q.answer, b, rightEl)));
          ui.body.append(objs, row);
        } else {
          const wrap = document.createElement('div'); wrap.className = 'groups';
          const mk = (side, cnt) => { const g = document.createElement('button'); g.className = 'group'; g.dataset.side = side; g.innerHTML = Array(cnt).fill(`<span>${theme.emoji}</span>`).join(''); wrap.appendChild(g); return g; };
          const L = mk('left', q.left), R = mk('right', q.right), rightEl = q.answer === 'left' ? L : R;
          [L, R].forEach(g => g.addEventListener('click', () => answered(g.dataset.side === q.answer, g, rightEl)));
          ui.body.append(wrap);
        }
      }
      next();
    }) };
  }
  return { run, makeQuestion };
})();
