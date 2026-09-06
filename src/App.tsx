import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Settings, User, Compass, Download, CheckCircle, Info } from 'lucide-react';
import { CanvasPreview } from './components/CanvasPreview';
import { Header } from './components/Header';
import { HtmlPreviewModal } from './components/HtmlPreviewModal';
import { PhasesRail } from './components/PhasesRail';
import { ExportTab } from './components/Tabs/ExportTab';
import { GlobalTab } from './components/Tabs/GlobalTab';
import { ScenesTab } from './components/Tabs/ScenesTab';
import { WalkerTab } from './components/Tabs/WalkerTab';
import { DEFAULT_CONFIG } from './constants/presets';
import { PosterEngine } from './engine/posterEngine';
import { CanvasPlayerHandle, PosterConfig } from './types';
import { downloadHtmlFile, openHtmlInNewTab } from './utils/htmlExporter';

type TabKey = 'global' | 'walker' | 'scenes' | 'export';

export default function App() {
  const [config, setConfig] = useState<PosterConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<TabKey>('global');
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isSlow, setIsSlow] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  const playerRef = useRef<CanvasPlayerHandle | null>(null);
  const pbarRef = useRef<HTMLDivElement | null>(null);
  const pfillRef = useRef<HTMLDivElement | null>(null);

  // Compile the model for duration and coordinate info
  const compiledModel = useMemo(() => {
    try {
      return PosterEngine.compile(config);
    } catch (err) {
      console.error('Model compile error:', err);
      return PosterEngine.compile(DEFAULT_CONFIG);
    }
  }, [config]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const handleFrame = useCallback(
    (t: number, total: number, sceneIndex: number) => {
      setCurrentTime(t);
      if (sceneIndex !== activeSceneIndex) {
        setActiveSceneIndex(sceneIndex);
      }
      if (pfillRef.current && total > 0) {
        pfillRef.current.style.width = `${(t / total) * 100}%`;
      }
    },
    [activeSceneIndex]
  );

  const handleJumpToScene = useCallback(
    (index: number) => {
      const scene = compiledModel.scenes[index];
      if (scene && playerRef.current) {
        playerRef.current.seek(scene.tStart);
        playerRef.current.setPlaying(true);
        setIsPlaying(true);
        setActiveSceneIndex(index);
      }
    },
    [compiledModel]
  );

  // Keyboard navigation & space play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.code === 'Space') {
        e.preventDefault();
        playerRef.current?.toggle();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = Math.min(compiledModel.scenes.length - 1, activeSceneIndex + 1);
        handleJumpToScene(next);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = Math.max(0, activeSceneIndex - 1);
        handleJumpToScene(prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSceneIndex, compiledModel.scenes.length, handleJumpToScene]);

  const handleSeekFromProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetT = ratio * compiledModel.T;
    playerRef.current?.seek(targetT);
  };

  const handleConfigPatch = (patch: Partial<PosterConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  const firstChar = [...(config.title || '行')][0] || '行';

  const tabItems: { id: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'global', label: '全局', icon: Settings },
    { id: 'walker', label: '人物', icon: User },
    { id: 'scenes', label: '场景 · 文案', icon: Compass },
    { id: 'export', label: '导出', icon: Download },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#14100c] text-[#e8ddc8] selection:bg-[#c8472b] selection:text-white">
      {/* 水墨大字背景水印 (东方写意) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-8 top-1/2 z-0 -translate-y-1/2 select-none font-['Ma_Shan_Zheng',cursive] text-[clamp(140px,24vw,340px)] font-black text-[#e8ddc8]/[0.025] [writing-mode:vertical-rl]"
      >
        {firstChar}
      </div>

      <div className="relative z-10 mx-auto max-w-[1520px] px-4 sm:px-6">
        {/* 顶部标题栏与全局导出按钮 */}
        <Header
          config={config}
          duration={compiledModel.T}
          onOpenPreviewModal={() => setIsPreviewModalOpen(true)}
          onOpenNewTab={async () => {
            showToast('正在打开新标签页预览…');
            await openHtmlInNewTab(config);
          }}
          onDownloadHtml={async () => {
            showToast('正在打包纯 HTML 单文件…');
            await downloadHtmlFile(config);
            showToast('✓ 纯 HTML 单文件已下载');
          }}
        />

        {/* 核心工作区：画布预览区 + 行程控制区 + 配置面板 */}
        <main className="flex flex-wrap items-start justify-center gap-6 py-6 lg:flex-nowrap">
          {/* 左侧：9:16 动态海报画布与时间轴 */}
          <div className="flex flex-col items-center gap-3">
            <CanvasPreview
              ref={playerRef}
              config={config}
              onFrame={handleFrame}
              onPlayingChange={setIsPlaying}
            />

            {/* 播放进度条 */}
            <div
              ref={pbarRef}
              onClick={handleSeekFromProgress}
              className="h-1.5 w-[min(78vh*9/16,461px)] max-w-[92vw] cursor-pointer overflow-hidden rounded-full bg-[#e8ddc8]/15 shadow-inner transition hover:h-2"
              title="拖拽或点击跳转时间点"
            >
              <div
                ref={pfillRef}
                className="h-full w-0 rounded-full bg-gradient-to-r from-[#c8472b] via-[#e8a05a] to-[#c99a3f] transition-[width] duration-75"
              />
            </div>

            {/* 交互提示 */}
            <div className="max-w-[460px] text-center text-[11px] tracking-wider text-[#9e8f7c]">
              大字从右缘入场横穿全屏 · 点画面暂停 · 空格键播放/暂停 · ← → 键切换场景
            </div>
          </div>

          {/* 中间：行程列表与快捷播放控制器 */}
          <PhasesRail
            scenes={compiledModel.scenes}
            totalDuration={compiledModel.T}
            activeSceneIndex={activeSceneIndex}
            currentTime={currentTime}
            isPlaying={isPlaying}
            isLooping={isLooping}
            isSlow={isSlow}
            playerRef={playerRef}
            config={config}
            onJumpToScene={handleJumpToScene}
            onToast={showToast}
          />

          {/* 右侧：多功能配置台面板 */}
          <div className="flex w-full min-w-0 flex-1 flex-col rounded-lg border border-[#e8ddc8]/15 bg-[#17120e]/90 shadow-xl backdrop-blur sm:min-w-[360px] lg:max-w-[540px]">
            {/* 选项卡导航 */}
            <div className="flex border-b border-[#e8ddc8]/10 bg-[#120e0b]/60">
              {tabItems.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold tracking-wider transition ${
                      isActive
                        ? 'text-[#f5ede0]'
                        : 'text-[#9e8f7c] hover:text-[#e8ddc8]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#c8472b]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 选项卡内容区 */}
            <div className="max-h-[calc(100vh-210px)] min-h-[540px] overflow-y-auto p-4 [scrollbar-width:thin]">
              {activeTab === 'global' && (
                <GlobalTab
                  config={config}
                  compiledModel={compiledModel}
                  onChange={handleConfigPatch}
                />
              )}

              {activeTab === 'walker' && (
                <WalkerTab
                  config={config}
                  onChange={handleConfigPatch}
                />
              )}

              {activeTab === 'scenes' && (
                <ScenesTab
                  config={config}
                  totalDuration={compiledModel.T}
                  activeSceneIndex={activeSceneIndex}
                  onChange={handleConfigPatch}
                  onJumpToScene={handleJumpToScene}
                />
              )}

              {activeTab === 'export' && (
                <ExportTab
                  config={config}
                  totalDuration={compiledModel.T}
                  onOpenPreviewModal={() => setIsPreviewModalOpen(true)}
                  onConfigLoaded={(newCfg) => setConfig(newCfg)}
                  onToast={showToast}
                />
              )}
            </div>
          </div>
        </main>

        {/* 底部注脚与原理说明 */}
        <footer className="mt-4 border-t border-[#e8ddc8]/10 py-6 text-center text-xs leading-relaxed text-[#9e8f7c]">
          <p>
            {config.title} · {config.subtitle} — 世界横向滚动，行者原地踏步 · 文字与国风配图从右缘入场横穿全屏 · 昼夜/地形/天气按路段权重平滑过渡
          </p>
          <p className="mt-1 text-[11px] text-[#9e8f7c]/70">
            支持一键导出单文件纯 HTML（内嵌零依赖渲染引擎与离线配图，双击断网可播）、WebM 高清视频与对齐 SRT 字幕。
          </p>
        </footer>
      </div>

      {/* 纯 HTML 单文件全屏弹窗实时预览 */}
      <HtmlPreviewModal
        isOpen={isPreviewModalOpen}
        config={config}
        onClose={() => setIsPreviewModalOpen(false)}
        onToast={showToast}
      />

      {/* Toast 提示弹窗 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-[#c99a3f]/50 bg-[#1f1712] px-4 py-2.5 text-xs font-medium text-[#f5ede0] shadow-2xl transition-all">
          <CheckCircle className="h-4 w-4 text-[#c99a3f]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
