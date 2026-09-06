import { PosterScene } from '../engine/posterEngine.ts';

export interface ClassicQuotePreset {
  name: string;
  quote: string;
  sub: string;
  source: string;
  seal: string;
  time: 'dawn' | 'day' | 'dusk' | 'night';
  terrain: 'plain' | 'mountain' | 'water' | 'city' | 'bamboo' | 'desert';
  weather: 'none' | 'rain' | 'snow' | 'leaf' | 'petal';
  layout: 'popH' | 'vertical' | 'stair' | 'card' | 'fan' | 'scroll';
  decor: string[];
}

export const CLASSIC_QUOTES: ClassicQuotePreset[] = [
  {
    name: '道德经',
    quote: '千里之行',
    sub: '始于足下。',
    source: '——《道德经》',
    seal: '道',
    time: 'day',
    terrain: 'plain',
    weather: 'none',
    layout: 'popH',
    decor: ['sign', 'tree', 'grass', 'birds', 'flowers', 'milestone'],
  },
  {
    name: '离骚',
    quote: '路漫漫其修远兮',
    sub: '吾将上下而求索。',
    source: '—— 屈原《离骚》',
    seal: '骚',
    time: 'dusk',
    terrain: 'mountain',
    weather: 'leaf',
    layout: 'vertical',
    decor: ['sign', 'pine', 'stones', 'geese', 'pagoda', 'paifang'],
  },
  {
    name: '终南别业',
    quote: '行到水穷处',
    sub: '坐看云起时。',
    source: '—— 王维《终南别业》',
    seal: '维',
    time: 'day',
    terrain: 'water',
    weather: 'none',
    layout: 'fan',
    decor: ['sign', 'willow', 'boat', 'bridge', 'butterfly', 'grass'],
  },
  {
    name: '定风波',
    quote: '莫听穿林打叶声',
    sub: '何妨吟啸且徐行。',
    source: '—— 苏轼《定风波》',
    seal: '坡',
    time: 'dawn',
    terrain: 'bamboo',
    weather: 'rain',
    layout: 'card',
    decor: ['sign', 'pavilion', 'stones', 'grass'],
  },
  {
    name: '行路难',
    quote: '长风破浪会有时',
    sub: '直挂云帆济沧海。',
    source: '—— 李白《行路难》',
    seal: '白',
    time: 'night',
    terrain: 'city',
    weather: 'none',
    layout: 'scroll',
    decor: ['sign', 'lanternPole', 'plum', 'skyLantern', 'fireflies', 'kite'],
  },
  {
    name: '将进酒',
    quote: '天生我材必有用',
    sub: '千金散尽还复来。',
    source: '—— 李白《将进酒》',
    seal: '酒',
    time: 'dusk',
    terrain: 'desert',
    weather: 'none',
    layout: 'stair',
    decor: ['sign', 'stones', 'geese', 'milestone'],
  },
  {
    name: '题西林壁',
    quote: '不识庐山真面目',
    sub: '只缘身在此山中。',
    source: '—— 苏轼《题西林壁》',
    seal: '山',
    time: 'day',
    terrain: 'mountain',
    weather: 'none',
    layout: 'vertical',
    decor: ['sign', 'pine', 'birds', 'pagoda'],
  },
  {
    name: '游山西村',
    quote: '山重水复疑无路',
    sub: '柳暗花明又一村。',
    source: '—— 陆游《游山西村》',
    seal: '游',
    time: 'day',
    terrain: 'water',
    weather: 'petal',
    layout: 'popH',
    decor: ['sign', 'willow', 'bridge', 'flowers', 'butterfly', 'boat'],
  },
  {
    name: '登鹳雀楼',
    quote: '欲穷千里目',
    sub: '更上一层楼。',
    source: '—— 王之涣《登鹳雀楼》',
    seal: '楼',
    time: 'dusk',
    terrain: 'city',
    weather: 'none',
    layout: 'fan',
    decor: ['sign', 'paifang', 'geese', 'pagoda'],
  },
  {
    name: '江雪',
    quote: '孤舟蓑笠翁',
    sub: '独钓寒江雪。',
    source: '—— 柳宗元《江雪》',
    seal: '雪',
    time: 'night',
    terrain: 'water',
    weather: 'snow',
    layout: 'card',
    decor: ['sign', 'boat', 'pine', 'stones'],
  },
  {
    name: '竹里馆',
    quote: '深林人不知',
    sub: '明月来相照。',
    source: '—— 王维《竹里馆》',
    seal: '竹',
    time: 'night',
    terrain: 'bamboo',
    weather: 'none',
    layout: 'scroll',
    decor: ['sign', 'fireflies', 'stones', 'pavilion'],
  },
  {
    name: '论语',
    quote: '士不可以不弘毅',
    sub: '任重而道远。',
    source: '——《论语·泰伯》',
    seal: '仁',
    time: 'dawn',
    terrain: 'plain',
    weather: 'none',
    layout: 'stair',
    decor: ['sign', 'tree', 'milestone', 'birds', 'grass'],
  },
];

export const ORDINAL_LABELS = [
  '其一', '其二', '其三', '其四', '其五', '其六',
  '其七', '其八', '其九', '其十', '十一', '十二'
];

export function createSceneFromPreset(preset: ClassicQuotePreset, index: number): PosterScene {
  const randId = Math.random().toString(36).slice(2, 8);
  return {
    id: `s_${randId}`,
    label: ORDINAL_LABELS[index] || `其${index + 1}`,
    name: preset.name,
    quote: preset.quote,
    sub: preset.sub,
    source: preset.source,
    seal: preset.seal,
    layout: preset.layout,
    time: preset.time,
    terrain: preset.terrain,
    weather: preset.weather,
    decor: [...preset.decor],
    image: `builtin:${(index % 5) + 1}`,
    width: 1400,
  };
}
