import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Play,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { BUILTIN_IMAGE_LIST } from '../../engine/builtinAssets';
import {
  CHAPTER_LABELS,
  DECORS,
  LAYOUTS,
  PRESET_QUOTES,
  TERRAINS,
  TIMES,
  WEATHERS,
} from '../../constants/presets';
import {
  LayoutType,
  PosterConfig,
  PosterScene,
  TerrainType,
  TimeOfDay,
  WeatherType,
} from '../../types';

interface ScenesTabProps {
  config: PosterConfig;
  totalDuration: number;
  activeSceneIndex: number;
  onChange: (patch: Partial<PosterConfig>) => void;
  onJumpToScene: (index: number) => void;
}

export const ScenesTab: React.FC<ScenesTabProps> = ({
  config,
  totalDuration,
  activeSceneIndex,
  onChange,
  onJumpToScene,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    config.scenes[0]?.id || null
  );

  const updateScene = (id: string, patch: Partial<PosterScene>) => {
    const updated = config.scenes.map((s) =>
      s.id === id ? { ...s, ...patch } : s
    );
    onChange({ scenes: updated });
  };

  const handleAddScene = (presetIdx?: number) => {
    const nextIdx = config.scenes.length;
    const preset =
      presetIdx !== undefined
        ? PRESET_QUOTES[presetIdx % PRESET_QUOTES.length]
        : PRESET_QUOTES[nextIdx % PRESET_QUOTES.length];

    const newScene: PosterScene = {
      id: Math.random().toString(36).slice(2, 8),
      label: CHAPTER_LABELS[nextIdx] || `其${nextIdx + 1}`,
      name: preset.name,
      quote: preset.quote,
      sub: preset.sub,
      source: preset.source,
      seal: preset.seal,
      layout: preset.layout || 'popH',
      time: preset.time || 'day',
      terrain: preset.terrain || 'plain',
      weather: preset.weather || 'none',
      decor: preset.decor || ['sign', 'tree', 'grass'],
      image: preset.image || `builtin:${(nextIdx % 5) + 1}`,
      width: 1400,
    };

    const newScenes = [...config.scenes, newScene];
    onChange({ scenes: newScenes });
    setExpandedId(newScene.id);
  };

  const handleReorderLabels = () => {
    const renamed = config.scenes.map((s, idx) => ({
      ...s,
      label: CHAPTER_LABELS[idx] || `其${idx + 1}`,
    }));
    onChange({ scenes: renamed });
  };

  const handleMove = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= config.scenes.length) return;
    const list = [...config.scenes];
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    onChange({ scenes: list });
  };

  const handleDuplicate = (index: number) => {
    const src = config.scenes[index];
    const dup: PosterScene = {
      ...src,
      id: Math.random().toString(36).slice(2, 8),
      label: `${src.label}′`,
    };
    const list = [...config.scenes];
    list.splice(index + 1, 0, dup);
    onChange({ scenes: list });
    setExpandedId(dup.id);
  };

  const handleDelete = (id: string) => {
    if (config.scenes.length <= 1) return;
    const list = config.scenes.filter((s) => s.id !== id);
    onChange({ scenes: list });
    if (expandedId === id) {
      setExpandedId(list[0]?.id || null);
    }
  };

  const handleImageUpload = (sceneId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateScene(sceneId, { image: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleDecor = (scene: PosterScene, decorKey: string) => {
    const cur = scene.decor || [];
    const exists = cur.includes(decorKey);
    const next = exists ? cur.filter((k) => k !== decorKey) : [...cur, decorKey];
    updateScene(scene.id, { decor: next });
  };

  return (
    <div className="space-y-4 text-xs text-[#e8ddc8]">
      {/* 顶部统计与操作栏 */}
      <div className="flex items-center justify-between border-b border-[#e8ddc8]/10 pb-3">
        <span className="font-mono text-[11px] text-[#9e8f7c]">
          共 {config.scenes.length} 段 · 约 {totalDuration.toFixed(0)} 秒
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleReorderLabels}
            className="rounded border border-[#e8ddc8]/20 bg-[#e8ddc8]/5 px-2.5 py-1 text-[11px] text-[#9e8f7c] transition hover:text-[#e8ddc8]"
            title="将各章节标签重命名为 其一、其二、其三…"
          >
            重排章节名
          </button>

          <button
            type="button"
            onClick={() => handleAddScene()}
            className="flex items-center gap-1 rounded bg-[#c8472b] px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-[#b53c22]"
          >
            <Plus className="h-3 w-3" />
            <span>新增一段</span>
          </button>
        </div>
      </div>

      {/* 场景卡片折叠列表 */}
      <div className="space-y-2">
        {config.scenes.map((scene, idx) => {
          const isExpanded = expandedId === scene.id;
          const isPlayingThis = activeSceneIndex === idx;

          return (
            <div
              key={scene.id}
              className={`rounded border transition-all ${
                isPlayingThis
                  ? 'border-[#c99a3f]/70 bg-[#c99a3f]/[0.04]'
                  : 'border-[#e8ddc8]/15 bg-[#120e0b]/60'
              }`}
            >
              {/* 卡片头部 */}
              <div
                className="flex cursor-pointer items-center justify-between p-3"
                onClick={() => setExpandedId(isExpanded ? null : scene.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-serif text-sm font-black text-[#c99a3f]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <span className="font-serif font-bold tracking-wide text-[#e8ddc8]">
                      {scene.label} · {scene.name}
                    </span>
                    <span className="ml-2 hidden truncate font-mono text-[11px] text-[#9e8f7c] sm:inline">
                      「{scene.quote}」
                    </span>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onJumpToScene(idx)}
                    className="rounded p-1 text-[#9e8f7c] transition hover:bg-[#e8ddc8]/10 hover:text-[#c99a3f]"
                    title="跳转定格预览本段"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, -1)}
                    className="rounded p-1 text-[#9e8f7c] transition hover:bg-[#e8ddc8]/10 hover:text-[#e8ddc8] disabled:opacity-20"
                    title="上移"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={idx === config.scenes.length - 1}
                    onClick={() => handleMove(idx, 1)}
                    className="rounded p-1 text-[#9e8f7c] transition hover:bg-[#e8ddc8]/10 hover:text-[#e8ddc8] disabled:opacity-20"
                    title="下移"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(idx)}
                    className="rounded p-1 text-[#9e8f7c] transition hover:bg-[#e8ddc8]/10 hover:text-[#e8ddc8]"
                    title="复制本段"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  {config.scenes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(scene.id)}
                      className="rounded p-1 text-[#9e8f7c] transition hover:bg-[#c8472b]/20 hover:text-[#c8472b]"
                      title="删除本段"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : scene.id)}
                    className="ml-1 rounded p-1 text-[#9e8f7c]"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* 展开的卡片详细设置 */}
              {isExpanded && (
                <div className="space-y-3.5 border-t border-[#e8ddc8]/10 p-3.5 pt-3">
                  {/* 章节名称与标识 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] text-[#9e8f7c]">
                        章节名 (如 其一)
                      </label>
                      <input
                        type="text"
                        value={scene.label}
                        onChange={(e) =>
                          updateScene(scene.id, { label: e.target.value })
                        }
                        className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2.5 py-1.5 text-xs text-[#e8ddc8] outline-none focus:border-[#c99a3f]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-[#9e8f7c]">
                        篇章标题 (如 道德经)
                      </label>
                      <input
                        type="text"
                        value={scene.name}
                        onChange={(e) =>
                          updateScene(scene.id, { name: e.target.value })
                        }
                        className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2.5 py-1.5 text-xs text-[#e8ddc8] outline-none focus:border-[#c99a3f]"
                      />
                    </div>
                  </div>

                  {/* 金句题写 */}
                  <div>
                    <label className="mb-1 block text-[11px] text-[#9e8f7c]">
                      金句大字 (破风横穿全屏)
                    </label>
                    <input
                      type="text"
                      value={scene.quote}
                      onChange={(e) =>
                        updateScene(scene.id, { quote: e.target.value })
                      }
                      className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2.5 py-1.5 font-serif text-sm font-bold text-[#e8ddc8] outline-none focus:border-[#c99a3f]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] text-[#9e8f7c]">
                        次句 / 题解
                      </label>
                      <input
                        type="text"
                        value={scene.sub}
                        onChange={(e) =>
                          updateScene(scene.id, { sub: e.target.value })
                        }
                        className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2.5 py-1.5 text-xs text-[#e8ddc8] outline-none focus:border-[#c99a3f]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] text-[#9e8f7c]">
                        印章刻字 (1-2字)
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        value={scene.seal}
                        onChange={(e) =>
                          updateScene(scene.id, { seal: e.target.value })
                        }
                        className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2.5 py-1.5 text-center font-serif text-xs font-bold text-[#c8472b] outline-none focus:border-[#c8472b]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-[#9e8f7c]">
                      落款出处 (如 ——《道德经》)
                    </label>
                    <input
                      type="text"
                      value={scene.source}
                      onChange={(e) =>
                        updateScene(scene.id, { source: e.target.value })
                      }
                      className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2.5 py-1.5 text-xs text-[#e8ddc8] outline-none focus:border-[#c99a3f]"
                    />
                  </div>

                  {/* 场景排版与环境 */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-[11px] text-[#9e8f7c]">
                        排版样式
                      </label>
                      <select
                        value={scene.layout}
                        onChange={(e) =>
                          updateScene(scene.id, {
                            layout: e.target.value as LayoutType,
                          })
                        }
                        className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2 py-1.5 text-xs text-[#e8ddc8] outline-none focus:border-[#c99a3f]"
                      >
                        {Object.entries(LAYOUTS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] text-[#9e8f7c]">
                        时段
                      </label>
                      <select
                        value={scene.time}
                        onChange={(e) =>
                          updateScene(scene.id, {
                            time: e.target.value as TimeOfDay,
                          })
                        }
                        className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2 py-1.5 text-xs text-[#e8ddc8] outline-none focus:border-[#c99a3f]"
                      >
                        {Object.entries(TIMES).map(([k, val]) => (
                          <option key={k} value={k}>
                            {(val as any).name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] text-[#9e8f7c]">
                        地形
                      </label>
                      <select
                        value={scene.terrain}
                        onChange={(e) =>
                          updateScene(scene.id, {
                            terrain: e.target.value as TerrainType,
                          })
                        }
                        className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2 py-1.5 text-xs text-[#e8ddc8] outline-none focus:border-[#c99a3f]"
                      >
                        {Object.entries(TERRAINS).map(([k, val]) => (
                          <option key={k} value={k}>
                            {(val as any).name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] text-[#9e8f7c]">
                        天候
                      </label>
                      <select
                        value={scene.weather}
                        onChange={(e) =>
                          updateScene(scene.id, {
                            weather: e.target.value as WeatherType,
                          })
                        }
                        className="w-full rounded border border-[#e8ddc8]/20 bg-[#120e0b] px-2 py-1.5 text-xs text-[#e8ddc8] outline-none focus:border-[#c99a3f]"
                      >
                        {Object.entries(WEATHERS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 路段宽度滑块 */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-[#9e8f7c]">
                      <span>路段宽度</span>
                      <span className="font-mono text-[#c99a3f]">{scene.width} px</span>
                    </div>
                    <input
                      type="range"
                      min={900}
                      max={2400}
                      step={50}
                      value={scene.width}
                      onChange={(e) =>
                        updateScene(scene.id, { width: Number(e.target.value) })
                      }
                      className="h-1.5 w-full cursor-pointer accent-[#c99a3f]"
                    />
                  </div>

                  {/* 配图选择 */}
                  <div>
                    <label className="mb-1.5 block text-[11px] text-[#9e8f7c]">
                      场景画卷配图 (内置国风水墨画 / 自定义上传)
                    </label>

                    <div className="flex flex-wrap gap-1.5">
                      {BUILTIN_IMAGE_LIST.map((img) => {
                        const isChosen = scene.image === img.id;
                        return (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => updateScene(scene.id, { image: img.id })}
                            className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] transition ${
                              isChosen
                                ? 'border-[#c99a3f] bg-[#c99a3f]/20 font-medium text-[#c99a3f]'
                                : 'border-[#e8ddc8]/20 bg-[#e8ddc8]/5 text-[#9e8f7c] hover:text-[#e8ddc8]'
                            }`}
                            title={img.desc}
                          >
                            <ImageIcon className="h-3 w-3" />
                            <span>{img.name}</span>
                          </button>
                        );
                      })}

                      {/* 上传自定义配图 */}
                      <label className="flex cursor-pointer items-center gap-1 rounded border border-[#e8ddc8]/20 bg-[#e8ddc8]/5 px-2 py-1 text-[11px] text-[#9e8f7c] transition hover:border-[#c99a3f] hover:text-[#e8ddc8]">
                        <Upload className="h-3 w-3" />
                        <span>上传本地图</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(scene.id, file);
                          }}
                        />
                      </label>

                      {scene.image && (
                        <button
                          type="button"
                          onClick={() => updateScene(scene.id, { image: '' })}
                          className="rounded border border-[#c8472b]/30 px-2 py-1 text-[11px] text-[#c8472b] transition hover:bg-[#c8472b]/10"
                        >
                          清除 (程序水墨兜底)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 点缀生灵与景观 */}
                  <div>
                    <label className="mb-1.5 block text-[11px] text-[#9e8f7c]">
                      沿途景物与生灵 (点击切换启用)
                    </label>

                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(DECORS).map(([key, name]) => {
                        const isSelected = (scene.decor || []).includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleDecor(scene, key)}
                            className={`rounded border px-2 py-0.5 text-[10.5px] transition ${
                              isSelected
                                ? 'border-[#c99a3f] bg-[#c99a3f]/25 text-[#f5ede0]'
                                : 'border-[#e8ddc8]/15 bg-[#e8ddc8]/[0.02] text-[#9e8f7c] hover:text-[#e8ddc8]'
                            }`}
                          >
                            {isSelected ? `✓ ${name}` : name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 从金句库追加 */}
      <div className="border-t border-[#e8ddc8]/10 pt-4">
        <h4 className="mb-2 font-serif text-xs font-bold tracking-wider text-[#9e8f7c]">
          从金句库快速追加
        </h4>

        <div className="flex flex-wrap gap-1.5">
          {PRESET_QUOTES.map((preset, idx) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleAddScene(idx)}
              className="rounded border border-[#e8ddc8]/15 bg-[#e8ddc8]/5 px-2.5 py-1 text-[11px] text-[#9e8f7c] transition hover:border-[#c99a3f] hover:text-[#e8ddc8]"
            >
              {preset.name} · {preset.quote}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
