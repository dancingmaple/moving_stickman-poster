import React from 'react';
import { TIMES, TERRAINS, WEATHERS } from '../../constants/presets';
import { CompiledModel, PosterConfig } from '../../types';

interface GlobalTabProps {
  config: PosterConfig;
  compiledModel: CompiledModel;
  onChange: (patch: Partial<PosterConfig>) => void;
}

export const GlobalTab: React.FC<GlobalTabProps> = ({
  config,
  compiledModel,
  onChange,
}) => {
  const handleShowToggle = (key: keyof PosterConfig['show']) => {
    onChange({
      show: {
        ...config.show,
        [key]: !config.show[key],
      },
    });
  };

  return (
    <div className="space-y-5 text-xs text-[#e8ddc8]">
      {/* 海报信息 */}
      <div className="space-y-3">
        <h3 className="font-serif text-sm font-bold tracking-wider text-[#c99a3f]">
          海报信息
        </h3>

        <div>
          <label className="mb-1 block text-[11px] text-[#9e8f7c]">
            标题
            <span className="ml-1 text-[10px] text-[#9e8f7c]/70">
              (片头竖排大字 + 底部信息栏)
            </span>
          </label>
          <input
            type="text"
            value={config.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-3 py-2 font-serif text-sm text-[#e8ddc8] outline-none transition focus:border-[#c99a3f]"
            placeholder="行者 · 金句漫游"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-[#9e8f7c]">
            副题
          </label>
          <input
            type="text"
            value={config.subtitle}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-3 py-2 text-xs text-[#e8ddc8] outline-none transition focus:border-[#c99a3f]"
            placeholder="一直走的海报"
          />
        </div>
      </div>

      {/* 节奏 */}
      <div className="space-y-3 border-t border-[#e8ddc8]/10 pt-4">
        <h3 className="font-serif text-sm font-bold tracking-wider text-[#c99a3f]">
          节奏与物理
        </h3>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-[#9e8f7c]">
            <span>行进速度</span>
            <span className="font-mono text-[#c99a3f]">{config.speed} px/s</span>
          </div>
          <input
            type="range"
            min={80}
            max={260}
            step={5}
            value={config.speed}
            onChange={(e) => onChange({ speed: Number(e.target.value) })}
            className="h-1.5 w-full cursor-pointer accent-[#c8472b]"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-[#9e8f7c]/70">
            <span>缓步 80</span>
            <span>
              总时长 ≈ {compiledModel.T.toFixed(1)}s · 世界宽 {compiledModel.world}px
            </span>
            <span>快走 260</span>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-[#9e8f7c]">
            <span>随机种子</span>
            <span className="font-mono text-[#c99a3f]">{config.seed}</span>
          </div>
          <input
            type="range"
            min={1}
            max={99}
            step={1}
            value={config.seed}
            onChange={(e) => onChange({ seed: Number(e.target.value) })}
            className="h-1.5 w-full cursor-pointer accent-[#c99a3f]"
          />
          <p className="mt-1 text-[10px] text-[#9e8f7c]/70">
            决定树木、石头与野花等随机点缀的落点与形态，调动种子即焕然一新
          </p>
        </div>
      </div>

      {/* 常驻图层 */}
      <div className="space-y-3 border-t border-[#e8ddc8]/10 pt-4">
        <h3 className="font-serif text-sm font-bold tracking-wider text-[#c99a3f]">
          常驻图层
        </h3>

        <div className="flex flex-wrap gap-2">
          {[
            { key: 'intro' as const, label: '片头题字' },
            { key: 'footprints' as const, label: '行进脚印' },
            { key: 'infobar' as const, label: '底部信息栏' },
          ].map((item) => {
            const active = config.show[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleShowToggle(item.key)}
                className={`rounded border px-3 py-1.5 text-xs transition ${
                  active
                    ? 'border-[#c99a3f] bg-[#c99a3f]/20 font-medium text-[#c99a3f]'
                    : 'border-[#e8ddc8]/20 bg-[#e8ddc8]/5 text-[#9e8f7c] hover:text-[#e8ddc8]'
                }`}
              >
                {active ? `✓ ${item.label}` : item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 行程总览 */}
      <div className="space-y-2 border-t border-[#e8ddc8]/10 pt-4">
        <h3 className="font-serif text-sm font-bold tracking-wider text-[#c99a3f]">
          行程总览
        </h3>

        <div className="space-y-1.5 font-mono text-[11px] text-[#9e8f7c]">
          {compiledModel.scenes.map((scene, idx) => (
            <div
              key={scene.id || idx}
              className="flex items-center gap-2 rounded border border-[#e8ddc8]/5 bg-[#e8ddc8]/[0.02] px-2.5 py-1.5"
            >
              <span className="font-bold text-[#c99a3f]">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="w-12 text-[#9e8f7c]/80">{scene.tStart.toFixed(1)}s</span>
              <span className="truncate font-sans font-medium text-[#e8ddc8]">
                {scene.label} · {scene.name}
              </span>
              <span className="ml-auto shrink-0 text-[10px] text-[#9e8f7c]/70">
                {(TIMES as any)[scene.time]?.name || scene.time} /{' '}
                {(TERRAINS as any)[scene.terrain]?.name || scene.terrain}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
