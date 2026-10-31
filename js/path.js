// 共用的沿路徑移動邏輯：建立 SVG path，並讓任何元素沿著它跑
const PathAnim = (() => {
  function smoothD(pts) {
    if (pts.length < 3) return 'M' + pts.map(p => p.join(',')).join(' L');
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += ` Q${pts[i][0]},${pts[i][1]} ${mx},${my}`;
    }
    const l = pts[pts.length - 1]; return d + ` L${l[0]},${l[1]}`;
  }
  // el: SVG 元素（會設 transform）；回傳 Promise
  function follow(pathEl, el, duration) {
    const len = pathEl.getTotalLength();
    return new Promise(res => {
      const t0 = performance.now();
      function step(now) {
        const k = Math.min(1, (now - t0) / duration);
        const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const p = pathEl.getPointAtLength(e * len), q = pathEl.getPointAtLength(Math.min(len, e * len + 1));
        const flip = q.x < p.x - 0.01 ? -1 : 1;
        el.setAttribute('transform', `translate(${p.x},${p.y}) scale(${flip},1)`);
        if (k < 1) requestAnimationFrame(step); else res();
      }
      requestAnimationFrame(step);
    });
  }
  return { smoothD, follow };
})();
