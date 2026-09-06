import React from 'react';
import { User, Bike, Footprints, Shield, Compass, Sparkles } from 'lucide-react';
import { MotionMode, PosterConfig, PostureType } from '../../types';
import { POSTURE_INFO } from '../../constants/presets';

interface CharacterTabProps {
  config: PosterConfig;
  onChangeConfig: (newCfg: PosterConfig) => void;
}

export const CharacterTab: React.FC<CharacterTabProps> = ({ config, onChangeConfig }) => {
  const char = config.character;

  const handleUpdateChar = <K extends keyof typeof char>(field: K, value: (typeof char)[K]) => {
    onChangeConfig({
      ...config,
      character: {
        ...char,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Motion Mode Selection */}
      <div>
        <label className="block text-xs font-semibold text-[#dcd2be] mb-2">
          行动模式 (Motion Mode)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'walk', name: '徒步行走', icon: User, desc: '双骨 IK 踩地步态' },
            { id: 'bike', name: '单车骑行', icon: Bike, desc: '踏频踩踏与车灯车篮' },
            { id: 'auto', name: '交替漫游', icon: Compass, desc: '徒步 ↔ 骑行 随场景流转' },
          ].map((m) => {
            const Icon = m.icon;
            const isSel = config.motionMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onChangeConfig({ ...config, motionMode: m.id as MotionMode })}
                className={`p-3 rounded-lg border text-left transition flex flex-col items-start gap-1.5 ${
                  isSel
                    ? 'border-[#c8472b] bg-[#c8472b]/15 text-[#f3ebd8]'
                    : 'border-[#33261b] bg-[#1a140f] text-[#a89882] hover:border-[#c99a3f]/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSel ? 'text-[#c8472b]' : 'text-[#c99a3f]'}`} />
                <div>
                  <div className="font-semibold text-xs text-[#e8ddc8]">{m.name}</div>
                  <div className="text-[10px] text-[#8c7a67] mt-0.5">{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Posture Selection */}
      <div>
        <label className="block text-xs font-semibold text-[#dcd2be] mb-2">
          行者步态与姿态动力学 (9 种特色步态)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(POSTURE_INFO) as PostureType[]).map((pk) => {
            const info = POSTURE_INFO[pk];
            const isSel = config.posture === pk;
            return (
              <button
                key={pk}
                onClick={() => onChangeConfig({ ...config, posture: pk })}
                className={`p-2 rounded-md border text-left transition ${
                  isSel
                    ? 'border-[#c99a3f] bg-[#c99a3f]/15 text-[#f3ebd8]'
                    : 'border-[#33261b] bg-[#1a140f] text-[#a89882] hover:border-[#c99a3f]/30'
                }`}
              >
                <div className="font-medium text-xs text-[#f3ebd8]">{info.name}</div>
                <div className="text-[10px] text-[#8c7a67] mt-0.5 line-clamp-2 leading-tight">
                  {info.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gear & Props Toggles */}
      <div>
        <label className="block text-xs font-semibold text-[#dcd2be] mb-2">
          行者装束与随身道具 (Outfits & Props)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { key: 'bambooHat', label: '逍遥斗笠' },
            { key: 'backpack', label: '行囊书篓' },
            { key: 'trekkingPole', label: '登山手杖' },
            { key: 'scarf', label: '飘逸围巾' },
            { key: 'umbrella', label: '避雨油纸伞' },
            { key: 'lantern', label: '夜行提灯' },
            { key: 'bikeBasket', label: '复古车前篮' },
            { key: 'bikeLight', label: '单车前照灯' },
            { key: 'footprints', label: '足迹脚印' },
            { key: 'tireTrack', label: '地面车辙印' },
          ].map((item) => {
            const val = char[item.key as keyof typeof char];
            return (
              <button
                key={item.key}
                onClick={() => handleUpdateChar(item.key as any, !val)}
                className={`px-3 py-2 rounded border text-xs text-left transition flex items-center justify-between ${
                  val
                    ? 'border-[#c8472b] bg-[#c8472b]/15 text-[#f3ebd8]'
                    : 'border-[#33261b] bg-[#1a140f] text-[#8c7a67]'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    val ? 'bg-[#c8472b]' : 'bg-[#33261b]'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Kinematics Sliders */}
      <div className="space-y-3 bg-[#1e1711] p-3.5 rounded-lg border border-[#33261b]">
        <span className="text-xs font-serif font-bold text-[#c99a3f] flex items-center gap-1">
          <Footprints className="w-3.5 h-3.5" />
          步态动力学微调
        </span>

        {/* Speed */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
            <span>行走速度 (Speed)</span>
            <span className="font-mono text-[#c99a3f]">{config.speed.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="2.5"
            step="0.05"
            value={config.speed}
            onChange={(e) => onChangeConfig({ ...config, speed: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
          />
        </div>

        {/* Character Scale */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
            <span>人物体量比例 (Scale)</span>
            <span className="font-mono text-[#c99a3f]">{char.scale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.8"
            step="0.05"
            value={char.scale}
            onChange={(e) => handleUpdateChar('scale', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
          />
        </div>

        {/* Step Length */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
            <span>步幅系数 (Step Length)</span>
            <span className="font-mono text-[#c99a3f]">{char.stepLengthMul.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.6"
            step="0.05"
            value={char.stepLengthMul}
            onChange={(e) => handleUpdateChar('stepLengthMul', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
          />
        </div>

        {/* Arm Swing */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
            <span>摆臂幅度 (Arm Swing)</span>
            <span className="font-mono text-[#c99a3f]">{char.armSwingMul.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.8"
            step="0.05"
            value={char.armSwingMul}
            onChange={(e) => handleUpdateChar('armSwingMul', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
          />
        </div>

        {/* Screen Position */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
            <span>水平屏幕站位 (Screen Position)</span>
            <span className="font-mono text-[#c99a3f]">{(char.screenPosX * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.15"
            max="0.65"
            step="0.01"
            value={char.screenPosX}
            onChange={(e) => handleUpdateChar('screenPosX', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
          />
        </div>
      </div>
    </div>
  );
};
