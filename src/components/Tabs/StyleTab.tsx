import React from 'react';
import { Palette, Check, Sparkles, Sliders } from 'lucide-react';
import { PosterConfig } from '../../types';
import { PALETTE_THEMES } from '../../constants/presets';

interface StyleTabProps {
  config: PosterConfig;
  onChangeConfig: (newCfg: PosterConfig) => void;
}

export const StyleTab: React.FC<StyleTabProps> = ({ config, onChangeConfig }) => {
  return (
    <div className="space-y-5">
      {/* Palette Themes Selection */}
      <div>
        <label className="block text-xs font-semibold text-[#dcd2be] mb-2 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[#c99a3f]" />
          雅韵色板 (Classical Themes)
        </label>
        <div className="space-y-2.5">
          {PALETTE_THEMES.map((theme) => {
            const isSel = config.themeId === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => onChangeConfig({ ...config, themeId: theme.id })}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  isSel
                    ? 'border-[#c8472b] bg-[#c8472b]/15 text-[#f3ebd8]'
                    : 'border-[#33261b] bg-[#1a140f] text-[#a89882] hover:border-[#c99a3f]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-serif font-bold text-sm text-[#f3ebd8]">
                    {theme.name}
                  </div>
                  {isSel && (
                    <span className="flex items-center gap-1 text-[11px] text-[#c8472b] font-semibold">
                      <Check className="w-3.5 h-3.5" /> 已选用
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#a89882] mb-2">{theme.description}</div>

                {/* Color swatches preview */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                    style={{ backgroundColor: theme.daySky[0] }}
                    title="白昼天色"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                    style={{ backgroundColor: theme.daySky[2] }}
                    title="地平线渐变"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                    style={{ backgroundColor: theme.nightSky[1] }}
                    title="夜空色"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                    style={{ backgroundColor: theme.dayInk }}
                    title="主墨色"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                    style={{ backgroundColor: theme.accent }}
                    title="朱砂印章与点缀"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Enhancements */}
      <div className="bg-[#1e1711] p-3.5 rounded-lg border border-[#33261b] space-y-3">
        <span className="text-xs font-serif font-bold text-[#c99a3f] flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          画面质感与视觉滤镜
        </span>

        {/* Toggles */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'grain', label: '宣纸颗粒肌理' },
            { key: 'vignette', label: '胶片暗角' },
            { key: 'hud', label: '底部里程标尺' },
          ].map((item) => {
            const val = config[item.key as keyof PosterConfig] as boolean;
            return (
              <button
                key={item.key}
                onClick={() => onChangeConfig({ ...config, [item.key]: !val })}
                className={`px-3 py-2 rounded border text-xs text-center transition ${
                  val
                    ? 'border-[#c8472b] bg-[#c8472b]/15 text-[#f3ebd8] font-medium'
                    : 'border-[#33261b] bg-[#1a140f] text-[#8c7a67]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Line Width */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
            <span>白描线条粗细 (Line Width)</span>
            <span className="font-mono text-[#c99a3f]">
              {config.character.lineWidth.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={config.character.lineWidth}
            onChange={(e) =>
              onChangeConfig({
                ...config,
                character: {
                  ...config.character,
                  lineWidth: parseFloat(e.target.value),
                },
              })
            }
            className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
          />
        </div>
      </div>
    </div>
  );
};
