import React from 'react';
import {
  COMPANIONS,
  HATS,
  WALKER_DESCRIPTIONS,
  WALKERS,
} from '../../constants/presets';
import { AutoToggle, CompanionType, HatType, PosterConfig, WalkerStyle } from '../../types';

interface WalkerTabProps {
  config: PosterConfig;
  onChange: (patch: Partial<PosterConfig>) => void;
}

export const WalkerTab: React.FC<WalkerTabProps> = ({ config, onChange }) => {
  const walker = config.walker;

  const updateWalker = (patch: Partial<typeof walker>) => {
    onChange({
      walker: {
        ...walker,
        ...patch,
      },
    });
  };

  return (
    <div className="space-y-5 text-xs text-[#e8ddc8]">
      {/* 人物造型选择 */}
      <div className="space-y-3">
        <h3 className="font-serif text-sm font-bold tracking-wider text-[#c99a3f]">
          人物造型
        </h3>

        <div className="grid grid-cols-1 gap-2">
          {Object.entries(WALKERS).map(([key, label]) => {
            const isSelected = walker.style === key;
            const desc = WALKER_DESCRIPTIONS[key] || '';

            return (
              <button
                key={key}
                type="button"
                onClick={() => updateWalker({ style: key as WalkerStyle })}
                className={`flex items-start gap-3 rounded border p-3 text-left transition ${
                  isSelected
                    ? 'border-[#c99a3f] bg-[#c99a3f]/15 shadow-sm'
                    : 'border-[#e8ddc8]/15 bg-[#120e0b]/50 hover:border-[#e8ddc8]/40'
                }`}
              >
                <div
                  className={`mt-1 h-3 w-3 shrink-0 rounded-full border ${
                    isSelected
                      ? 'border-[#c99a3f] bg-[#c99a3f]'
                      : 'border-[#e8ddc8]/40 bg-transparent'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-sm font-bold tracking-wide text-[#e8ddc8]">
                    {label}
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed text-[#9e8f7c]">
                    {desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 装扮与随身道具 */}
      <div className="space-y-3 border-t border-[#e8ddc8]/10 pt-4">
        <h3 className="font-serif text-sm font-bold tracking-wider text-[#c99a3f]">
          装扮与随身
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* 帽子 */}
          <div>
            <label className="mb-1 block text-[11px] text-[#9e8f7c]">帽子</label>
            <select
              value={walker.hat}
              onChange={(e) => updateWalker({ hat: e.target.value as HatType })}
              className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2.5 py-1.5 text-xs text-[#e8ddc8] outline-none transition focus:border-[#c99a3f]"
            >
              {Object.entries(HATS).map(([k, name]) => (
                <option key={k} value={k}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* 同行伙伴 */}
          <div>
            <label className="mb-1 block text-[11px] text-[#9e8f7c]">同行生灵</label>
            <select
              value={walker.companion}
              onChange={(e) => updateWalker({ companion: e.target.value as CompanionType })}
              className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2.5 py-1.5 text-xs text-[#e8ddc8] outline-none transition focus:border-[#c99a3f]"
            >
              {Object.entries(COMPANIONS).map(([k, name]) => (
                <option key={k} value={k}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* 雨伞 */}
          <div>
            <label className="mb-1 block text-[11px] text-[#9e8f7c]">雨伞</label>
            <select
              value={walker.umbrella}
              onChange={(e) => updateWalker({ umbrella: e.target.value as AutoToggle })}
              className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2.5 py-1.5 text-xs text-[#e8ddc8] outline-none transition focus:border-[#c99a3f]"
            >
              <option value="auto">下雨自动撑开</option>
              <option value="on">一直撑伞</option>
              <option value="off">不带伞</option>
            </select>
          </div>

          {/* 灯笼 */}
          <div>
            <label className="mb-1 block text-[11px] text-[#9e8f7c]">灯笼</label>
            <select
              value={walker.lantern}
              onChange={(e) => updateWalker({ lantern: e.target.value as AutoToggle })}
              className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2.5 py-1.5 text-xs text-[#e8ddc8] outline-none transition focus:border-[#c99a3f]"
            >
              <option value="auto">天黑自动点亮</option>
              <option value="on">一直提灯</option>
              <option value="off">不提灯</option>
            </select>
          </div>
        </div>

        {/* 随身开关 */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => updateWalker({ staff: !walker.staff })}
            className={`rounded border px-3 py-1.5 text-xs transition ${
              walker.staff
                ? 'border-[#c99a3f] bg-[#c99a3f]/20 font-medium text-[#c99a3f]'
                : 'border-[#e8ddc8]/20 bg-[#e8ddc8]/5 text-[#9e8f7c] hover:text-[#e8ddc8]'
            }`}
          >
            {walker.staff ? '✓ 手杖 / 锡杖' : '手杖 / 锡杖'}
          </button>

          <button
            type="button"
            onClick={() => updateWalker({ scarf: !walker.scarf })}
            className={`rounded border px-3 py-1.5 text-xs transition ${
              walker.scarf
                ? 'border-[#c99a3f] bg-[#c99a3f]/20 font-medium text-[#c99a3f]'
                : 'border-[#e8ddc8]/20 bg-[#e8ddc8]/5 text-[#9e8f7c] hover:text-[#e8ddc8]'
            }`}
          >
            {walker.scarf ? '✓ 飘逸围巾' : '飘逸围巾'}
          </button>
        </div>
      </div>

      {/* 人物大小 */}
      <div className="space-y-3 border-t border-[#e8ddc8]/10 pt-4">
        <div className="flex items-center justify-between text-[11px] text-[#9e8f7c]">
          <span>人物比例大小</span>
          <span className="font-mono text-[#c99a3f]">{walker.size.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min={0.8}
          max={1.3}
          step={0.05}
          value={walker.size}
          onChange={(e) => updateWalker({ size: Number(e.target.value) })}
          className="h-1.5 w-full cursor-pointer accent-[#c99a3f]"
        />
        <div className="flex justify-between font-mono text-[10px] text-[#9e8f7c]/70">
          <span>0.8x 远景小人</span>
          <span>1.0x 标准</span>
          <span>1.3x 突出主体</span>
        </div>
      </div>

      {/* 运动学说明 */}
      <div className="rounded border border-[#e8ddc8]/10 bg-[#e8ddc8]/[0.02] p-3 text-[11px] leading-relaxed text-[#9e8f7c]">
        人物采用两段式腿部骨骼 (髋 + 膝) 与反相摆臂，脚接触地面时身体自然起伏；步频与前进位移严格按物理绑定，不会出现“滑步”错觉。
      </div>
    </div>
  );
};
