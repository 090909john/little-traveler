// 簡單 WebAudio 音效 + Web Speech 語音（v1 佔位，v2 改預錄 mp3）
const Sound = (() => {
  let ctx = null;
  function unlock() {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
      s.buffer = b; s.connect(ctx.destination); s.start(0);
    } catch (e) { /* 無音效也能玩 */ }
    if ('speechSynthesis' in window) { try { const u = new SpeechSynthesisUtterance(''); speechSynthesis.speak(u); } catch (e) {} }
  }
  function tone(freq, dur, type = 'sine', when = 0, vol = 0.25) {
    if (!ctx) return;
    const t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const fx = {
    tap: () => tone(660, 0.12, 'triangle'),
    good: () => { tone(523, .15, 'triangle'); tone(659, .15, 'triangle', .12); tone(784, .25, 'triangle', .24); },
    soft: () => { tone(392, .2, 'sine'); tone(330, .3, 'sine', .15); },
    train: () => { tone(880, .3, 'square', 0, .08); tone(698, .4, 'square', .3, .08); },
    car: () => { tone(440, .15, 'square', 0, .08); tone(440, .15, 'square', .2, .08); },
    ship: () => tone(110, .9, 'sawtooth', 0, .12),
    stamp: () => { tone(150, .2, 'square', 0, .2); tone(80, .3, 'sine', .02, .3); },
    pop: () => tone(200 + Math.random() * 600, .15, 'sine', 0, .12),
  };
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = (vs.find(x=>/zh[-_]TW/i.test(x.lang)&&!/yue|canton|hong ?kong/i.test(x.name))||vs.find(x=>/cmn|zh[-_](CN|Hans|Hant-TW)|mandarin|普通話|國語/i.test(x.lang+' '+x.name)&&!/HK|yue|canton/i.test(x.lang+' '+x.name))||null);
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function say(text) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-TW'; u.rate = 0.9; u.pitch = 1.15; if (!voice) pickVoice(); if (voice) u.voice = voice;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  return { unlock, play: n => fx[n] && fx[n](), say };
})();
