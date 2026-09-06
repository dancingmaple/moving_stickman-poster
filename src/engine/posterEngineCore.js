/* ============================================================================
   PosterEngine — 「行者 · 金句漫游」渲染引擎
   纯 JS、零依赖。同一份代码同时驱动 React 预览与导出的单文件 HTML。
   draw(t) 是关于 t 的纯函数:同一 t 恒定输出,便于逐帧录制。
   ========================================================================== */
(function (root) {
'use strict';
const W = 1080, H = 1920, GROUND = 1560, CHARX = 300, TAU = Math.PI * 2;
const LEAD = 900, TAIL = 340, BLEND = 520;

/* ---------- 小工具 ---------- */
const cl = (t, a, b) => { a = a == null ? 0 : a; b = b == null ? 1 : b; return t < a ? a : t > b ? b : t; };
const Eo = t => { t = cl(t); return 1 - Math.pow(1 - t, 3); };
const Eb = t => { t = cl(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const Ss = u => { u = cl(u); return u * u * u * (u * (u * 6 - 15) + 10); };
const sr = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const hash = k => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const h2r = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb = (a, al) => al == null ? 'rgb(' + a.map(Math.round).join(',') + ')' : 'rgba(' + a.map(Math.round).join(',') + ',' + al + ')';
const mixRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function dot(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const F_KAI = '"Ma Shan Zheng","Kaiti SC","STKaiti","KaiTi",cursive';
const F_SERIF = '"Noto Serif SC","Songti SC","STSong",serif';
const F_SANS = '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
const strip = s => String(s || '').replace(/[\s，。、！？；：,.!?;:「」『』《》“”‘’"'·—\-()（）]/g, '');
const DARK = '#2c2620';

/* ---------- 目录:时段 / 地形 / 天气 / 排版 / 人物 / 点缀 ---------- */
const TIMES = {
  dawn:  { name: '晨曦', sky: ['#e6ccd6', '#f3c7a4', '#f7dfb8'], ink: '#3a2a2e', acc: '#c8472b', night: 0.12, sunY: 560, sun: '#e8764a' },
  day:   { name: '白昼', sky: ['#f9f3e6', '#f3e2c4', '#ecd3ab'], ink: '#2c2620', acc: '#bf3b21', night: 0,    sunY: 250, sun: '#e8a05a' },
  dusk:  { name: '黄昏', sky: ['#9a7a92', '#dd9370', '#f2cf9c'], ink: '#2a1c22', acc: '#c8472b', night: 0.35, sunY: 600, sun: '#e2603a' },
  night: { name: '星夜', sky: ['#1c2740', '#33435e', '#4d5f7b'], ink: '#ecdfc4', acc: '#e0a080', night: 1,    sunY: 900, sun: '#e8a05a' },
};
const TERRAINS = {
  plain:    { name: '平原', far: x => 70 + 45 * Math.sin(x * .0028) + 22 * Math.sin(x * .0071 + 1), near: x => 34 + 22 * Math.sin(x * .0046 + 2) + 10 * Math.sin(x * .011) },
  mountain: { name: '群山', far: x => 250 + 140 * Math.abs(Math.sin(x * .0021 + .5)) + 50 * Math.sin(x * .0083), near: x => 110 + 95 * Math.abs(Math.sin(x * .0037 + 1.2)) + 26 * Math.sin(x * .012) },
  water:    { name: '江湖', far: x => 95 + 28 * Math.sin(x * .0019) + 10 * Math.sin(x * .006), near: () => 0, water: true },
  city:     { name: '古城', far: x => { const k = Math.floor(x / 110), f = x / 110 - k; return 90 + hash(k) * 150 + Math.max(0, 1 - Math.abs(f - .5) * 2.6) * 34; }, near: x => { const k = Math.floor(x / 160), f = x / 160 - k; return 40 + hash(k + 99) * 60 + Math.max(0, 1 - Math.abs(f - .5) * 2.4) * 24; } },
  bamboo:   { name: '竹林', far: x => 120 + 40 * Math.sin(x * .0025), near: () => 0, bamboo: true },
  desert:   { name: '大漠', far: x => 150 + 90 * Math.sin(x * .0016) + 20 * Math.sin(x * .005), near: x => 70 + 45 * Math.sin(x * .0027 + 1) },
};
const WEATHERS = { none: '无', rain: '细雨', snow: '飞雪', leaf: '落叶', petal: '花瓣' };
const LAYOUTS = { popH: '错落横排', vertical: '竖排长题', stair: '阶梯落字', card: '宣纸卡片', fan: '扇面题画', scroll: '手卷横批' };
const WALKERS = { scholar: '书生(长衫·书箱)', traveler: '背包客(现代)', monk: '行脚僧(斗笠·锡杖)', girl: '汉服少女(飘带)', classic: '原版小人(保持原形态)' };
const HATS = { auto: '随人物', none: '无', straw: '草帽', bamboo: '斗笠', cap: '鸭舌帽' };
const COMPANIONS = { none: '无', dog: '小狗', bird: '小鸟' };
const DECORS = {
  sign: { name: '路牌', n: [1, 1], layer: 1 }, tree: { name: '杂树', n: [2, 3], layer: 1 }, pine: { name: '松树', n: [2, 2], layer: 1 },
  willow: { name: '垂柳', n: [1, 2], layer: 1 }, plum: { name: '梅花', n: [1, 2], layer: 1 }, grass: { name: '草丛', n: [6, 9], layer: 1 },
  stones: { name: '石头', n: [3, 4], layer: 1 }, flowers: { name: '野花', n: [4, 6], layer: 1 }, pavilion: { name: '凉亭', n: [1, 1], layer: 1, par: .8 },
  bridge: { name: '拱桥', n: [1, 1], layer: 1, par: .8 }, paifang: { name: '牌坊', n: [1, 1], layer: 1 }, lanternPole: { name: '灯笼杆', n: [2, 3], layer: 1 },
  milestone: { name: '里程碑', n: [1, 1], layer: 1 }, boat: { name: '小舟', n: [1, 2], layer: 0, par: .5 }, pagoda: { name: '远塔', n: [1, 1], layer: 0, par: .25 },
  birds: { name: '飞鸟', n: [2, 3], layer: 2 }, geese: { name: '雁阵', n: [1, 1], layer: 2 }, butterfly: { name: '蝴蝶', n: [1, 2], layer: 2 },
  kite: { name: '纸鸢', n: [1, 1], layer: 2 }, skyLantern: { name: '孔明灯', n: [2, 3], layer: 2 }, fireflies: { name: '萤火', n: [8, 8], layer: 2 },
};

/* ---------- 默认配置(5 段文案) ---------- */
function defaultConfig() {
  return {
    title: '行者 · 金句漫游', subtitle: '一直走的海报', speed: 150, seed: 7,
    walker: { style: 'scholar', size: 1, hat: 'auto', staff: true, scarf: false, umbrella: 'auto', lantern: 'auto', companion: 'dog' },
    show: { intro: true, footprints: true, infobar: true, milestones: true },
    scenes: [
      { id: 's1', label: '其一', name: '道德经', quote: '千里之行', sub: '始于足下。', source: '——《道德经》', seal: '道', layout: 'popH', time: 'day', terrain: 'plain', weather: 'none', decor: ['sign', 'tree', 'grass', 'birds', 'flowers', 'milestone'], image: 'builtin:1', width: 1400 },
      { id: 's2', label: '其二', name: '离骚', quote: '路漫漫其修远兮', sub: '吾将上下而求索。', source: '—— 屈原《离骚》', seal: '骚', layout: 'vertical', time: 'dusk', terrain: 'mountain', weather: 'leaf', decor: ['sign', 'pine', 'stones', 'geese', 'pagoda', 'paifang'], image: 'builtin:2', width: 1400 },
      { id: 's3', label: '其三', name: '终南别业', quote: '行到水穷处', sub: '坐看云起时。', source: '—— 王维《终南别业》', seal: '维', layout: 'fan', time: 'day', terrain: 'water', weather: 'none', decor: ['sign', 'willow', 'boat', 'bridge', 'butterfly', 'grass'], image: 'builtin:3', width: 1400 },
      { id: 's4', label: '其四', name: '定风波', quote: '莫听穿林打叶声', sub: '何妨吟啸且徐行。', source: '—— 苏轼《定风波》', seal: '坡', layout: 'card', time: 'dawn', terrain: 'bamboo', weather: 'rain', decor: ['sign', 'pavilion', 'stones', 'grass'], image: 'builtin:4', width: 1400 },
      { id: 's5', label: '其五', name: '行路难', quote: '长风破浪会有时', sub: '直挂云帆济沧海。', source: '—— 李白《行路难》', seal: '白', layout: 'scroll', time: 'night', terrain: 'city', weather: 'none', decor: ['sign', 'lanternPole', 'plum', 'skyLantern', 'fireflies', 'kite'], image: 'builtin:5', width: 1500 },
    ],
  };
}

/* ---------- 编译:配置 → 模型(世界坐标、时长、点缀实例) ---------- */
function compile(cfg) {
  const scenes = (cfg.scenes || []).map((s, i) => Object.assign({}, s, { idx: i, width: Math.max(900, +s.width || 1400), chars: [...strip(s.quote)].slice(0, 12) }));
  let x = LEAD;
  scenes.forEach(s => { s.start = x; s.end = x + s.width; x += s.width; });
  const world = x + TAIL, speed = Math.max(60, +cfg.speed || 150);
  const T = (world - W) / speed;
  const camAt = t => cl(t, 0, T) * speed;
  scenes.forEach(s => { s.tStart = Math.max(0, (s.start + 120 - W) / speed); });
  const items = [], stalks = [];
  const seed = +cfg.seed || 7;
  scenes.forEach(s => {
    (s.decor || []).forEach(name => {
      const D = DECORS[name]; if (!D) return;
      const R = sr(seed * 7919 + s.idx * 131 + hashStr(name));
      const n = D.n[0] + Math.floor(R() * (D.n[1] - D.n[0] + 1));
      for (let k = 0; k < n; k++) {
        const it = { kind: name, layer: D.layer, par: D.par || 1, scene: s, s: .8 + R() * .5, ph: R() * TAU, k, r1: R(), r2: R() };
        if (name === 'sign') it.wx = s.start + 70;
        else it.wx = s.start + 230 + R() * (s.width - 330);
        if (D.layer === 2) it.y = 280 + R() * 420;
        items.push(it);
      }
    });
    if ((TERRAINS[s.terrain] || {}).bamboo) {
      const R = sr(seed * 31 + s.idx * 17 + 5);
      for (let k = 0; k < 16; k++) stalks.push({ wx: s.start - 200 + R() * (s.width + 300), h: 620 + R() * 460, lean: (R() - .5) * .08, ph: R() * TAU, par: .55 + R() * .2 });
    }
  });
  const order = { pagoda: 0, boat: 1, bridge: 2, pavilion: 3 };
  items.sort((a, b) => (a.layer - b.layer) || ((order[a.kind] || 5) - (order[b.kind] || 5)) || (a.wx - b.wx));
  const sceneIndexAt = t => { let i = 0; scenes.forEach((s, k) => { if (t >= s.tStart) i = k; }); return i; };
  const srt = () => {
    const ft = s => { const h = String(Math.floor(s / 3600)).padStart(2, '0'), m = String(Math.floor(s % 3600 / 60)).padStart(2, '0'), ss = (s % 60).toFixed(3).padStart(6, '0'); return h + ':' + m + ':' + ss.replace('.', ','); };
    return scenes.map((s, i) => {
      const t0 = s.tStart + 0.4, t1 = i < scenes.length - 1 ? scenes[i + 1].tStart - 0.2 : T;
      return (i + 1) + '\n' + ft(t0) + ' --> ' + ft(Math.max(t0 + 1, t1)) + '\n' + [s.quote, s.sub, s.source].filter(Boolean).join('') + '\n';
    }).join('\n');
  };
  return { cfg, scenes, world, speed, T, camAt, items, stalks, sceneIndexAt, srt, W, H };
}

/* ---------- 场景权重(按世界坐标平滑过渡:昼夜/地形/天气都由它驱动) ---------- */
function weightsAt(model, wx) {
  const n = model.scenes.length, w = new Array(n).fill(0);
  if (!n) return w;
  for (let i = 0; i < n; i++) {
    const s = model.scenes[i];
    const a = i === 0 ? 1 : Ss((wx - (s.start - BLEND / 2)) / BLEND);
    const b = i === n - 1 ? 1 : 1 - Ss((wx - (s.end - BLEND / 2)) / BLEND);
    w[i] = a * b;
  }
  return w;
}
function envAt(model, t) {
  const cam = model.camAt(t), cw = cam + CHARX, w = weightsAt(model, cam + W * .5);
  const sky = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], ink = [0, 0, 0], acc = [0, 0, 0], sun = [0, 0, 0];
  let night = 0, sunY = 0, tot = 0;
  const tw = { dawn: 0, day: 0, dusk: 0, night: 0 }, wea = { rain: 0, snow: 0, leaf: 0, petal: 0 }, ter = {};
  const add = (P, k) => {
    for (let j = 0; j < 3; j++) { const r = h2r(P.sky[j]); for (let q = 0; q < 3; q++) sky[j][q] += r[q] * k; }
    const I = h2r(P.ink), A = h2r(P.acc), S = h2r(P.sun);
    for (let q = 0; q < 3; q++) { ink[q] += I[q] * k; acc[q] += A[q] * k; sun[q] += S[q] * k; }
    night += P.night * k; sunY += P.sunY * k; tot += k;
  };
  if (!w.length) add(TIMES.day, 1);
  w.forEach((k, i) => {
    if (k <= 0) return; const s = model.scenes[i], P = TIMES[s.time] || TIMES.day;
    add(P, k); tw[s.time in tw ? s.time : 'day'] += k;
    if (wea[s.weather] != null) wea[s.weather] += k;
    ter[s.terrain] = (ter[s.terrain] || 0) + k;
  });
  if (tot > 0 && Math.abs(tot - 1) > 1e-3) { const f = 1 / tot; for (let j = 0; j < 3; j++) for (let q = 0; q < 3; q++) sky[j][q] *= f; for (let q = 0; q < 3; q++) { ink[q] *= f; acc[q] *= f; sun[q] *= f; } night *= f; sunY *= f; }
  const m = cl(night);
  return {
    t, cam, cw, w, sky: sky.map(v => rgb(v)), skyRGB: sky, ink: rgb(ink), inkRGB: ink, acc: rgb(acc), accRGB: acc, sun: rgb(sun), sunY, m, tw, wea, ter, model,
    inkA: a => rgb(ink, a), accA: a => rgb(acc, a),
    paper: rgb(mixRGB(h2r('#fdfaf2'), h2r('#2a3450'), m)),
  };
}

/* ---------- 程序化水墨插画(无配图 / 加载失败时的兜底) ---------- */
const _art = {};
function procArt(seed, time) {
  const key = seed + ':' + time; if (_art[key]) return _art[key];
  const P = TIMES[time] || TIMES.day, o = document.createElement('canvas'); o.width = o.height = 480; const g = o.getContext('2d');
  const sk = g.createLinearGradient(0, 0, 0, 480); sk.addColorStop(0, P.sky[0]); sk.addColorStop(.6, P.sky[1]); sk.addColorStop(1, P.sky[2]);
  g.fillStyle = sk; g.fillRect(0, 0, 480, 480);
  const R = sr(seed * 977 + 13), inkC = h2r(P.ink);
  const sunX = 120 + R() * 240, sunY = 90 + R() * 80;
  g.fillStyle = P.night > .5 ? 'rgba(233,223,200,.9)' : rgb(h2r(P.sun), .85); dot(g, sunX, sunY, 34);
  if (P.night > .5) { g.fillStyle = P.sky[0]; dot(g, sunX - 12, sunY - 8, 30); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(233,223,200,' + (.3 + R() * .6) + ')'; dot(g, R() * 480, R() * 260, .8 + R() * 1.4); } }
  for (let L = 0; L < 4; L++) {
    const base = 250 + L * 60, amp = 90 - L * 15, ph = R() * 10;
    g.fillStyle = rgb(inkC, .12 + L * .16); g.beginPath(); g.moveTo(0, 480);
    for (let x = 0; x <= 480; x += 8) g.lineTo(x, base - Math.abs(Math.sin(x * .011 + ph)) * amp - Math.sin(x * .03 + ph * 2) * amp * .2);
    g.lineTo(480, 480); g.closePath(); g.fill();
  }
  g.strokeStyle = rgb(inkC, .7); g.lineWidth = 2; g.lineCap = 'round';
  for (let i = 0; i < 3; i++) { const bx = 80 + R() * 300, by = 60 + R() * 120, s = 6 + R() * 6; g.beginPath(); g.moveTo(bx - s, by); g.quadraticCurveTo(bx - s / 2, by - s * .7, bx, by); g.quadraticCurveTo(bx + s / 2, by - s * .7, bx + s, by); g.stroke(); }
  g.fillStyle = 'rgba(191,59,33,.9)'; rr(g, 420, 420, 34, 34, 5); g.fill();
  _art[key] = o; return o;
}

/* ---------- 图片缓存 ---------- */
const imgCache = new Map();
function loadImg(url) {
  if (imgCache.has(url)) return imgCache.get(url);
  const e = { img: new Image(), ok: false, fail: false }; e.img.crossOrigin = 'anonymous';
  e.img.onload = () => { e.ok = true; }; e.img.onerror = () => { e.fail = true; };
  e.img.src = url; imgCache.set(url, e); return e;
}
function resolveUrl(u) { if (!u) return ''; if (u.indexOf('builtin:') === 0) return (root.PosterEngine && root.PosterEngine.assets && root.PosterEngine.assets[u]) || ''; return u; }

/* ---------- 入场进度:元素以屏幕 x 为准,从右缘滑入(d = 延后像素) ---------- */
const enter = (sx, d) => Eo(cl((W + 40 - sx - (d || 0)) / 260));

/* ---------- 元素库 ---------- */
function bigChar(c, env, ch, sx, y, size, col, d, rot) {
  if (sx < -size || sx > W + size) return; const p = enter(sx, d); if (p <= 0) return;
  c.save(); c.globalAlpha = Math.min(1, p * 1.4); c.translate(sx, y - (1 - p) * 36); const k = 1.35 - .35 * Eo(p); c.scale(k, k); c.rotate(rot || 0);
  c.font = '400 ' + size + 'px ' + F_KAI; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = env.accA(.22); c.fillText(ch, 4, 5);
  c.fillStyle = col; c.fillText(ch, 0, 0); c.restore();
}
function brush(c, env, sx1, sx2, y, col, d) {
  if (sx2 < -50 || sx1 > W + 50) return; const p = enter(sx1, d); if (p <= 0) return; const L = (sx2 - sx1) * p;
  c.save(); c.strokeStyle = col; c.lineCap = 'round'; const n = 16;
  for (let i = 0; i < n; i++) { const a = i / n, b = (i + 1) / n; c.lineWidth = 8 * (1 - a * .82) + 1.4; c.beginPath(); c.moveTo(sx1 + L * a, y + Math.sin(a * 6) * 2.2); c.lineTo(sx1 + L * b + .5, y + Math.sin(b * 6) * 2.2); c.stroke(); }
  c.restore();
}
function vrule(c, env, sx, y1, y2, col, d) {
  if (sx < -100 || sx > W + 100) return; const p = enter(sx, d); if (p <= 0) return;
  c.save(); c.strokeStyle = col; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx, y1); c.lineTo(sx, y1 + (y2 - y1) * p); c.stroke();
  if (p > .95) { c.fillStyle = col; dot(c, sx, y2, 5); } c.restore();
}
function text(c, env, txt, sx, y, size, col, d, opt) {
  opt = opt || {}; if (sx < -1200 || sx > W + 1200) return; const p = enter(sx, d); if (p <= 0) return;
  c.save(); c.globalAlpha = p * (opt.alpha == null ? 1 : opt.alpha); c.font = (opt.weight || 700) + ' ' + size + 'px ' + (opt.font || F_SERIF);
  c.fillStyle = col; c.textAlign = opt.align || 'left'; c.textBaseline = 'alphabetic';
  try { c.letterSpacing = (opt.spacing || 0) + 'px'; } catch (e) { }
  c.fillText(txt, sx, y - (1 - p) * 22); c.restore();
}
function vtext(c, env, txt, sx, y0, size, step, col, d, opt) {
  opt = opt || {}; if (sx < -200 || sx > W + 200) return; const base = (W + 40 - sx - (d || 0)) / 260; if (base <= 0) return;
  const chars = [...txt]; c.save(); c.font = (opt.weight || 400) + ' ' + size + 'px ' + (opt.font || F_KAI); c.textAlign = 'center'; c.textBaseline = 'middle';
  chars.forEach((ch, i) => {
    const p = Eo(cl(base - i * (opt.stagger == null ? .09 : opt.stagger))); if (p <= 0) return;
    c.save(); c.globalAlpha = Math.min(1, p * 1.4) * (opt.alpha == null ? 1 : opt.alpha); c.translate(sx, y0 + i * step - (1 - p) * 26);
    const k = opt.pop === false ? 1 : 1.3 - .3 * Eo(p); c.scale(k, k);
    if (opt.shadow) { c.fillStyle = env.accA(.22); c.fillText(ch, 3, 4); }
    c.fillStyle = col; c.fillText(ch, 0, 0); c.restore();
  });
  c.restore();
}
function tag(c, env, sx, y, label, d) {
  if (sx < -60 || sx > W + 60) return; const p = enter(sx, d); if (p <= 0) return; const chars = [...label]; const h = chars.length * 30 + 26, hh = h * Eo(p);
  c.save(); c.globalAlpha = p; c.translate(sx, y - (1 - p) * 20); c.fillStyle = env.acc;
  c.beginPath(); c.moveTo(-17, 0); c.lineTo(17, 0); c.lineTo(17, hh); c.lineTo(0, hh - 10); c.lineTo(-17, hh); c.closePath(); c.fill();
  c.fillStyle = '#fff8ee'; c.font = '500 21px ' + F_SANS; c.textAlign = 'center'; c.textBaseline = 'middle';
  chars.forEach((ch, i) => { if (13 + i * 30 + 15 > hh - 8) return; c.fillText(ch, 0, 13 + i * 30 + 12); }); c.restore();
}
function seal(c, env, sx, y, ch, d, size) {
  size = size || 60; if (sx < -100 || sx > W + 100) return; const p = enter(sx, d); if (p <= .75) return; const k = Eo(cl((p - .75) / .25));
  c.save(); c.translate(sx, y); c.rotate(-.14 + .1 * k); const s = 1.5 - .5 * k; c.scale(s, s); c.globalAlpha = k * .94;
  c.fillStyle = env.acc; rr(c, -size / 2, -size / 2, size, size, size * .16); c.fill();
  c.strokeStyle = 'rgba(255,245,230,.7)'; c.lineWidth = 1.6; rr(c, -size / 2 + 5, -size / 2 + 5, size - 10, size - 10, size * .09); c.stroke();
  c.fillStyle = '#fff8ee'; c.font = '400 ' + Math.round(size * .62) + 'px ' + F_KAI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, 0, 2); c.restore();
}
function watermark(c, env, ch, sx, y, size, d) {
  if (sx < -size || sx > W + size) return; const p = enter(sx, d); if (p <= 0) return;
  c.save(); c.globalAlpha = .07 * p; c.font = '400 ' + size + 'px ' + F_KAI; c.fillStyle = env.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, sx, y); c.restore();
}
function cover(c, im, x, y, w, h, t) {
  const iw = im.width || 1, ih = im.height || 1; const s = Math.max(w / iw, h / ih) * 1.06; const dw = iw * s, dh = ih * s;
  c.drawImage(im, x + w / 2 - dw / 2 + Math.sin(t * .4) * 4, y + h / 2 - dh / 2 + Math.cos(t * .3) * 3, dw, dh);
}
function mat(c, env, pathFn, sx, y) {
  c.save(); c.translate(sx, y); c.rotate(-.03); c.translate(-sx, -y); c.shadowColor = 'rgba(0,0,0,.22)'; c.shadowBlur = 26; c.shadowOffsetY = 10;
  c.fillStyle = 'rgba(250,244,230,.94)'; pathFn(c, 14); c.fill(); c.restore();
}
function picture(c, env, im, sx, y, w, h, shape, d, opt) {
  opt = opt || {}; if (sx < -w - 300 || sx > W + 300) return; const p = enter(sx, d); if (p <= 0) return; const dy = -(1 - p) * 26, k = Eo(p);
  const path = (cc, pad) => {
    pad = pad || 0;
    if (shape === 'circle') { const r = Math.min(w, h) / 2; cc.beginPath(); cc.arc(sx + w / 2, y + dy + h / 2, (r + pad) * (pad ? 1 : k), 0, TAU); }
    else if (shape === 'arch') { const r = w / 2 + pad; cc.beginPath(); cc.moveTo(sx - pad, y + dy + h + pad); cc.lineTo(sx - pad, y + dy + r); cc.arc(sx + w / 2, y + dy + r, r, Math.PI, 0); cc.lineTo(sx + w + pad, y + dy + h + pad); cc.closePath(); }
    else if (shape === 'fan') { const cx = sx + w / 2, cy = y + dy + h * 1.62, r2 = h * 1.62 + pad, r1 = h * .62 - pad, a0 = -Math.PI / 2 - .56, a1 = -Math.PI / 2 + .56; cc.beginPath(); cc.arc(cx, cy, r2, a0, a1); cc.arc(cx, cy, r1, a1, a0, true); cc.closePath(); }
    else { const r = (opt.r == null ? 20 : opt.r) + pad; rr(cc, sx - pad, y + dy - pad, w + pad * 2, h + pad * 2, r); }
  };
  c.save(); c.globalAlpha = p;
  if (opt.mat !== false) mat(c, env, path, sx + w / 2, y + h / 2);
  c.save(); path(c, 0); c.clip();
  if (shape !== 'circle') { c.translate(sx + w / 2, y + dy + h / 2); c.scale(.85 + .15 * k, .85 + .15 * k); c.translate(-sx - w / 2, -y - dy - h / 2); }
  cover(c, im, sx, y + dy, w, h, env.t);
  if (opt.tint) { c.fillStyle = opt.tint; c.fillRect(sx - 50, y + dy - 50, w + 100, h + 100); }
  c.restore();
  c.globalAlpha = p * .55; c.strokeStyle = opt.stroke || DARK; c.lineWidth = 2.2; path(c, 0); c.stroke();
  if (shape === 'fan') { c.globalAlpha = p * .35; c.lineWidth = 1.2; const cx = sx + w / 2, cy = y + dy + h * 1.62; for (let i = 1; i < 6; i++) { const a = -Math.PI / 2 - .56 + 1.12 * i / 6; c.beginPath(); c.moveTo(cx + Math.cos(a) * h * .62, cy + Math.sin(a) * h * .62); c.lineTo(cx + Math.cos(a) * h * 1.62, cy + Math.sin(a) * h * 1.62); c.stroke(); } }
  c.restore();
}
function paperCard(c, env, sx, y, w, h, d, rot) {
  if (sx < -w - 200 || sx > W + 200) return 0; const p = enter(sx, d); if (p <= 0) return 0;
  c.save(); c.globalAlpha = p; c.translate(sx + w / 2, y + h / 2 - (1 - p) * 30); c.rotate(rot || -.026); c.translate(-w / 2, -h / 2);
  c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 34; c.shadowOffsetY = 14; c.fillStyle = 'rgba(252,247,236,.93)'; rr(c, 0, 0, w, h, 6); c.fill();
  c.shadowColor = 'transparent'; c.strokeStyle = 'rgba(90,70,50,.45)'; c.lineWidth = 1.5; rr(c, 12, 12, w - 24, h - 24, 3); c.stroke();
  c.strokeStyle = 'rgba(90,70,50,.22)'; c.lineWidth = 4; rr(c, 4, 4, w - 8, h - 8, 5); c.stroke();
  c.strokeStyle = env.acc; c.lineWidth = 2; [[22, 22, 1, 1], [w - 22, 22, -1, 1], [22, h - 22, 1, -1], [w - 22, h - 22, -1, -1]].forEach(k => { c.beginPath(); c.moveTo(k[0] + k[2] * 14, k[1]); c.lineTo(k[0], k[1]); c.lineTo(k[0], k[1] + k[3] * 14); c.stroke(); });
  c.restore(); return p;
}
function scrollPaper(c, env, sx, y, w, h, d) {
  if (sx < -w - 200 || sx > W + 200) return 0; const p = enter(sx, d); if (p <= 0) return 0; const ww = w * Eo(p);
  c.save(); c.globalAlpha = Math.min(1, p * 1.3);
  c.shadowColor = 'rgba(0,0,0,.28)'; c.shadowBlur = 30; c.shadowOffsetY = 12; c.fillStyle = 'rgba(250,243,228,.95)'; c.fillRect(sx + w - ww, y, ww, h);
  c.shadowColor = 'transparent'; c.fillStyle = 'rgba(120,90,60,.18)'; c.fillRect(sx + w - ww, y + 14, ww, 2); c.fillRect(sx + w - ww, y + h - 16, ww, 2);
  const roller = (x) => { c.fillStyle = '#5a3d2b'; rr(c, x - 14, y - 22, 28, h + 44, 8); c.fill(); c.fillStyle = '#c99a3f'; rr(c, x - 9, y - 34, 18, 14, 4); c.fill(); rr(c, x - 9, y + h + 20, 18, 14, 4); c.fill(); };
  roller(sx + w); roller(sx + w - ww); c.restore(); return p;
}

/* ---------- 六种排版 ---------- */
const LAYOUT_FN = {
  popH(B) {
    const { c, env, s, X, chars, ink, acc, img } = B; const n = Math.max(chars.length, 1); const size = Math.min(170, Math.floor(780 / Math.max(n, 3))); const step = size * 1.04; const lx0 = 250; const span = step * (n - 1);
    tag(c, env, X(160), 330, s.label + ' · ' + s.name, 0);
    const offs = [0, 55, -28, 45, 8, 62, -12, 40, 20, 50, -20, 30];
    chars.forEach((ch, i) => bigChar(c, env, ch, X(lx0 + i * step), 470 + offs[i % offs.length] * size / 170, size, ink, i * 6, (hash(i + s.idx) - .5) * .07));
    brush(c, env, X(lx0 - size * .45), X(lx0 + span + size * .5), 470 + size * .5 + 42, acc, 90);
    const cx = lx0 + span * .72 + (n < 5 ? 260 : 130), r = 215;
    picture(c, env, img, X(cx - r), 870 - r, r * 2, r * 2, 'circle', 60, { stroke: ink });
    text(c, env, s.sub, X(lx0 + 6), 1195, 60, ink, 40, { spacing: 4 });
    text(c, env, s.source, X(lx0 + 8), 1262, 30, ink, 20, { font: F_SANS, weight: 500, alpha: .72 });
    seal(c, env, X(cx + 150), 1205, s.seal, 0, 64);
  },
  vertical(B) {
    const { c, env, s, X, chars, ink, acc, img } = B; const n = Math.max(chars.length, 1); const step = Math.min(118, Math.floor(830 / n)); const size = Math.min(104, Math.round(step * .88)); const lx = 250, y0 = 360;
    tag(c, env, X(lx - 96), 340, s.label + ' · ' + s.name, 0);
    vtext(c, env, chars.join(''), X(lx), y0, size, step, ink, 0, { shadow: true });
    vrule(c, env, X(lx + 78), y0 - 30, y0 + step * (n - 1) + 48, acc, 30);
    picture(c, env, img, X(lx + 190), 400, 380, 470, 'rect', 60, { stroke: ink, r: 18 });
    text(c, env, s.sub, X(lx + 190), 1010, 52, ink, 40, { spacing: 3 });
    text(c, env, s.source, X(lx + 192), 1080, 28, ink, 20, { font: F_SANS, weight: 500, alpha: .72 });
    seal(c, env, X(lx + 190 + 380 - 34), 1140, s.seal, 0, 60);
  },
  stair(B) {
    const { c, env, s, X, chars, ink, acc, img } = B; const n = Math.max(chars.length, 1); const size = Math.min(150, Math.floor(1000 / (0.85 * (n - 1) + 1))); const dx = size * .86, dy = size * .6, lx0 = 230;
    chars.forEach((ch, i) => bigChar(c, env, ch, X(lx0 + i * dx), 410 + i * dy, size, ink, i * 4, (hash(i * 3 + s.idx) - .5) * .06));
    brush(c, env, X(lx0 - 60), X(lx0 + (n - 1) * dx + size * .7), 410 + (n - 1) * dy + size * .55 + 18, acc, 60);
    vtext(c, env, s.source.replace(/^[—\-\s]+/, ''), X(lx0 + 8), 520, 26, 32, ink, 20, { font: F_SANS, weight: 500, alpha: .72, pop: false, stagger: .04 });
    picture(c, env, img, X(lx0 - 10), 900, 310, 400, 'arch', 60, { stroke: ink });
    text(c, env, s.sub, X(lx0 + 360), 1130, 56, ink, 30, { spacing: 3 });
    tag(c, env, X(lx0 + 360), 1170, s.label + ' · ' + s.name, 0);
    seal(c, env, X(lx0 + 430), 1240, s.seal, 0, 62);
  },
  card(B) {
    const { c, env, s, X, chars, img } = B; const n = Math.max(chars.length, 1); const lx0 = 250, cy = 360, cw = 620, ch = 790;
    tag(c, env, X(lx0 - 60), 340, s.label + ' · ' + s.name, 0);
    paperCard(c, env, X(lx0), cy, cw, ch, 0);
    const size = Math.min(92, Math.floor(560 / n)), step = Math.min(size * 1.12, Math.floor(600 / n));
    vtext(c, env, chars.join(''), X(lx0 + 470), cy + 90, size, step, DARK, 40, { shadow: true });
    vrule(c, env, X(lx0 + 400), cy + 60, cy + 60 + step * (n - 1) + 60, env.acc, 70);
    vtext(c, env, strip(s.sub), X(lx0 + 330), cy + 130, 50, 60, DARK, 80, { font: F_SERIF, weight: 700, alpha: .82, pop: false, stagger: .06 });
    text(c, env, s.source, X(lx0 + 60), cy + ch - 60, 26, DARK, 60, { font: F_SANS, weight: 500, alpha: .7 });
    seal(c, env, X(lx0 + 120), cy + ch - 170, s.seal, 40, 66);
    picture(c, env, img, X(lx0 + cw - 150), cy - 120, 300, 300, 'circle', 30, { stroke: DARK });
  },
  fan(B) {
    const { c, env, s, X, chars, ink, acc, img } = B; const n = Math.max(chars.length, 1); const cx = 640; const fw = 720, fh = 420;
    watermark(c, env, chars[0] || '行', X(cx + 120), 720, 760, 0);
    tag(c, env, X(180), 340, s.label + ' · ' + s.name, 0);
    picture(c, env, img, X(cx - fw / 2), 400, fw, fh, 'fan', 20, { stroke: ink });
    const size = Math.min(122, Math.floor(880 / n)), step = size * 1.05, span = step * (n - 1);
    chars.forEach((ch, i) => bigChar(c, env, ch, X(cx - span / 2 + i * step), 1010, size, ink, 40 + i * 5, (hash(i * 7 + s.idx) - .5) * .05));
    brush(c, env, X(cx - span / 2 - size * .6), X(cx + span / 2 + size * .6), 1010 + size * .5 + 26, acc, 90);
    text(c, env, s.sub, X(cx), 1215, 52, ink, 60, { align: 'center', spacing: 5 });
    text(c, env, s.source, X(cx), 1280, 28, ink, 50, { align: 'center', font: F_SANS, weight: 500, alpha: .72 });
    seal(c, env, X(cx + 330), 1250, s.seal, 20, 58);
  },
  scroll(B) {
    const { c, env, s, X, chars, ink, img } = B; const n = Math.max(chars.length, 1); const lx0 = 170, py = 560, pw = 880, ph = 430;
    watermark(c, env, chars[0] || '行', X(lx0 + 760), 360, 440, 0);
    text(c, env, s.label + ' · ' + s.name, X(lx0 + 30), 520, 34, ink, 20, { font: F_KAI, weight: 400, alpha: .85, spacing: 6 });
    brush(c, env, X(lx0 + 30), X(lx0 + 300), 532, env.acc, 30);
    scrollPaper(c, env, X(lx0), py, pw, ph, 0);
    picture(c, env, img, X(lx0 + 56), py + 64, 300, 300, 'rect', 40, { stroke: DARK, r: 6, mat: false });
    const size = Math.min(96, Math.floor(470 / n));
    text(c, env, chars.join(''), X(lx0 + 400), py + 175, size, DARK, 60, { font: F_KAI, weight: 400, spacing: 6 });
    brush(c, env, X(lx0 + 400), X(lx0 + 400 + size * n + 10), py + 205, env.acc, 90);
    text(c, env, s.sub, X(lx0 + 402), py + 268, 40, DARK, 70, { spacing: 2 });
    text(c, env, s.source, X(lx0 + 402), py + 322, 25, DARK, 60, { font: F_SANS, weight: 500, alpha: .7 });
    seal(c, env, X(lx0 + pw - 60), py + ph - 68, s.seal, 40, 56);
  },
};

/* ---------- 地形 / 环境层 ---------- */
function ridge(c, env, par, baseY, alpha, off) {
  const model = env.model; c.fillStyle = env.inkA(alpha); c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 20) {
    const L = x + env.cam * par + off; const w = weightsAt(model, (L - 540) / par + 540); let h = 0;
    w.forEach((k, i) => { if (k <= 0) return; const T = TERRAINS[model.scenes[i].terrain] || TERRAINS.plain; h += k * (par < .3 ? T.far(L) : T.near(L)); });
    c.lineTo(x, baseY - h);
  }
  c.lineTo(W, H); c.closePath(); c.fill();
}
function waterBand(c, env) {
  const k = env.ter.water || 0; if (k <= .01) return; c.save(); c.globalAlpha = k;
  const g = c.createLinearGradient(0, 1395, 0, GROUND); g.addColorStop(0, rgb(env.skyRGB[1], .55)); g.addColorStop(1, rgb(env.skyRGB[2], .15)); c.fillStyle = g; c.fillRect(0, 1395, W, GROUND - 1395);
  c.strokeStyle = env.inkA(.28); c.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) { const y = 1408 + i * 12 + Math.sin(env.t + i) * 1.5; const off = (env.t * (10 + i * 3) + i * 97) % 140; for (let x = -140 + off; x < W; x += 140) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 40 + i * 4, y); c.stroke(); } }
  if (env.m > .05) { const mx = 830 - env.cam * .015; c.globalAlpha = k * env.m * .5; c.fillStyle = '#e9dfc8'; for (let i = 0; i < 8; i++) { c.fillRect(mx - 30 + Math.sin(env.t * 2 + i) * 10, 1410 + i * 16, 60 - i * 5, 2); } }
  c.restore();
}
function bambooLayer(c, env) {
  const t = env.t; env.model.stalks.forEach(st => {
    const sx = W / 2 + (st.wx - env.cam - W / 2) * st.par; if (sx < -60 || sx > W + 60) return;
    const sway = Math.sin(t * .8 + st.ph) * 6; c.save(); c.globalAlpha = .28 + .1 * st.par; c.strokeStyle = env.ink; c.lineWidth = 5 * st.par + 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(sx, GROUND - 20); c.quadraticCurveTo(sx + st.lean * 300, GROUND - st.h * .5, sx + st.lean * 500 + sway, GROUND - st.h); c.stroke();
    c.lineWidth = 2; for (let y = 90; y < st.h; y += 92) { const f = y / st.h; const px = sx + st.lean * 300 * 2 * f * (1 - f) + (st.lean * 500 + sway) * f * f; c.beginPath(); c.moveTo(px - 6, GROUND - y); c.lineTo(px + 6, GROUND - y); c.stroke(); }
    c.lineWidth = 2.4; for (let i = 0; i < 5; i++) { const f = .45 + i * .12; const px = sx + st.lean * 300 * 2 * f * (1 - f) + (st.lean * 500 + sway) * f * f, py = GROUND - st.h * f; const dir = i % 2 ? 1 : -1; c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + dir * 26, py - 8 + sway * .3, px + dir * 50, py + 6); c.stroke(); c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + dir * 20, py + 10, px + dir * 42, py + 22); c.stroke(); }
    c.restore();
  });
}

/* ---------- 点缀元素库 ---------- */
const DRAW = {
  sign(c, env, it, sx) { const p = Eo(cl((env.cw - it.wx + 150) / 260)); if (p <= 0) return; c.save(); c.globalAlpha = p; c.translate(sx, GROUND); c.scale(Eb(p), Eb(p)); c.strokeStyle = env.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -98); c.stroke(); c.fillStyle = env.acc; c.beginPath(); c.moveTo(-14, -152); c.lineTo(62, -152); c.lineTo(80, -126); c.lineTo(62, -100); c.lineTo(-14, -100); c.closePath(); c.fill(); c.fillStyle = '#fff8ee'; c.font = '400 30px ' + F_KAI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(it.scene.label, 26, -126); c.restore(); },
  tree(c, env, it, sx) { const s = it.s, sw = Math.sin(env.t * .9 + it.ph) * 2; c.save(); c.translate(sx, GROUND); c.scale(s, s); c.strokeStyle = env.ink; c.fillStyle = env.ink; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(3, -40, -2 + sw * .3, -78); c.stroke(); c.globalAlpha = .75; dot(c, -2 + sw, -92, 26); dot(c, -20 + sw, -76, 17); dot(c, 16 + sw, -74, 15); c.restore(); },
  pine(c, env, it, sx) { const s = it.s * 1.1; c.save(); c.translate(sx, GROUND); c.scale(s, s); c.strokeStyle = env.ink; c.fillStyle = env.ink; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -60); c.stroke(); c.globalAlpha = .7; for (let i = 0; i < 3; i++) { const y = -60 - i * 34, w = 46 - i * 10; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(0, y - 6, w, y); c.lineTo(0, y - 46); c.closePath(); c.fill(); } c.restore(); },
  willow(c, env, it, sx) { const s = it.s, t = env.t; c.save(); c.translate(sx, GROUND); c.scale(s, s); c.strokeStyle = env.ink; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-6, -60, 8, -120); c.stroke(); c.lineWidth = 2; c.globalAlpha = .6; for (let i = 0; i < 9; i++) { const a = -1.4 + i * .35, sw = Math.sin(t * 1.1 + i + it.ph) * 10; c.beginPath(); c.moveTo(8, -120); c.quadraticCurveTo(8 + Math.cos(a) * 40 + sw * .3, -120 + 10, 8 + Math.cos(a) * 46 + sw, -120 + 70 + Math.abs(Math.cos(a)) * 30); c.stroke(); } c.restore(); },
  plum(c, env, it, sx) { const s = it.s; c.save(); c.translate(sx, GROUND); c.scale(s, s); c.strokeStyle = env.ink; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(4, -50, -8, -90); c.moveTo(-3, -50); c.quadraticCurveTo(20, -70, 36, -104); c.moveTo(-6, -80); c.quadraticCurveTo(-30, -96, -40, -122); c.stroke(); c.fillStyle = env.m > .5 ? '#f0b0b8' : '#e2848f'; [[-8, -92], [30, -100], [36, -108], [-38, -120], [-26, -100], [10, -66], [-14, -114], [22, -84]].forEach(q => { for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; dot(c, q[0] + Math.cos(a) * 4, q[1] + Math.sin(a) * 4, 2.6); } }); c.restore(); },
  grass(c, env, it, sx) { const s = it.s * .9, sw = Math.sin(env.t * 1.6 + it.ph) * 3; c.save(); c.translate(sx, GROUND + 2); c.scale(s, s); c.strokeStyle = env.ink; c.globalAlpha = .55; c.lineWidth = 2.2; c.lineCap = 'round'; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 4, 0); c.quadraticCurveTo(i * 8 + sw * .5, -16, i * 12 + sw, -28 - Math.abs(i) * -4); c.stroke(); } c.restore(); },
  stones(c, env, it, sx) { c.save(); c.translate(sx, GROUND); c.scale(it.s, it.s); c.fillStyle = env.inkA(.3); c.strokeStyle = env.inkA(.6); c.lineWidth = 2; c.beginPath(); c.ellipse(0, -8, 20, 10, 0, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.ellipse(24, -6, 12, 7, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); },
  flowers(c, env, it, sx) { const sw = Math.sin(env.t * 1.8 + it.ph) * 2; c.save(); c.translate(sx, GROUND); c.scale(it.s, it.s); c.strokeStyle = env.inkA(.6); c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(2, -14, sw, -30); c.stroke(); c.fillStyle = it.r1 > .5 ? env.acc : '#e6b84a'; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + env.t * .2; dot(c, sw + Math.cos(a) * 4.5, -30 + Math.sin(a) * 4.5, 2.8); } c.fillStyle = '#fff3d0'; dot(c, sw, -30, 2); c.restore(); },
  pavilion(c, env, it, sx) { c.save(); c.translate(sx, GROUND - 26); c.scale(1.05, 1.05); c.globalAlpha = .82; c.strokeStyle = env.ink; c.fillStyle = env.inkA(.55); c.lineWidth = 3.5; c.lineCap = 'round'; [-46, -18, 18, 46].forEach(x => { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, -96); c.stroke(); }); c.beginPath(); c.moveTo(-60, 0); c.lineTo(60, 0); c.moveTo(-46, -30); c.lineTo(46, -30); c.stroke(); c.beginPath(); c.moveTo(-88, -96); c.quadraticCurveTo(-30, -112, 0, -160); c.quadraticCurveTo(30, -112, 88, -96); c.quadraticCurveTo(30, -104, 0, -102); c.quadraticCurveTo(-30, -104, -88, -96); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(0, -160); c.lineTo(0, -176); c.stroke(); dot(c, 0, -178, 4); c.restore(); },
  bridge(c, env, it, sx) { c.save(); c.translate(sx, GROUND - 22); c.globalAlpha = .8; c.strokeStyle = env.ink; c.fillStyle = env.inkA(.35); c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-170, 0); c.quadraticCurveTo(0, -150, 170, 0); c.lineTo(120, 0); c.quadraticCurveTo(0, -95, -120, 0); c.closePath(); c.fill(); c.stroke(); c.lineWidth = 2.5; for (let i = -4; i <= 4; i++) { const x = i * 36, y = -75 * (1 - (x / 170) * (x / 170)) - 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 26); c.stroke(); } c.beginPath(); c.moveTo(-150, -32); c.quadraticCurveTo(0, -130, 150, -32); c.stroke(); c.restore(); },
  paifang(c, env, it, sx) { c.save(); c.translate(sx, GROUND); c.strokeStyle = env.ink; c.fillStyle = env.inkA(.7); c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-90, 0); c.lineTo(-90, -250); c.moveTo(90, 0); c.lineTo(90, -250); c.stroke(); c.lineWidth = 5; c.beginPath(); c.moveTo(-120, -200); c.lineTo(120, -200); c.moveTo(-100, -250); c.lineTo(100, -250); c.stroke(); c.beginPath(); c.moveTo(-140, -258); c.quadraticCurveTo(-60, -270, 0, -272); c.quadraticCurveTo(60, -270, 140, -258); c.quadraticCurveTo(60, -286, 0, -292); c.quadraticCurveTo(-60, -286, -140, -258); c.closePath(); c.fill(); c.fillStyle = env.acc; rr(c, -46, -246, 92, 40, 3); c.fill(); c.fillStyle = '#fff8ee'; c.font = '400 26px ' + F_KAI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(it.scene.name.slice(0, 3), 0, -226); c.restore(); },
  lanternPole(c, env, it, sx) { const t = env.t, sw = Math.sin(t * 1.4 + it.ph) * .08, m = Math.max(env.m, .15); c.save(); c.translate(sx, GROUND); c.strokeStyle = env.ink; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -230); c.lineTo(46, -224); c.stroke(); c.translate(46, -224); c.rotate(sw); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 18); c.stroke(); c.globalAlpha = m; const gl = c.createRadialGradient(0, 44, 0, 0, 44, 90); gl.addColorStop(0, 'rgba(255,170,90,.45)'); gl.addColorStop(1, 'rgba(255,170,90,0)'); c.fillStyle = gl; dot(c, 0, 44, 90); c.globalAlpha = 1; c.fillStyle = mixLan(m); c.beginPath(); c.ellipse(0, 44, 22, 27, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(120,40,20,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-14, 30); c.lineTo(-14, 58); c.moveTo(0, 18); c.lineTo(0, 70); c.moveTo(14, 30); c.lineTo(14, 58); c.stroke(); c.fillStyle = '#e6b84a'; c.fillRect(-6, 70, 12, 10); c.restore(); },
  milestone(c, env, it, sx) { c.save(); c.translate(sx, GROUND); c.fillStyle = env.inkA(.2); c.strokeStyle = env.ink; c.lineWidth = 3; rr(c, -16, -66, 32, 66, 6); c.fill(); c.stroke(); c.fillStyle = env.ink; c.font = '500 16px ' + F_SANS; c.textAlign = 'center'; c.textBaseline = 'middle'; const li = String(Math.round(it.wx / 8)); [...li, '里'].forEach((ch, i) => c.fillText(ch, 0, -54 + i * 16)); c.restore(); },
  boat(c, env, it, sx) { const t = env.t; const bx = sx + Math.sin(t * .2 + it.ph) * 20, by = 1436 + Math.sin(t * 1.2 + it.ph) * 3; c.save(); c.translate(bx, by); c.scale(it.s, it.s); c.strokeStyle = env.ink; c.fillStyle = env.inkA(.7); c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-46, -8); c.quadraticCurveTo(0, 12, 46, -8); c.quadraticCurveTo(52, -14, 60, -22); c.lineTo(-56, -20); c.closePath(); c.fill(); c.lineWidth = 2.5; c.beginPath(); c.moveTo(6, -20); c.lineTo(6, -46); c.stroke(); dot(c, 6, -50, 6); c.beginPath(); c.moveTo(12, -40); c.lineTo(30 + Math.sin(t * 1.2) * 4, -10); c.stroke(); c.beginPath(); c.moveTo(-36, -10); c.quadraticCurveTo(-18, -6, -4, -8); c.stroke(); c.globalAlpha = .3; c.beginPath(); c.moveTo(-60, 4); c.lineTo(70, 4); c.stroke(); c.restore(); },
  pagoda(c, env, it, sx) { c.save(); c.translate(sx, 1190); c.globalAlpha = .28; c.fillStyle = env.ink; for (let i = 0; i < 5; i++) { const w = 60 - i * 8, y = -i * 46; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(0, y - 8, w, y); c.lineTo(w * .7, y - 30); c.lineTo(-w * .7, y - 30); c.closePath(); c.fill(); c.fillRect(-w * .6, y - 30, w * 1.2, -16); } c.fillRect(-3, -260, 6, -34); c.restore(); },
  birds(c, env, it, sx) { const t = env.t, s = it.s; const bx = sx + Math.sin(t * .8 + it.ph) * 30; if (bx < -100 || bx > W + 100) return; const p = enter(bx, 40); if (p <= 0) return; c.save(); c.globalAlpha = p * .8; c.translate(bx, it.y + Math.sin(t * 1.3 + it.ph) * 8); c.scale(s * Eb(p), s * Eb(p)); c.strokeStyle = env.inkA(.8); c.lineWidth = 3.5; c.lineCap = 'round'; const f = Math.sin(t * 6 + it.ph) * 5; c.beginPath(); c.moveTo(-20, 0); c.quadraticCurveTo(-10, -12 - f, 0, 0); c.quadraticCurveTo(10, -12 - f, 20, 0); c.stroke(); c.restore(); },
  geese(c, env, it, sx) { const t = env.t; const bx = sx + t * 9, by = Math.min(it.y, 460); if (bx < -300 || bx > W + 300) return; c.save(); c.globalAlpha = .7; c.strokeStyle = env.inkA(.75); c.lineWidth = 2.6; c.lineCap = 'round'; for (let i = -3; i <= 3; i++) { const x = bx - Math.abs(i) * 34, y = by + Math.abs(i) * 22 + Math.sin(t * 2 + i) * 3, f = Math.sin(t * 5 + i) * 4; c.beginPath(); c.moveTo(x - 12, y); c.quadraticCurveTo(x - 6, y - 8 - f, x, y); c.quadraticCurveTo(x + 6, y - 8 - f, x + 12, y); c.stroke(); } c.restore(); },
  butterfly(c, env, it, sx) { const t = env.t; const bx = sx + Math.sin(t * 1.3 + it.ph) * 50, by = 1400 + Math.sin(t * 2.7 + it.ph) * 30 - it.r1 * 60; if (bx < -50 || bx > W + 50) return; c.save(); c.translate(bx, by); c.rotate(Math.sin(t * 1.3 + it.ph) * .3); const fl = Math.abs(Math.sin(t * 14 + it.ph)) * .8 + .2; c.fillStyle = it.r2 > .5 ? env.accA(.9) : 'rgba(230,184,74,.9)'; c.beginPath(); c.ellipse(-8 * fl, -4, 9 * fl, 7, 0, 0, TAU); c.ellipse(8 * fl, -4, 9 * fl, 7, 0, 0, TAU); c.ellipse(-6 * fl, 5, 6 * fl, 5, 0, 0, TAU); c.ellipse(6 * fl, 5, 6 * fl, 5, 0, 0, TAU); c.fill(); c.strokeStyle = env.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -10); c.lineTo(0, 10); c.stroke(); c.restore(); },
  kite(c, env, it, sx) { const t = env.t; const kx = sx + Math.sin(t * .7 + it.ph) * 40, ky = Math.min(it.y, 520) + Math.sin(t * 1.1) * 18; if (kx < -400 || kx > W + 100) return; c.save(); c.strokeStyle = env.inkA(.5); c.lineWidth = 1.5; c.beginPath(); c.moveTo(kx, ky + 30); c.quadraticCurveTo(kx - 160, ky + 200, kx - 320, ky + 520); c.stroke(); c.translate(kx, ky); c.rotate(-.5 + Math.sin(t * 1.1) * .15); c.fillStyle = env.acc; c.beginPath(); c.moveTo(0, -40); c.lineTo(28, 0); c.lineTo(0, 44); c.lineTo(-28, 0); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,240,220,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -40); c.lineTo(0, 44); c.moveTo(-28, 0); c.lineTo(28, 0); c.stroke(); c.strokeStyle = env.acc; c.lineWidth = 2.5; for (let i = 1; i <= 4; i++) { c.beginPath(); c.moveTo(-i * 14 + 4, 44 + i * 26 + Math.sin(t * 5 + i) * 6); c.lineTo(-i * 14 - 6, 44 + i * 26 + 10 + Math.sin(t * 5 + i) * 6); c.stroke(); } c.restore(); },
  skyLantern(c, env, it, sx) { const t = env.t, a = Math.max(env.m, .25); const f = ((it.ph / TAU) + t * .035 + it.k * .3) % 1; const lx = sx + Math.sin(t * .5 + it.ph) * 30, ly = 1000 - f * 800; const al = a * cl(f / .15) * cl((1 - f) / .2); if (al <= 0 || lx < -60 || lx > W + 60) return; c.save(); c.translate(lx, ly); c.globalAlpha = al; const gl = c.createRadialGradient(0, 0, 0, 0, 0, 60); gl.addColorStop(0, 'rgba(255,190,110,.5)'); gl.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = gl; dot(c, 0, 0, 60); c.fillStyle = 'rgba(255,200,120,.95)'; c.beginPath(); c.moveTo(-14, 20); c.lineTo(-18, -18); c.quadraticCurveTo(0, -30, 18, -18); c.lineTo(14, 20); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,140,60,.9)'; c.fillRect(-6, 20, 12, 3); c.restore(); },
  fireflies(c, env, it, sx) { const m = env.m; if (m <= .05) return; const t = env.t, fx = sx + Math.sin(t * .9 + it.ph) * 22, fy = 1230 + it.r1 * 290 + Math.cos(t * .7 + it.ph) * 16; if (fx < -50 || fx > W + 50) return; const pu = .5 + .5 * Math.sin(t * 3 + it.ph); c.save(); c.globalAlpha = m * (.3 + .6 * pu); const gl = c.createRadialGradient(fx, fy, 0, fx, fy, 14); gl.addColorStop(0, 'rgba(240,200,120,.8)'); gl.addColorStop(1, 'rgba(240,200,120,0)'); c.fillStyle = gl; dot(c, fx, fy, 14); c.fillStyle = '#f0c878'; dot(c, fx, fy, 2.5); c.restore(); },
};
function mixLan(m) { return rgb(mixRGB(h2r('#d8503a'), h2r('#ff8a5a'), m)); }

/* ---------- 天气粒子 ---------- */
const RAIN = [...Array(110)].map((_, i) => { const R = sr(i * 29 + 7); return { x: R() * 1400, y: R() * 1920, l: 16 + R() * 26, v: 820 + R() * 480, drift: 130 + R() * 90 }; });
const SNOW = [...Array(90)].map((_, i) => { const R = sr(i * 37 + 13); return { x: R() * 1400, y: R() * 1920, r: 1.2 + R() * 2.4, v: 55 + R() * 75, ph: R() * TAU, sw: 18 + R() * 34 }; });
const LEAF = [...Array(30)].map((_, i) => { const R = sr(i * 41 + 17); return { x: R() * 1400, y: R() * 1920, s: 5 + R() * 7, v: 70 + R() * 70, ph: R() * TAU, sw: 30 + R() * 50, rot: R() * TAU }; });
function weather(c, t, kind, k) {
  if (k <= .02) return;
  if (kind === 'rain') { c.save(); c.strokeStyle = 'rgba(205,220,235,' + (.42 * k) + ')'; c.lineWidth = 2; c.lineCap = 'round'; RAIN.forEach(d => { const sy = ((d.y + t * d.v) % (H + 140)) - 70, sx = ((d.x + t * d.drift) % 1400) - 160; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - d.drift * .055, sy + d.l); c.stroke(); }); c.restore(); }
  else if (kind === 'snow') { c.save(); c.fillStyle = 'rgba(246,249,253,1)'; SNOW.forEach(d => { const sy = ((d.y + t * d.v) % (H + 120)) - 60, sx = ((d.x + Math.sin(t * .85 + d.ph) * d.sw) % 1400) - 160; c.globalAlpha = k * (.5 + .5 * Math.sin(t * 1.3 + d.ph)); dot(c, sx, sy, d.r); }); c.restore(); }
  else if (kind === 'leaf' || kind === 'petal') { c.save(); LEAF.forEach(d => { const sy = ((d.y + t * d.v) % (H + 120)) - 60, sx = ((d.x + Math.sin(t * .7 + d.ph) * d.sw) % 1400) - 160; c.save(); c.globalAlpha = .85 * k; c.translate(sx, sy); c.rotate(d.rot + t * 1.2); c.fillStyle = kind === 'leaf' ? 'rgba(198,138,62,.9)' : 'rgba(240,170,185,.92)'; c.beginPath(); c.ellipse(0, 0, d.s * (kind === 'petal' ? .8 : 1), d.s * .45, 0, 0, TAU); c.fill(); c.restore(); }); c.restore(); }
}

/* ---------- 星 / 云 / 地面 ---------- */
const STARS = [...Array(90)].map((_, i) => { const R = sr(i * 13 + 5); return { x: R() * 2600, y: 60 + R() * 700, r: .8 + R() * 1.8, o: R() * TAU, big: R() > .85 }; });
const CLOUDS = [...Array(7)].map((_, i) => { const R = sr(i * 31 + 9); return { x: R() * 3000, y: 150 + R() * 380, s: .7 + R() * .9, o: R() * TAU }; });

/* ---------- 人物:骨骼步态(自然行走) + 多款造型 ---------- */
function rigWalker(c, env, wk, st, umbK, lan) {
  const t = env.t, ph = env.cw * .052, ink = env.ink, fill = env.paper, acc = env.acc;
  const L1 = 31, L2 = 30;
  const legAt = off => { const p = ph + off; const th = .58 * Math.sin(p); const sw = Math.max(0, Math.cos(p)); const tk = .12 + 1.05 * Math.pow(sw, 1.4); const kx = L1 * Math.sin(th), ky = L1 * Math.cos(th); return { kx, ky, fx: kx + L2 * Math.sin(th - tk), fy: ky + L2 * Math.cos(th - tk), sw }; };
  const nearLeg = legAt(0), farLeg = legAt(Math.PI);
  const hipY = -Math.max(nearLeg.fy, farLeg.fy);
  const sway = Math.sin(2 * ph) * .02;
  const neck = { x: 6, y: hipY - 38 }, sh = { x: 5, y: hipY - 33 };
  const head = { x: neck.x + 4, y: neck.y - 14 + Math.sin(2 * ph) * 1.2 };
  const armAt = off => { const p = ph + off; const ta = -.5 * Math.sin(p); const el = .55 + .25 * Math.max(0, Math.cos(p)); const ex = sh.x + 19 * Math.sin(ta), ey = sh.y + 19 * Math.cos(ta); return { ex, ey, hx: ex + 17 * Math.sin(ta + el), hy: ey + 17 * Math.cos(ta + el) }; };
  let nearArm = armAt(Math.PI), farArm = armAt(0);
  if (umbK > .5) nearArm = { ex: sh.x + 13, ey: sh.y + 14, hx: sh.x + 15, hy: sh.y - 2 };
  const holdStaff = wk.staff && st !== 'traveler' && st !== 'girl';
  if (holdStaff || (st === 'traveler' && wk.staff)) farArm = { ex: sh.x + 12, ey: sh.y + 14, hx: sh.x + 22, hy: sh.y + 22 };
  const wide = st === 'scholar' || st === 'monk' || st === 'girl';
  c.save(); c.rotate(sway); c.lineCap = 'round'; c.lineJoin = 'round';
  const seg = (x1, y1, x2, y2, x3, y3, w) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.lineWidth = w; c.stroke(); };
  const arm = (A, w) => { if (wide) { c.strokeStyle = ink; seg(sh.x, sh.y, A.ex, A.ey, A.hx, A.hy, 13); c.strokeStyle = fill; seg(sh.x, sh.y, A.ex, A.ey, A.hx, A.hy, 9); } else { c.strokeStyle = ink; seg(sh.x, sh.y, A.ex, A.ey, A.hx, A.hy, w || 3.2); } c.strokeStyle = ink; c.fillStyle = fill; c.lineWidth = 2.2; dot(c, A.hx, A.hy, 3.4); c.beginPath(); c.arc(A.hx, A.hy, 3.4, 0, TAU); c.stroke(); };
  const leg = (L, w) => { c.strokeStyle = ink; seg(0, hipY, L.kx, hipY + L.ky, L.fx, hipY + L.fy, w); c.lineWidth = w + .4; c.beginPath(); c.moveTo(L.fx - 2, hipY + L.fy); c.lineTo(L.fx + 10, hipY + L.fy - L.sw * 3); c.stroke(); if (st === 'traveler') { c.fillStyle = ink; c.beginPath(); c.ellipse(L.fx + 4, hipY + L.fy, 8, 3.5, -L.sw * .3, 0, TAU); c.fill(); } };
  const staff = A => { c.strokeStyle = ink; c.lineWidth = 3; const bx = A.hx + 10 + Math.sin(ph) * 8; c.beginPath(); c.moveTo(A.hx - 6 + (bx - A.hx) * -.7, A.hy - 60); c.lineTo(bx, 0); c.stroke(); if (st === 'monk') { const tx = A.hx - 6 + (bx - A.hx) * -.7, ty = A.hy - 60; c.lineWidth = 2.2; c.beginPath(); c.arc(tx, ty - 10, 10, 0, TAU); c.stroke(); c.beginPath(); c.arc(tx - 6, ty - 12, 3, 0, TAU); c.arc(tx + 6, ty - 12, 3, 0, TAU); c.stroke(); } };
  // ---- 后层 ----
  if (st === 'traveler') { c.fillStyle = acc; c.strokeStyle = ink; c.lineWidth = 2; rr(c, sh.x - 21, sh.y + 2, 15, 32, 5); c.fill(); c.stroke(); }
  if (st === 'scholar') { c.save(); c.translate(sh.x - 12, sh.y + 14); c.rotate(-.12); c.fillStyle = fill; c.strokeStyle = ink; c.lineWidth = 2.4; rr(c, -10, -12, 18, 30, 3); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-10, 0); c.lineTo(8, 0); c.stroke(); c.restore(); }
  if (st === 'girl') { c.strokeStyle = acc; c.lineWidth = 2.6; for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(head.x - 6, head.y - 6 + i * 4); c.quadraticCurveTo(head.x - 26, head.y + 4 + Math.sin(t * 3 + i) * 8, head.x - 52 - i * 6, head.y + 18 + Math.sin(t * 3.3 + i * 1.5) * 12); c.stroke(); } }
  if (wk.scarf) { c.strokeStyle = env.accA(.9); c.lineWidth = 7; c.beginPath(); c.moveTo(neck.x - 2, neck.y + 4); c.quadraticCurveTo(neck.x - 20, neck.y + 2 + Math.sin(t * 3) * 5, neck.x - 40, neck.y + 10 + Math.sin(t * 3 + 1) * 7); c.stroke(); }
  arm(farArm);
  if (holdStaff) staff(farArm);
  leg(farLeg, st === 'traveler' ? 4.6 : 3.4);
  // ---- 身体 ----
  if (wide) {
    const hem = st === 'girl' ? 54 : 40, hw = st === 'girl' ? 25 : 18, swg = Math.sin(ph) * 5, wv = Math.sin(t * 6) * 2;
    c.fillStyle = fill; c.strokeStyle = ink; c.lineWidth = 2.6; c.beginPath(); c.moveTo(sh.x - 11, sh.y + 2); c.lineTo(sh.x + 11, sh.y + 2); c.lineTo(hw + swg + 6, hipY + hem); c.quadraticCurveTo(swg, hipY + hem + 6 + wv, -hw + swg, hipY + hem); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(sh.x + 8, sh.y + 4); c.quadraticCurveTo(sh.x - 4, hipY - 12, 4, hipY + 2); c.stroke();
    if (st === 'monk') { c.strokeStyle = env.accA(.75); c.lineWidth = 6; c.beginPath(); c.moveTo(sh.x - 10, sh.y + 4); c.lineTo(10, hipY + 6); c.stroke(); c.fillStyle = ink; for (let i = 0; i < 7; i++) { const a = .3 + i * .4; dot(c, neck.x + Math.cos(a) * 12 - 3, neck.y + 6 + Math.sin(a) * 9, 1.6); } }
    if (st === 'girl') { c.strokeStyle = acc; c.lineWidth = 4; c.beginPath(); c.moveTo(-9, hipY - 4); c.lineTo(11, hipY - 4); c.stroke(); }
    if (st === 'scholar') { c.strokeStyle = ink; c.lineWidth = 3; c.beginPath(); c.moveTo(-6, hipY - 6); c.lineTo(10, hipY - 6); c.stroke(); }
  } else {
    const half = (hipY - sh.y) / 2; c.fillStyle = fill; c.strokeStyle = ink; c.lineWidth = 2.6; c.save(); c.translate(3, (sh.y + hipY) / 2); c.rotate(.06); rr(c, -11, -half - 6, 22, half * 2 + 12, 8); c.fill(); c.stroke(); c.restore();
    c.strokeStyle = ink; c.lineWidth = 2; c.beginPath(); c.moveTo(sh.x - 6, sh.y + 4); c.lineTo(sh.x - 3, hipY - 2); c.stroke();
  }
  leg(nearLeg, st === 'traveler' ? 4.6 : 3.4);
  // ---- 头 ----
  c.strokeStyle = ink; c.lineWidth = 3; c.fillStyle = fill; c.beginPath(); c.arc(head.x, head.y, 11.5, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = ink; dot(c, head.x + 5, head.y - 1, 1.6);
  const hat = wk.hat === 'auto' ? ({ scholar: 'bun', monk: 'bamboo', traveler: 'cap', girl: 'buns' })[st] : wk.hat;
  c.strokeStyle = ink; c.fillStyle = fill; c.lineWidth = 2.6;
  if (hat === 'bun') { c.beginPath(); c.arc(head.x - 3, head.y - 8, 13, Math.PI + .2, TAU - .6); c.stroke(); c.fillStyle = ink; dot(c, head.x - 3, head.y - 15, 5); c.beginPath(); c.moveTo(head.x - 14, head.y - 18); c.lineTo(head.x + 6, head.y - 13); c.lineWidth = 1.8; c.stroke(); }
  else if (hat === 'buns') { c.fillStyle = ink; dot(c, head.x - 9, head.y - 12, 5.5); dot(c, head.x + 5, head.y - 13, 5.5); c.beginPath(); c.arc(head.x - 1, head.y - 4, 12.5, Math.PI + .1, TAU - .4); c.lineWidth = 3; c.stroke(); }
  else if (hat === 'bamboo') { c.beginPath(); c.moveTo(head.x - 36, head.y - 6); c.lineTo(head.x + 1, head.y - 34); c.lineTo(head.x + 38, head.y - 6); c.closePath(); c.fill(); c.stroke(); c.lineWidth = 1.4; c.beginPath(); c.moveTo(head.x - 26, head.y - 13); c.lineTo(head.x + 28, head.y - 13); c.stroke(); c.beginPath(); c.moveTo(head.x - 4, head.y - 6); c.quadraticCurveTo(head.x + 2, head.y + 10, head.x + 8, head.y + 12); c.stroke(); }
  else if (hat === 'straw') { c.beginPath(); c.ellipse(head.x, head.y - 8, 26, 6, 0, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(head.x, head.y - 9, 12, Math.PI, 0); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = acc; c.lineWidth = 3; c.beginPath(); c.moveTo(head.x - 11, head.y - 10); c.lineTo(head.x + 11, head.y - 10); c.stroke(); }
  else if (hat === 'cap') { c.fillStyle = acc; c.beginPath(); c.arc(head.x, head.y - 4, 12.5, Math.PI + .1, TAU - .1); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(head.x + 4, head.y - 6); c.lineTo(head.x + 22, head.y - 4); c.lineTo(head.x + 8, head.y - 2); c.closePath(); c.fill(); c.stroke(); }
  else if (hat === 'none' && st === 'monk') { }
  // ---- 前层 ----
  arm(nearArm);
  if (st === 'traveler' && wk.staff) { c.strokeStyle = ink; c.lineWidth = 2.6; const bx = farArm.hx + 8 + Math.sin(ph) * 10; c.beginPath(); c.moveTo(farArm.hx, farArm.hy - 4); c.lineTo(bx, 0); c.stroke(); }
  if (umbK > .02) { const px = nearArm.hx, py = head.y - 34; c.save(); c.translate(px, py); c.rotate(Math.sin(t * 1.7) * .06); c.scale(umbK, umbK); c.fillStyle = env.accA(.95); c.strokeStyle = ink; c.lineWidth = 2.4; c.beginPath(); c.arc(0, 0, 36, Math.PI, 0); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-36, 0); c.quadraticCurveTo(-18, 6, 0, 0); c.quadraticCurveTo(18, 6, 36, 0); c.stroke(); c.strokeStyle = 'rgba(255,240,220,.5)'; c.lineWidth = 1.2; for (let i = 1; i < 6; i++) { const a = Math.PI + i * Math.PI / 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 36, Math.sin(a) * 36); c.stroke(); } c.strokeStyle = ink; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, (nearArm.hy - py) / umbK + 6); c.stroke(); c.restore(); }
  if (lan > .02) { const A = umbK > .5 ? farArm : nearArm; const lx = A.hx + 2, ly = A.hy + 6 + Math.sin(t * 2.6) * 1.5; c.save(); c.globalAlpha = lan; const gl = c.createRadialGradient(lx, ly + 10, 0, lx, ly + 10, 56); gl.addColorStop(0, 'rgba(240,180,100,.42)'); gl.addColorStop(1, 'rgba(240,180,100,0)'); c.fillStyle = gl; dot(c, lx, ly + 10, 56); c.strokeStyle = ink; c.lineWidth = 2; c.beginPath(); c.moveTo(A.hx, A.hy); c.lineTo(lx, ly + 2); c.stroke(); c.fillStyle = 'rgba(245,190,110,.95)'; c.beginPath(); c.ellipse(lx, ly + 12, 8, 10, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); }
  c.restore();
}
/* 原版小人:与最初海报完全一致的形态(可选保留) */
function classicWalker(c, env, wk, umbK, lan) {
  const t = env.t, ink = env.ink, ph = env.cw * .052, bob = Math.abs(Math.cos(ph)) * 3.5;
  c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = 3.4; c.lineCap = 'round'; c.lineJoin = 'round';
  const hipY = -30 - bob, neckY = -58 - bob, shY = neckY + 6;
  const leg = off => { const a = Math.sin(ph + off); const fx = a * 19; const lift = Math.max(0, Math.cos(ph + off)) * 9; c.beginPath(); c.moveTo(0, hipY); c.quadraticCurveTo(fx * .35, hipY / 2 + 4, fx, -lift); c.stroke(); };
  leg(0); leg(Math.PI);
  c.beginPath(); c.moveTo(0, hipY); c.lineTo(2, neckY); c.stroke();
  c.beginPath(); c.arc(5, neckY - 12, 12, 0, TAU); c.fillStyle = env.paper; c.fill(); c.strokeStyle = ink; c.stroke();
  c.beginPath(); c.moveTo(-9, neckY - 16); c.quadraticCurveTo(5, neckY - 33, 19, neckY - 14); c.stroke();
  c.fillStyle = ink; dot(c, 9, neckY - 13, 1.7);
  c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(16, shY - 2); c.lineTo(-30, shY - 10); c.stroke();
  const sw = Math.sin(t * 3) * .12;
  c.save(); c.translate(-30, shY - 10); c.rotate(sw); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 8); c.stroke(); c.beginPath(); c.arc(0, 15, 8.5, 0, TAU); c.fillStyle = env.paper; c.fill(); c.stroke(); c.restore();
  c.beginPath(); c.moveTo(2, shY); c.quadraticCurveTo(10, shY + 2, 15, shY - 2); c.stroke();
  const aa = Math.sin(ph + Math.PI) * 10;
  c.beginPath(); c.moveTo(2, shY); c.quadraticCurveTo(aa * .5 + 4, shY + 12, aa + 2, shY + 20); c.stroke();
  if (lan > .02) { const lx = 18, ly = shY + 4 + Math.sin(t * 2.6) * 1.5; c.save(); c.globalAlpha = lan; const gl = c.createRadialGradient(lx, ly + 8, 0, lx, ly + 8, 52); gl.addColorStop(0, 'rgba(240,180,100,.4)'); gl.addColorStop(1, 'rgba(240,180,100,0)'); c.fillStyle = gl; dot(c, lx, ly + 8, 52); c.beginPath(); c.moveTo(lx, ly - 2); c.lineTo(lx, ly + 4); c.stroke(); c.fillStyle = 'rgba(245,190,110,.95)'; rr(c, lx - 6, ly + 4, 12, 15, 4); c.fill(); c.stroke(); c.restore(); }
  if (wk.scarf) { c.save(); c.strokeStyle = env.accA(.9); c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(2, neckY + 6); c.quadraticCurveTo(-20, neckY + 4 + Math.sin(t * 3) * 5, -40, neckY + 12 + Math.sin(t * 3 + 1) * 7); c.stroke(); c.restore(); }
  if (umbK > .02) { c.save(); c.translate(4, neckY - 30); c.rotate(Math.sin(t * 1.7) * .06); c.scale(umbK, umbK); c.fillStyle = env.accA(.95); c.beginPath(); c.arc(0, 0, 30, Math.PI, 0); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-30, 0); c.quadraticCurveTo(-15, 6, 0, 0); c.quadraticCurveTo(15, 6, 30, 0); c.stroke(); c.beginPath(); c.moveTo(0, 0); c.lineTo(11, 38); c.stroke(); c.restore(); }
}
function companion(c, env, kind, sc) {
  const t = env.t, ink = env.ink, fill = env.paper;
  if (kind === 'dog') {
    const ph = env.cw * .095; c.save(); c.translate(CHARX + 78 * sc, GROUND); c.scale(sc, sc); c.strokeStyle = ink; c.fillStyle = fill; c.lineWidth = 2.6; c.lineCap = 'round';
    const bob = Math.abs(Math.sin(ph)) * 1.5;
    [[11, 0], [-11, Math.PI], [13, Math.PI + .4], [-13, .4]].forEach(L => { const p = ph + L[1]; const fx = L[0] + Math.sin(p) * 7, lift = Math.max(0, Math.cos(p)) * 6; c.beginPath(); c.moveTo(L[0], -18 - bob); c.lineTo(fx, -lift); c.stroke(); });
    c.beginPath(); c.ellipse(0, -22 - bob, 21, 9.5, 0, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-19, -26 - bob); c.quadraticCurveTo(-30, -40 - bob + Math.sin(t * 12) * 4, -24, -48 - bob + Math.sin(t * 12) * 6); c.stroke();
    c.beginPath(); c.arc(22, -31 - bob, 8.5, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(17, -38 - bob); c.lineTo(14, -47 - bob); c.lineTo(21, -40 - bob); c.closePath(); c.fillStyle = ink; c.fill(); dot(c, 29, -31 - bob, 1.8); dot(c, 26, -34 - bob, 1.2);
    c.restore();
  } else if (kind === 'bird') {
    const bx = CHARX + 40 + Math.sin(t * 1.1) * 26, by = GROUND - 175 * sc + Math.sin(t * 2.3) * 14; c.save(); c.translate(bx, by); c.strokeStyle = ink; c.fillStyle = env.acc; c.lineWidth = 2.2; c.lineCap = 'round';
    c.beginPath(); c.ellipse(0, 0, 8, 5.5, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = fill; c.beginPath(); c.arc(7, -4, 4.2, 0, TAU); c.fill(); c.stroke(); c.fillStyle = ink; dot(c, 8.5, -4.5, 1); c.beginPath(); c.moveTo(11, -4); c.lineTo(15, -3); c.lineTo(11, -2); c.fill();
    const f = Math.sin(t * 16) * 9; c.beginPath(); c.moveTo(-2, -2); c.quadraticCurveTo(-8, -10 - f, -14, -4 - f); c.moveTo(-2, -2); c.quadraticCurveTo(2, -10 - f, 8, -6 - f); c.stroke();
    c.beginPath(); c.moveTo(-8, 0); c.lineTo(-15, -2); c.moveTo(-8, 0); c.lineTo(-15, 3); c.stroke(); c.restore();
  }
}
function walkerDraw(c, env, cfg) {
  const wk = Object.assign({ style: 'scholar', size: 1, hat: 'auto', staff: true, umbrella: 'auto', lantern: 'auto', companion: 'none' }, cfg.walker || {});
  const st = WALKERS[wk.style] ? wk.style : 'scholar', sc = cl(+wk.size || 1, .6, 1.6);
  const umbK = wk.umbrella === 'on' ? 1 : wk.umbrella === 'off' ? 0 : Eo(cl((env.wea.rain - .25) / .25));
  const lan = wk.lantern === 'on' ? 1 : wk.lantern === 'off' ? 0 : cl((env.m - .45) / .3);
  c.save(); c.translate(CHARX, GROUND); c.scale(sc, sc);
  if (st === 'classic') classicWalker(c, env, wk, umbK, lan); else rigWalker(c, env, wk, st, umbK, lan);
  c.restore();
  if (wk.companion && wk.companion !== 'none') companion(c, env, wk.companion, sc);
}

/* ---------- 主绘制 ---------- */
function drawFrame(R, t, c) {
  const model = R.model, cfg = model.cfg; const env = envAt(model, t); const cam = env.cam, m = env.m, cw = env.cw;
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, env.sky[0]); g.addColorStop(.55, env.sky[1]); g.addColorStop(1, env.sky[2]);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const sa = cl(m * 1.25 - .05);
  if (sa > .02) { STARS.forEach(s => { const sx = s.x - cam * .1; if (sx < -10 || sx > W + 10) return; const tw = .5 + .5 * Math.sin(t * 2 + s.o); c.globalAlpha = sa * (.3 + .7 * tw) * (s.big ? 1 : .7); c.fillStyle = '#e9dfc8'; dot(c, sx, s.y, s.r); if (s.big) { c.globalAlpha = sa * .5 * tw; c.fillRect(sx - 6, s.y - .7, 12, 1.4); c.fillRect(sx - .7, s.y - 6, 1.4, 12); } }); c.globalAlpha = 1; }
  const sunA = 1 - m, sunX = 230 - cam * .02, sunY = env.sunY;
  if (sunA > .02) { c.save(); c.globalAlpha = sunA; const gl = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, 150); gl.addColorStop(0, 'rgba(245,190,120,.55)'); gl.addColorStop(1, 'rgba(245,190,120,0)'); c.fillStyle = gl; dot(c, sunX, sunY, 150); c.fillStyle = env.sun; dot(c, sunX, sunY, 50 + 12 * (env.tw.dusk + env.tw.dawn)); c.strokeStyle = 'rgba(232,160,90,.6)'; c.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * .3; c.beginPath(); c.moveTo(sunX + Math.cos(a) * 66, sunY + Math.sin(a) * 66); c.lineTo(sunX + Math.cos(a) * 80, sunY + Math.sin(a) * 80); c.stroke(); } c.restore(); }
  const moonA = cl(env.tw.night + .35 * env.tw.dusk), moonX = 830 - cam * .015;
  if (moonA > .02) { c.save(); c.globalAlpha = moonA; const gl = c.createRadialGradient(moonX, 270, 0, moonX, 270, 120); gl.addColorStop(0, 'rgba(233,223,200,.35)'); gl.addColorStop(1, 'rgba(233,223,200,0)'); c.fillStyle = gl; dot(c, moonX, 270, 120); c.fillStyle = '#e9dfc8'; dot(c, moonX, 270, 44); c.fillStyle = env.sky[0]; dot(c, moonX - 16, 260, 40); c.restore(); }
  if (m < .98) { CLOUDS.forEach(k => { const sx = k.x - cam * .12 + Math.sin(t * .3 + k.o) * 20; if (sx < -200 || sx > W + 200) return; c.save(); c.globalAlpha = (1 - m) * .5; c.fillStyle = '#fdfaf2'; c.beginPath(); c.ellipse(sx, k.y, 55 * k.s, 16 * k.s, 0, 0, TAU); c.ellipse(sx + 35 * k.s, k.y + 6, 38 * k.s, 13 * k.s, 0, 0, TAU); c.fill(); c.restore(); }); }
  ridge(c, env, .2, 1250, .08, 0);
  const itemsFar = model.items.filter(i => i.layer === 0);
  itemsFar.forEach(it => { const sx = W / 2 + (it.wx - cam - W / 2) * it.par; if (sx < -300 || sx > W + 300) return; DRAW[it.kind](c, env, it, sx); });
  waterBand(c, env);
  ridge(c, env, .45, 1400, .13, 900);
  if (model.stalks.length) bambooLayer(c, env);
  if (m > .5) { const sp = (t % 4) / 4; if (sp < .25) { const k = sp / .25; const x0 = 900 - k * 500, y0 = 120 + k * 220; c.save(); c.globalAlpha = m * (1 - k) * .8; c.strokeStyle = '#e9dfc8'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + 70, y0 - 30); c.stroke(); c.restore(); } }
  // 路面
  c.strokeStyle = env.inkA(.8); c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, GROUND);
  for (let x = 0; x <= W; x += 40) c.lineTo(x, GROUND + Math.sin((x + cam) * .02) * 2); c.stroke();
  const m0 = Math.floor(cam / 28) - 1, m1 = Math.floor((cam + W) / 28) + 1;
  for (let i = m0; i <= m1; i++) { const R = hash(i * 3.7); const sx = i * 28 + R * 16 - cam; c.strokeStyle = env.inkA(.35); c.lineWidth = 2; if (R < .5) { c.beginPath(); c.moveTo(sx, GROUND + 8); c.lineTo(sx, GROUND + 16); c.stroke(); } else if (R < .8) { c.beginPath(); c.moveTo(sx - 4, GROUND + 10); c.lineTo(sx, GROUND + 4); c.lineTo(sx + 4, GROUND + 10); c.stroke(); } else { c.fillStyle = env.inkA(.3); dot(c, sx, GROUND + 12, 2.5); } }
  if (cfg.show && cfg.show.footprints) { for (let px = Math.floor((cam - 40) / 64) * 64; px < cw; px += 64) { const sx = px - cam; if (sx < -20) continue; const age = cw - px; const a = cl(age / 60) * .35 * cl(1 - (age - 1400) / 600); if (a <= 0) continue; c.save(); c.globalAlpha = a; c.translate(sx, GROUND - 3); const s = (px / 64) % 2 ? 1 : -1; c.rotate(s * .25); c.fillStyle = env.ink; c.beginPath(); c.ellipse(0, s * 3, 6, 3, 0, 0, TAU); c.fill(); c.restore(); } }
  // 地面点缀
  model.items.forEach(it => { if (it.layer !== 1) return; const sx = W / 2 + (it.wx - cam - W / 2) * it.par; if (sx < -260 || sx > W + 260) return; DRAW[it.kind](c, env, it, sx); });
  // 场景排版
  model.scenes.forEach(s => {
    const sx0 = s.start - cam; if (sx0 + s.width + 400 < 0 || sx0 > W + 200) return;
    const img = R.getImage(s);
    const B = { c, env, s, X: lx => s.start + lx - cam, chars: s.chars.length ? s.chars : ['行'], ink: env.ink, acc: env.acc, img };
    (LAYOUT_FN[s.layout] || LAYOUT_FN.popH)(B);
  });
  // 天空点缀
  model.items.forEach(it => { if (it.layer !== 2) return; const sx = W / 2 + (it.wx - cam - W / 2) * it.par; if (sx < -400 || sx > W + 400) return; DRAW[it.kind](c, env, it, sx); });
  // 天气
  if (env.wea.rain > .02) { c.fillStyle = 'rgba(60,70,90,' + (.14 * env.wea.rain) + ')'; c.fillRect(0, 0, W, H); }
  weather(c, t, 'rain', env.wea.rain); weather(c, t, 'snow', env.wea.snow); weather(c, t, 'leaf', env.wea.leaf); weather(c, t, 'petal', env.wea.petal);
  // 人物
  walkerDraw(c, env, cfg);
  // 片头
  if (!cfg.show || cfg.show.intro !== false) {
    const sx = 470 - cam; if (sx > -300) {
      const a = Eo(cl(t / .9)); c.save(); c.globalAlpha = a;
      vtext(c, env, cfg.title || '', sx, 400, 104, 116, env.ink, -400, { shadow: true, stagger: .12 });
      vtext(c, env, cfg.subtitle || '', sx + 96, 420, 30, 36, env.ink, -400, { font: F_SANS, weight: 500, alpha: .7, pop: false, stagger: .06 });
      const n = [...(cfg.title || '')].length; c.globalAlpha = a * Eo(cl((t - .8) / .5)); c.translate(sx, 400 + n * 116 + 20); c.rotate(-.1); c.fillStyle = env.acc; rr(c, -30, -30, 60, 60, 9); c.fill(); c.fillStyle = '#fff8ee'; c.font = '400 38px ' + F_KAI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText([...(cfg.title || '行')][0] || '行', 0, 2); c.restore();
    }
  }
  // 信息栏
  if (!cfg.show || cfg.show.infobar !== false) {
    c.save(); c.globalAlpha = .6; c.strokeStyle = env.inkA(.4); c.lineWidth = 2; c.beginPath(); c.moveTo(84, 1870); c.lineTo(996, 1870); c.stroke();
    const pr = cl(cam / (model.world - W)); c.fillStyle = env.acc; dot(c, 84 + 912 * pr, 1870, 5);
    model.scenes.forEach(s => { const px = 84 + 912 * cl((s.start - W + 120) / (model.world - W)); c.fillStyle = env.inkA(.5); dot(c, px, 1870, 2.5); });
    c.fillStyle = env.inkA(.75); c.font = '500 24px ' + F_SANS; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('已行 ' + Math.round(cw / 8) + ' 里', 84, 1845);
    const si = model.sceneIndexAt(t), sc = model.scenes[si]; c.textAlign = 'right'; c.fillText((cfg.title || '') + (sc ? ' · ' + sc.label : ''), 996, 1845); c.restore();
  }
  if (t < .5) { c.fillStyle = 'rgba(246,240,226,' + (1 - t / .5) + ')'; c.fillRect(0, 0, W, H); }
  if (t > model.T - .6) { c.fillStyle = 'rgba(246,240,226,' + cl((t - (model.T - .6)) / .6) + ')'; c.fillRect(0, 0, W, H); }
}

/* ---------- 渲染器 ---------- */
function createRenderer(canvas, cfg) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const R = { model: compile(cfg), canvas, ctx };
  R.setConfig = c => { R.model = compile(c); };
  R.getImage = s => { const url = resolveUrl(s.image); if (!url) return procArt(s.idx + 1, s.time); const e = loadImg(url); return e.ok ? e.img : procArt(s.idx + 1, s.time); };
  R.draw = (t, c) => drawFrame(R, t, c || ctx);
  R.imagesReady = () => { const list = R.model.scenes.map(s => resolveUrl(s.image)).filter(Boolean).map(loadImg); return Promise.all(list.map(e => new Promise(res => { if (e.ok || e.fail) return res(); const i = setInterval(() => { if (e.ok || e.fail) { clearInterval(i); res(); } }, 100); setTimeout(() => { clearInterval(i); res(); }, 6000); }))); };
  try { if (root.document && root.document.fonts) ['Ma Shan Zheng', 'Noto Serif SC', 'Noto Sans SC'].forEach(f => root.document.fonts.load('40px "' + f + '"').catch(() => { })); } catch (e) { }
  return R;
}

root.PosterEngine = { W, H, GROUND, CHARX, TIMES, TERRAINS, WEATHERS, LAYOUTS, WALKERS, HATS, COMPANIONS, DECORS, defaultConfig, compile, createRenderer, procArt, assets: (root.PosterEngine && root.PosterEngine.assets) || {} };
})(typeof window !== 'undefined' ? window : globalThis);
