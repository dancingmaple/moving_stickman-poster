export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type TerrainType = 'plain' | 'mountain' | 'water' | 'city' | 'bamboo' | 'desert';
export type WeatherType = 'none' | 'rain' | 'snow' | 'leaf' | 'petal';
export type LayoutType = 'popH' | 'vertical' | 'stair' | 'card' | 'fan' | 'scroll';
export type WalkerStyle = 'scholar' | 'traveler' | 'monk' | 'girl' | 'classic';
export type HatType = 'auto' | 'none' | 'straw' | 'bamboo' | 'cap';
export type CompanionType = 'none' | 'dog' | 'bird';
export type AutoToggle = 'auto' | 'on' | 'off';

export interface WalkerConfig {
  style: WalkerStyle;
  size: number;
  hat: HatType;
  staff: boolean;
  scarf: boolean;
  umbrella: AutoToggle;
  lantern: AutoToggle;
  companion: CompanionType;
}

export interface ShowConfig {
  intro: boolean;
  footprints: boolean;
  infobar: boolean;
  milestones?: boolean;
}

export interface PosterScene {
  id: string;
  label: string;      // e.g. "其一"
  name: string;       // e.g. "道德经"
  quote: string;      // e.g. "千里之行"
  sub: string;        // e.g. "始于足下。"
  source: string;     // e.g. "——《道德经》"
  seal: string;       // e.g. "道"
  layout: LayoutType; // 'popH' | 'vertical' | 'stair' | 'card' | 'fan' | 'scroll'
  time: TimeOfDay;    // 'dawn' | 'day' | 'dusk' | 'night'
  terrain: TerrainType; // 'plain' | 'mountain' | 'water' | 'city' | 'bamboo' | 'desert'
  weather: WeatherType; // 'none' | 'rain' | 'snow' | 'leaf' | 'petal'
  decor: string[];    // Array of decor names e.g. ["sign", "tree", "grass"]
  image?: string;     // "builtin:1" | "builtin:2" ... or data:image/... base64
  width: number;      // e.g. 1400 (px)

  // Compiled properties populated by PosterEngine.compile
  start?: number;
  end?: number;
  idx?: number;
  chars?: string[];
  tStart?: number;
}

export interface PosterConfig {
  title: string;
  subtitle: string;
  speed: number;
  seed: number;
  walker: WalkerConfig;
  show: ShowConfig;
  scenes: PosterScene[];
}

export interface CompiledScene extends PosterScene {
  start: number;
  end: number;
  idx: number;
  chars: string[];
  tStart: number;
}

export interface CompiledModel {
  cfg: PosterConfig;
  world: number;
  T: number;
  scenes: CompiledScene[];
  sceneIndexAt: (t: number) => number;
  sceneAt: (t: number) => CompiledScene;
  weightsAt: (x: number) => number[];
  blendWeightsAt: (t: number) => number[];
  decors: any[];
  footprints: any[];
  items: any[];
}

export interface EngineRenderer {
  model: CompiledModel;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  setConfig: (c: PosterConfig) => void;
  draw: (t: number, customCtx?: CanvasRenderingContext2D) => void;
  imagesReady: () => boolean;
  getImage: (src: string) => HTMLImageElement | null;
}

export interface CanvasPlayerHandle {
  seek: (t: number) => void;
  toggle: () => void;
  replay: () => void;
  setLoop: (loop: boolean) => void;
  setSlow: (slow: boolean) => void;
  setPlaying: (playing: boolean) => void;
  isPlaying: () => boolean;
  time: () => number;
  duration: () => number;
  renderer: () => EngineRenderer | null;
  canvas: () => HTMLCanvasElement | null;
}
