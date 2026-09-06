import React from 'react';
import { Sparkles, Trees, Bird, Home, Cloud, Dog, Flame, Landmark, Wind, Compass } from 'lucide-react';
import { PosterConfig } from '../../types';

interface EmbellishmentsTabProps {
  config: PosterConfig;
  onChangeConfig: (newCfg: PosterConfig) => void;
}

export const EmbellishmentsTab: React.FC<EmbellishmentsTabProps> = ({ config, onChangeConfig }) => {
  const emb = config.embellishments;

  const handleUpdateEmb = <K extends keyof typeof emb>(field: K, value: (typeof emb)[K]) => {
    onChangeConfig({
      ...config,
      embellishments: { ...emb, [field]: value },
    });
  };

  return (
    <div className="space-y-5">
      {/* Living Companions and Creatures */}
      <div className="bg-[#1e1711] p-3.5 rounded-lg border border-[#33261b]">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-serif font-bold text-[#c99a3f] flex items-center gap-1.5">
            <Dog className="w-3.5 h-3.5" />
            生灵同行与意趣 (Companions & Wildlife)
          </label>
          <span className="text-[10px] text-[#8c7a67]">东方灵兽与伴行伙伴</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { key: 'dogCompanion', label: '灵动小狗', desc: '欢跑摇尾伴随' },
            { key: 'passerby', label: '同行路人', desc: '擦肩挥手问候' },
            { key: 'deer', label: '林间仙鹿', desc: '涉水踏浪伴行' },
            { key: 'crane', label: '千年祥鹤', desc: '展翅翱翔掠空' },
            { key: 'dandelion', label: '漫天蒲公英', desc: '随风轻舞飘散' },
            { key: 'birdsFlock', label: '飞雁白鹭', desc: '人字队形横空' },
            { key: 'butterflies', label: '春蝶双飞', desc: '花间波浪漫游' },
            { key: 'fireflies', label: '夏夜流萤', desc: '幽夜微光起伏' },
          ].map((item) => {
            const val = emb[item.key as keyof typeof emb];
            return (
              <button
                key={item.key}
                onClick={() => handleUpdateEmb(item.key as any, !val)}
                className={`p-2 rounded border text-left transition flex flex-col justify-between ${
                  val
                    ? 'border-[#c8472b] bg-[#c8472b]/15 text-[#f3ebd8]'
                    : 'border-[#33261b] bg-[#1a140f] text-[#8c7a67] hover:border-[#c99a3f]/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-[#e8ddc8]">{item.label}</span>
                  <span className={`w-2 h-2 rounded-full ${val ? 'bg-[#c8472b]' : 'bg-[#33261b]'}`} />
                </div>
                <span className="text-[10px] text-[#8c7a67] mt-0.5">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Classical Oriental Architecture */}
      <div className="space-y-3 bg-[#1e1711] p-3.5 rounded-lg border border-[#33261b]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-serif font-bold text-[#c99a3f] flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5" />
            东方古典胜景与建筑 (Oriental Architecture)
          </span>
          <span className="text-[10px] text-[#8c7a67]">沿途人文历史遗迹</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Pavilions */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
              <span>飞檐水榭草亭</span>
              <span className="font-mono text-[#c99a3f]">{(emb.pavilions * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={emb.pavilions}
              onChange={(e) => handleUpdateEmb('pavilions', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
            />
          </div>

          {/* Pagodas */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
              <span>崇山古刹宝塔</span>
              <span className="font-mono text-[#c99a3f]">{(emb.pagodas * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={emb.pagodas}
              onChange={(e) => handleUpdateEmb('pagodas', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
            />
          </div>

          {/* Archways */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
              <span>古道雄关牌坊</span>
              <span className="font-mono text-[#c99a3f]">{(emb.archways * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={emb.archways}
              onChange={(e) => handleUpdateEmb('archways', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
            />
          </div>

          {/* Bridges */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
              <span>烟雨石拱古桥</span>
              <span className="font-mono text-[#c99a3f]">{(emb.bridges * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={emb.bridges}
              onChange={(e) => handleUpdateEmb('bridges', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
            />
          </div>
        </div>
      </div>

      {/* Sky & Atmosphere */}
      <div>
        <label className="block text-xs font-semibold text-[#dcd2be] mb-2 flex items-center gap-1">
          <Cloud className="w-3.5 h-3.5 text-[#c99a3f]" />
          苍穹天象与风物 (Sky & Atmosphere)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { key: 'shootingStars', label: '夜空流星雨', desc: '划破夜空' },
            { key: 'airplane', label: '客机云迹', desc: '现代远行' },
            { key: 'kite', label: '乘风纸鸢', desc: '随风摇曳' },
            { key: 'smoke', label: '孤村炊烟', desc: '人间烟火' },
          ].map((item) => {
            const val = emb[item.key as keyof typeof emb];
            return (
              <button
                key={item.key}
                onClick={() => handleUpdateEmb(item.key as any, !val)}
                className={`p-2 rounded border text-left transition flex flex-col justify-between ${
                  val
                    ? 'border-[#c99a3f] bg-[#c99a3f]/15 text-[#f3ebd8]'
                    : 'border-[#33261b] bg-[#1a140f] text-[#8c7a67] hover:border-[#c99a3f]/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-[#e8ddc8]">{item.label}</span>
                  <span className={`w-2 h-2 rounded-full ${val ? 'bg-[#c99a3f]' : 'bg-[#33261b]'}`} />
                </div>
                <span className="text-[10px] text-[#8c7a67] mt-0.5">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Natural Landscape & Prop Densities */}
      <div className="space-y-3 bg-[#1e1711] p-3.5 rounded-lg border border-[#33261b]">
        <span className="text-xs font-serif font-bold text-[#c99a3f] flex items-center gap-1">
          <Trees className="w-3.5 h-3.5" />
          自然植被与景物密度 (Landscape & Vegetation)
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Reeds */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
              <span>江畔随风芦苇</span>
              <span className="font-mono text-[#c99a3f]">{(emb.reeds * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={emb.reeds}
              onChange={(e) => handleUpdateEmb('reeds', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
            />
          </div>

          {/* Trees */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
              <span>苍翠林木密度</span>
              <span className="font-mono text-[#c99a3f]">{(emb.trees * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={emb.trees}
              onChange={(e) => handleUpdateEmb('trees', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
            />
          </div>

          {/* Cottages */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
              <span>乡野村舍</span>
              <span className="font-mono text-[#c99a3f]">{(emb.cottages * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={emb.cottages}
              onChange={(e) => handleUpdateEmb('cottages', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
            />
          </div>

          {/* Fences */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
              <span>疏篱柴门木栅</span>
              <span className="font-mono text-[#c99a3f]">{(emb.fences * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={emb.fences}
              onChange={(e) => handleUpdateEmb('fences', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
            />
          </div>

          {/* Lantern Posts */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
              <span>路畔石灯台</span>
              <span className="font-mono text-[#c99a3f]">{(emb.lanternPosts * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={emb.lanternPosts}
              onChange={(e) => handleUpdateEmb('lanternPosts', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
            />
          </div>

          {/* Rocks */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
              <span>嶙峋古朴岩石</span>
              <span className="font-mono text-[#c99a3f]">{(emb.rocks * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={emb.rocks}
              onChange={(e) => handleUpdateEmb('rocks', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
            />
          </div>

          {/* Windmills */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
              <span>随风风车</span>
              <span className="font-mono text-[#c99a3f]">{(emb.windmills * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.6"
              step="0.05"
              value={emb.windmills}
              onChange={(e) => handleUpdateEmb('windmills', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
            />
          </div>

          {/* Balloons & Tumbleweeds */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
                <span>远方热气球</span>
                <span className="font-mono text-[#c99a3f]">{emb.balloons}只</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={emb.balloons}
                onChange={(e) => handleUpdateEmb('balloons', parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-[#a89882] mb-1">
                <span>随风风滚草</span>
                <span className="font-mono text-[#c99a3f]">{emb.tumbleweeds}团</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={emb.tumbleweeds}
                onChange={(e) => handleUpdateEmb('tumbleweeds', parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#2a2017] rounded appearance-none cursor-pointer accent-[#c8472b]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

