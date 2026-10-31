// 護照存檔：每台裝置 localStorage，命名空間 key，日後可加 profile
const Store = (() => {
  const NS = 'littleTraveler.v1';
  let profile = 'default';
  const key = () => `${NS}.${profile}.passport`;
  function load() {
    try { return JSON.parse(localStorage.getItem(key())) || { stamps: {} }; } catch (e) { return { stamps: {} }; }
  }
  function save(d) { try { localStorage.setItem(key(), JSON.stringify(d)); } catch (e) {} }
  function addStamp(id) {
    const d = load(); const s = d.stamps[id] || { count: 0, first: Date.now() };
    s.count++; s.last = Date.now(); d.stamps[id] = s; save(d); return s;
  }
  return { load, addStamp, setProfile: p => { profile = p; }, key };
})();
