import React from 'react';
import { Sun, CloudRain, Mountain, Wind, Snowflake, CloudFog, CloudLightning } from 'lucide-react';
import { PosterConfig, SeasonType, WeatherType } from '../../types';

interface EnvironmentTabProps {
  config: PosterConfig;
  onChangeConfig: (newCfg: PosterConfig) => void;
}

export const EnvironmentTab: React.FC<EnvironmentTabProps> = ({ config, onChangeConfig }) => {
  const terr = config.terrain;
  const wea = config.weather;
  const tim = config.time;

  const handleUpdateTerr = <K extends keyof typeof terr>(field: K, value: (typeof terr)[K]) => {
    onChangeConfig({
      ...config,
      terrain: { ...terr, [field]: value },
    });
  };

  const handleUpdateWea = <K extends keyof typeof wea>(field: K, value: (typeof wea)[K]) => {
    onChangeConfig({
      ...config,
      weather: { ...wea, [field]: value },
    });
  };

  const handleUpdateTim = <K extends keyof typeof tim>(field: K, value: (typeof tim)[K]) => {
    onChangeConfig({
      ...config,
      time: { ...tim, [field]: value },
    });
  };

  const weatherOptions: { id: WeatherType; name: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'sunny', name: '晴空万里', icon: Sun },
    { id: 'cloudy', name: '浮云舒卷', icon: Mountain },
    { id: 'overcast', name: '阴云苍茫', icon: CloudFog },
    { id: 'rain', name: '烟雨霏霏', icon: CloudRain },
    { id: 'storm', name: '雷暴疾雨', icon: CloudLightning },
    { id: 'snow', name: '朔雪纷飞', icon: Snowflake },
    { id: 'windy', name: '长风浩荡', icon: Wind },
    { id: 'fog', name: '晨雾弥漫', icon: CloudFog },
  ];

  return (
    <div className="space-y-5">
      {/* Day / Night Celestial Lighting */}
      <div className="bg-[#1e1711] p-3.5 rounded-lg border border-[#33261b]">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-serif font-bold text-[#c99a3f] flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5" />
            昼夜流转与天象时刻
          </label>
          <span className="text-xs font-mono text-[#c99a3f]">
            {(tim.dayTime * 24).toFixed(1)} 时
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="0.999"
          step="0.01"
          value={tim.dayTime}
          onChange={(e) => handleUpdateTim('dayTime', parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
        />

        <div className="flex justify-between text-[10px] text-[#8c7a67] mt-1 font-mono">
          <span>00:00 子夜</span>
          <span>06:00 晨曦</span>
          <span>12:00 正午</span>
          <span>18:30 晚霞</span>
          <span>22:00 星夜</span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#33261b]">
          <span className="text-xs text-[#a89882]">昼夜天色自动随时间流转</span>
          <button
            onClick={() => handleUpdateTim('autoCycle', !tim.autoCycle)}
            className={`px-2.5 py-1 rounded text-xs transition ${
              tim.autoCycle
                ? 'bg-[#c99a3f] text-[#1c150c] font-semibold'
                : 'bg-[#2a2017] text-[#a89882]'
            }`}
          >
            {tim.autoCycle ? '已开启自动' : '定格当前'}
          </button>
        </div>
      </div>

      {/* Weather Selection */}
      <div>
        <label className="block text-xs font-semibold text-[#dcd2be] mb-2">
          气候天象 (8 大意象天气)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {weatherOptions.map((w) => {
            const Icon = w.icon;
            const isSel = wea.current === w.id;
            return (
              <button
                key={w.id}
                onClick={() => handleUpdateWea('current', w.id)}
                className={`p-2 rounded-md border text-center transition flex flex-col items-center gap-1 ${
                  isSel
                    ? 'border-[#c8472b] bg-[#c8472b]/15 text-[#f3ebd8]'
                    : 'border-[#33261b] bg-[#1a140f] text-[#a89882] hover:border-[#c99a3f]/30'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSel ? 'text-[#c8472b]' : 'text-[#c99a3f]'}`} />
                <span className="text-xs font-medium">{w.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seasons */}
      <div>
        <label className="block text-xs font-semibold text-[#dcd2be] mb-2">
          四季节律 (Seasons & Nature)
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[
            { id: 'spring', name: '春 · 樱瓣' },
            { id: 'summer', name: '夏 · 繁木' },
            { id: 'autumn', name: '秋 · 枫叶' },
            { id: 'winter', name: '冬 · 积雪' },
            { id: 'auto', name: '四季轮转' },
          ].map((s) => {
            const isSel = tim.season === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleUpdateTim('season', s.id as SeasonType)}
                className={`py-1.5 px-2 rounded border text-xs text-center transition ${
                  isSel
                    ? 'border-[#c99a3f] bg-[#c99a3f]/15 text-[#f3ebd8] font-medium'
                    : 'border-[#33261b] bg-[#1a140f] text-[#8c7a67]'
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Terrain Settings */}
      <div className="space-y-3 bg-[#1e1711] p-3.5 rounded-lg border border-[#33261b]">
        <span className="text-xs font-serif font-bold text-[#c99a3f] flex items-center gap-1">
          <Mountain className="w-3.5 h-3.5" />
          程序化地貌与坡度
        </span>

        {/* Amplitude */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
            <span>地面起伏幅度 (Amplitude)</span>
            <span className="font-mono text-[#c99a3f]">{terr.amplitude}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            step="5"
            value={terr.amplitude}
            onChange={(e) => handleUpdateTerr('amplitude', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
          />
        </div>

        {/* Frequency */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
            <span>山丘起伏频率 (Frequency)</span>
            <span className="font-mono text-[#c99a3f]">{terr.frequency.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="2.2"
            step="0.05"
            value={terr.frequency}
            onChange={(e) => handleUpdateTerr('frequency', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
          />
        </div>

        {/* Horizon */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
            <span>地平线基准高度 (Horizon)</span>
            <span className="font-mono text-[#c99a3f]">{(terr.horizon * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.55"
            max="0.85"
            step="0.01"
            value={terr.horizon}
            onChange={(e) => handleUpdateTerr('horizon', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
          />
        </div>

        {/* Prop Tilt & Hills */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
              <span>景物顺坡倾斜</span>
              <span className="font-mono text-[#c99a3f]">{terr.propTilt.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={terr.propTilt}
              onChange={(e) => handleUpdateTerr('propTilt', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
              <span>远山层数</span>
              <span className="font-mono text-[#c99a3f]">{terr.hillLayers}层</span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={terr.hillLayers}
              onChange={(e) => handleUpdateTerr('hillLayers', parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
            />
          </div>
        </div>
      </div>

      {/* Wind & Rain Special Props */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
            <span>水平风力 (Wind)</span>
            <span className="font-mono text-[#c99a3f]">{wea.wind.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.05"
            value={wea.wind}
            onChange={(e) => handleUpdateWea('wind', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
            <span>额外雾气 (Fog)</span>
            <span className="font-mono text-[#c99a3f]">{wea.fogDensity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={wea.fogDensity}
            onChange={(e) => handleUpdateWea('fogDensity', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
          />
        </div>
      </div>
    </div>
  );
};
