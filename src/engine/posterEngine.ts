import { BUILTIN_ASSETS } from './builtinAssets';
import { POSTER_ENGINE_JS } from './engineSource';
import { CompiledModel, EngineRenderer, PosterConfig } from '../types';

export type EnginePosterConfig = PosterConfig;

let _engineInstance: any = null;

export function getPosterEngine(): any {
  if (typeof window === 'undefined') {
    return null;
  }
  if ((window as any).PosterEngine) {
    _engineInstance = (window as any).PosterEngine;
  } else if (!_engineInstance) {
    try {
      const fn = new Function(POSTER_ENGINE_JS);
      fn.call(window);
      _engineInstance = (window as any).PosterEngine;
    } catch (err) {
      console.error('Failed to initialize PosterEngine:', err);
    }
  }

  // Ensure builtin assets are registered in the engine's asset map
  if (_engineInstance) {
    _engineInstance.assets = _engineInstance.assets || {};
    Object.assign(_engineInstance.assets, BUILTIN_ASSETS);
  }

  return _engineInstance;
}

export const PosterEngine = {
  get W(): number {
    return getPosterEngine()?.W ?? 1080;
  },
  get H(): number {
    return getPosterEngine()?.H ?? 1920;
  },
  get GROUND(): number {
    return getPosterEngine()?.GROUND ?? 1420;
  },
  get CHARX(): number {
    return getPosterEngine()?.CHARX ?? 400;
  },
  get TIMES(): Record<string, any> {
    return getPosterEngine()?.TIMES ?? {};
  },
  get TERRAINS(): Record<string, any> {
    return getPosterEngine()?.TERRAINS ?? {};
  },
  get WEATHERS(): Record<string, any> {
    return getPosterEngine()?.WEATHERS ?? {};
  },
  get LAYOUTS(): Record<string, any> {
    return getPosterEngine()?.LAYOUTS ?? {};
  },
  get WALKERS(): Record<string, any> {
    return getPosterEngine()?.WALKERS ?? {};
  },
  get HATS(): Record<string, any> {
    return getPosterEngine()?.HATS ?? {};
  },
  get COMPANIONS(): Record<string, any> {
    return getPosterEngine()?.COMPANIONS ?? {};
  },
  get DECORS(): Record<string, any> {
    return getPosterEngine()?.DECORS ?? {};
  },
  defaultConfig(): PosterConfig {
    return getPosterEngine()?.defaultConfig();
  },
  compile(cfg: PosterConfig): CompiledModel {
    const engine = getPosterEngine();
    if (!engine) {
      throw new Error('PosterEngine not initialized');
    }
    return engine.compile(cfg);
  },
  createRenderer(canvas: HTMLCanvasElement, cfg: PosterConfig): EngineRenderer {
    const engine = getPosterEngine();
    if (!engine) {
      throw new Error('PosterEngine not initialized');
    }
    return engine.createRenderer(canvas, cfg);
  },
  procArt(name: string): string {
    return getPosterEngine()?.procArt(name) ?? '';
  },
};
