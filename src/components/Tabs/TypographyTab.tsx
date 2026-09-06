import React from 'react';
import { Plus, Trash2, BookOpen, Clock, Tag } from 'lucide-react';
import { PosterConfig, SceneItem, TypographyLayout } from '../../types';
import { CLASSIC_QUOTE_PRESETS } from '../../constants/presets';

interface TypographyTabProps {
  config: PosterConfig;
  onChangeConfig: (newCfg: PosterConfig) => void;
  activeSceneIdx: number;
  onSelectScene: (idx: number) => void;
}

export const TypographyTab: React.FC<TypographyTabProps> = ({
  config,
  onChangeConfig,
  activeSceneIdx,
  onSelectScene,
}) => {
  const currentScene = config.scenes[activeSceneIdx] || config.scenes[0];

  const handleUpdateCurrentScene = (field: keyof SceneItem, value: any) => {
    const updated = config.scenes.map((s, idx) => {
      if (idx === activeSceneIdx) {
        return { ...s, [field]: value };
      }
      return s;
    });
    onChangeConfig({ ...config, scenes: updated });
  };

  const handleAddScene = () => {
    const last = config.scenes[config.scenes.length - 1];
    const newStart = last ? last.startTime + last.duration + 0.5 : 0.8;
    const newScene: SceneItem = {
      id: `scene-${Date.now()}`,
      name: `其${config.scenes.length + 1}`,
      bigText: '行者有光',
      subText: '心之所向，素履以往',
      source: '—— 七堇年',
      sealText: '光',
      cueText: '心之所向，素履以往。生如逆旅，一苇以航。',
      startTime: Number(newStart.toFixed(1)),
      duration: 8.5,
      layout: 'staggered',
      weather: 'sunny',
      season: 'spring',
      dayTime: 0.35,
      posture: 'steady',
      mode: 'walk',
      mileage: (config.scenes.length + 1) * 35,
    };
    onChangeConfig({ ...config, scenes: [...config.scenes, newScene] });
    onSelectScene(config.scenes.length);
  };

  const handleDeleteScene = (idxToDelete: number) => {
    if (config.scenes.length <= 1) {
      alert('海报至少需要保留一个场景幕次！');
      return;
    }
    const filtered = config.scenes.filter((_, idx) => idx !== idxToDelete);
    onChangeConfig({ ...config, scenes: filtered });
    onSelectScene(Math.max(0, idxToDelete - 1));
  };

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="bg-[#1e1711] p-3.5 rounded-lg border border-[#33261b]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-serif font-bold text-[#c99a3f] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            金句幕次与版式编排
          </span>
          <span className="text-[11px] text-[#8c7a67]">
            共 {config.scenes.length} 幕
          </span>
        </div>
        <p className="text-xs text-[#a89882] leading-relaxed">
          金句从屏幕右缘以毛笔书法动态入场；每幕可独立设置大字、副句出处、印章铭文及展示版式。
        </p>
      </div>

      {/* Scene Tabs List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-[#dcd2be]">场景列表</label>
          <button
            onClick={handleAddScene}
            className="flex items-center gap-1 text-xs text-[#c99a3f] hover:text-[#e4b252] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加新一幕</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {config.scenes.map((s, idx) => (
            <div
              key={s.id || idx}
              onClick={() => onSelectScene(idx)}
              className={`p-2.5 rounded-md border cursor-pointer transition flex flex-col justify-between ${
                activeSceneIdx === idx
                  ? 'border-[#c8472b] bg-[#c8472b]/15 text-[#f3ebd8]'
                  : 'border-[#33261b] bg-[#1a140f] text-[#a89882] hover:border-[#c99a3f]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-xs text-[#c99a3f]">
                  {s.name}
                </span>
                {config.scenes.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScene(idx);
                    }}
                    className="text-red-400/60 hover:text-red-400 p-0.5"
                    title="删除此幕"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="font-serif text-sm font-black truncate mt-1 text-[#f3ebd8]">
                {s.bigText}
              </div>
              <div className="text-[10px] opacity-60 font-mono mt-0.5">
                {s.startTime}s - {(s.startTime + s.duration).toFixed(1)}s
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Form for Current Scene */}
      {currentScene && (
        <div className="space-y-4 pt-3 border-t border-[#2d2219]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#f3ebd8] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#c8472b]" />
              编辑当前: {currentScene.name} · {currentScene.bigText}
            </h3>
            <span className="text-[11px] font-mono text-[#8c7a67]">
              第 {activeSceneIdx + 1} 幕
            </span>
          </div>

          {/* Chapter Name and Seal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#a89882] mb-1">章节路牌名称</label>
              <input
                type="text"
                value={currentScene.name}
                onChange={(e) => handleUpdateCurrentScene('name', e.target.value)}
                placeholder="如: 启程 / 其一"
                className="w-full px-3 py-1.5 bg-[#1a140f] border border-[#382b20] rounded text-xs text-[#f3ebd8] focus:border-[#c99a3f] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#a89882] mb-1">朱砂印章文字 (1-2字)</label>
              <input
                type="text"
                maxLength={2}
                value={currentScene.sealText}
                onChange={(e) => handleUpdateCurrentScene('sealText', e.target.value)}
                placeholder="如: 道 / 行 / 恒"
                className="w-full px-3 py-1.5 bg-[#1a140f] border border-[#382b20] rounded text-xs text-[#f3ebd8] focus:border-[#c99a3f] outline-none font-serif"
              />
            </div>
          </div>

          {/* Big Text & Sub Text */}
          <div>
            <label className="block text-xs text-[#a89882] mb-1">
              金句正文大字 (逐字入场, 建议4-9字)
            </label>
            <input
              type="text"
              value={currentScene.bigText}
              onChange={(e) => handleUpdateCurrentScene('bigText', e.target.value)}
              placeholder="如: 千里之行"
              className="w-full px-3 py-2 bg-[#1a140f] border border-[#382b20] rounded text-sm font-serif font-black text-[#f3ebd8] focus:border-[#c99a3f] outline-none tracking-wider"
            />
          </div>

          <div>
            <label className="block text-xs text-[#a89882] mb-1">副句 / 诗文注释</label>
            <input
              type="text"
              value={currentScene.subText}
              onChange={(e) => handleUpdateCurrentScene('subText', e.target.value)}
              placeholder="如: 始于足下"
              className="w-full px-3 py-1.5 bg-[#1a140f] border border-[#382b20] rounded text-xs text-[#dcd2be] focus:border-[#c99a3f] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#a89882] mb-1">出处行</label>
              <input
                type="text"
                value={currentScene.source}
                onChange={(e) => handleUpdateCurrentScene('source', e.target.value)}
                placeholder="如: ——《道德经》"
                className="w-full px-3 py-1.5 bg-[#1a140f] border border-[#382b20] rounded text-xs text-[#dcd2be] focus:border-[#c99a3f] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#a89882] mb-1">章节里程 (里)</label>
              <input
                type="number"
                value={currentScene.mileage || 20}
                onChange={(e) => handleUpdateCurrentScene('mileage', Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-[#1a140f] border border-[#382b20] rounded text-xs text-[#dcd2be] focus:border-[#c99a3f] outline-none"
              />
            </div>
          </div>

          {/* Layout Archetype Selector */}
          <div>
            <label className="block text-xs text-[#a89882] mb-1.5">书法排版构图 (9种东方雅致版式)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'staggered', name: '错落横排', desc: '大字错落入场，行云流水' },
                { id: 'vertical', name: '魏晋竖排', desc: '古典竖向引线，落款印章' },
                { id: 'minimal', name: '现代巨幕', desc: '居中磅礴大字，开门见山' },
                { id: 'bottom', name: '沉底诗意', desc: '大字沉底留白，意境辽阔' },
                { id: 'couplet', name: '楹联对幅', desc: '左右联轴对仗，金边横批' },
                { id: 'circular', name: '团扇圆屏', desc: '宋画纨扇圆窗，竹柄流苏' },
                { id: 'stele', name: '金石碑拓', desc: '青石圆首碑文，斑驳拓片' },
                { id: 'diagonal', name: '长风破空', desc: '斜角飞白破阵，剑气如虹' },
                { id: 'scattered', name: '金粉散章', desc: '宋词起伏散排，呼吸灵动' },
              ].map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => handleUpdateCurrentScene('layout', layout.id as TypographyLayout)}
                  className={`p-2.5 rounded border text-left transition ${
                    currentScene.layout === layout.id
                      ? 'border-[#c8472b] bg-[#c8472b]/15 text-[#f3ebd8]'
                      : 'border-[#382b20] bg-[#1a140f] text-[#a89882] hover:border-[#c99a3f]/40'
                  }`}
                >
                  <div className="font-semibold text-xs text-[#e8ddc8]">{layout.name}</div>
                  <div className="text-[10px] text-[#8c7a67] mt-0.5 leading-tight">{layout.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-3 bg-[#1e1711] p-3 rounded border border-[#33261b]">
            <div>
              <label className="flex items-center gap-1 text-xs text-[#a89882] mb-1">
                <Clock className="w-3 h-3 text-[#c99a3f]" />
                起始时刻 (秒)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={currentScene.startTime}
                onChange={(e) => handleUpdateCurrentScene('startTime', parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1 bg-[#15100b] border border-[#382b20] rounded text-xs text-[#f3ebd8]"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs text-[#a89882] mb-1">
                <Clock className="w-3 h-3 text-[#c99a3f]" />
                驻留时长 (秒)
              </label>
              <input
                type="number"
                step="0.5"
                min="3"
                value={currentScene.duration}
                onChange={(e) => handleUpdateCurrentScene('duration', parseFloat(e.target.value) || 3)}
                className="w-full px-2.5 py-1 bg-[#15100b] border border-[#382b20] rounded text-xs text-[#f3ebd8]"
              />
            </div>
          </div>

          {/* Subtitle Cue Text for SRT */}
          <div>
            <label className="block text-xs text-[#a89882] mb-1">
              字幕全文 (用于一键导出同步配音 SRT 文件)
            </label>
            <textarea
              rows={2}
              value={currentScene.cueText}
              onChange={(e) => handleUpdateCurrentScene('cueText', e.target.value)}
              className="w-full px-3 py-1.5 bg-[#1a140f] border border-[#382b20] rounded text-xs text-[#dcd2be] focus:border-[#c99a3f] outline-none resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
