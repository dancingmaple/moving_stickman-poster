import React, { useState } from 'react';
import { RotateCcw, Play, Pause, Video, FileText } from 'lucide-react';
import { TIMES, WEATHERS, TERRAINS } from '../constants/presets';
import { CanvasPlayerHandle, CompiledScene, PosterConfig } from '../types';
import { downloadTextFile, generateSrtContent } from '../utils/srtExporter';

interface PhasesRailProps {
  scenes: CompiledScene[];
  totalDuration: number;
  activeSceneIndex: number;
  currentTime: number;
  isPlaying: boolean;
  isLooping: boolean;
  isSlow: boolean;
  playerRef: React.RefObject<CanvasPlayerHandle | null>;
  config: PosterConfig;
  onJumpToScene: (index: number) => void;
  onToast: (msg: string) => void;
}

export const PhasesRail: React.FC<PhasesRailProps> = ({
  scenes,
  totalDuration,
  activeSceneIndex,
  currentTime,
  isPlaying,
  isLooping,
  isSlow,
  playerRef,
  config,
  onJumpToScene,
  onToast,
}) => {
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState('');

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${m}:${ss < 10 ? '0' : ''}${ss.toFixed(1)}`;
  };

  const handleTogglePlay = () => {
    playerRef.current?.toggle();
  };

  const handleReplay = () => {
    playerRef.current?.replay();
  };

  const handleToggleSlow = () => {
    const next = !isSlow;
    playerRef.current?.setSlow(next);
  };

  const handleToggleLoop = () => {
    const next = !isLooping;
    playerRef.current?.setLoop(next);
  };

  const handleRecordWebM = async () => {
    const player = playerRef.current;
    const cv = player?.canvas();
    if (!cv || !player) {
      onToast('画布尚未就绪');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      onToast('当前环境不支持 MediaRecorder 录制');
      return;
    }

    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    const supportedMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';

    let recorder: MediaRecorder;
    const chunks: Blob[] = [];

    try {
      const stream = (cv as any).captureStream(30);
      recorder = new MediaRecorder(
        stream,
        supportedMime ? { mimeType: supportedMime, videoBitsPerSecond: 8000000 } : undefined
      );
    } catch (err: any) {
      onToast(`无法启动录制: ${err.message}`);
      return;
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(config.title || '行走海报').replace(/[\s·]+/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);

      setRecording(false);
      setRecordProgress('');
      player.setLoop(isLooping);
      onToast(`✓ 已导出 WebM 视频 (${(blob.size / (1024 * 1024)).toFixed(1)} MB)`);
    };

    setRecording(true);
    setRecordProgress('录制中…');
    player.setLoop(false);
    player.setSlow(false);
    player.seek(0);
    player.setPlaying(true);

    recorder.start(200);

    const dur = player.duration();
    const interval = setInterval(() => {
      const cur = player.time();
      setRecordProgress(`录制中 ${cur.toFixed(1)}s / ${dur.toFixed(1)}s`);
      if (cur >= dur - 0.05 || !player.isPlaying()) {
        clearInterval(interval);
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }
    }, 100);
  };

  const handleExportSrt = () => {
    const srtText = generateSrtContent(config.scenes, totalDuration);
    const filename = `${(config.title || '行走海报').replace(/[\s·]+/g, '-')}.srt`;
    downloadTextFile(filename, srtText);
    onToast('✓ 已导出精确匹配的 SRT 字幕');
  };

  return (
    <aside className="flex w-full flex-col gap-3 sm:w-[260px] lg:w-[270px]">
      <div className="flex items-center justify-between">
        <span className="font-serif text-xs font-semibold tracking-[0.3em] text-[#9e8f7c]">
          行 程
        </span>
        <span className="font-mono text-[11px] text-[#9e8f7c]">
          {scenes.length} 幕
        </span>
      </div>

      {/* 场景列表 */}
      <div className="flex max-h-[460px] flex-col gap-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {scenes.map((scene, idx) => {
          const isActive = activeSceneIndex === idx;
          const timeLabel = (TIMES as any)[scene.time]?.name || scene.time;
          const terrainLabel = (TERRAINS as any)[scene.terrain]?.name || scene.terrain;
          const weatherLabel = (WEATHERS as any)[scene.weather] || scene.weather;

          return (
            <button
              key={scene.id || idx}
              type="button"
              onClick={() => onJumpToScene(idx)}
              className={`group flex items-start gap-2.5 rounded-sm border p-2.5 text-left transition-all ${
                isActive
                  ? 'translate-x-1 border-l-[3px] border-[#c99a3f] border-l-[#c8472b] bg-[#c8472b]/15 text-[#f5ede0]'
                  : 'border-[#e8ddc8]/12 bg-[#e8ddc8]/[0.02] text-[#9e8f7c] hover:translate-x-0.5 hover:border-[#c99a3f]/40 hover:text-[#e8ddc8]'
              }`}
            >
              <span
                className={`font-serif text-sm font-black ${
                  isActive ? 'text-[#c99a3f]' : 'text-[#c99a3f]/70'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`truncate text-xs font-semibold tracking-wider ${
                      isActive ? 'text-[#f5ede0]' : 'text-[#e8ddc8]'
                    }`}
                  >
                    {scene.label} · {scene.name}
                  </span>
                  <span className="font-mono text-[10px] text-[#9e8f7c]">
                    {scene.tStart.toFixed(1)}s
                  </span>
                </div>

                <div className="mt-0.5 truncate text-[11px] text-[#9e8f7c]">
                  {scene.quote}
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#9e8f7c]/80">
                  <span>{timeLabel}</span>
                  <span>/</span>
                  <span>{terrainLabel}</span>
                  {weatherLabel && weatherLabel !== '无' && (
                    <>
                      <span>/</span>
                      <span className="text-[#c99a3f]">{weatherLabel}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 快捷播放控制 */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <button
          type="button"
          onClick={handleReplay}
          className="flex items-center justify-center gap-1 rounded border border-[#e8ddc8]/20 bg-[#e8ddc8]/5 py-2 text-xs font-medium text-[#e8ddc8] transition hover:bg-[#e8ddc8]/10"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>↺ 重走</span>
        </button>

        <button
          type="button"
          onClick={handleTogglePlay}
          className="flex items-center justify-center gap-1 rounded border border-[#c99a3f]/40 bg-[#c99a3f]/10 py-2 text-xs font-medium text-[#c99a3f] transition hover:bg-[#c99a3f]/20"
        >
          {isPlaying ? (
            <>
              <Pause className="h-3.5 w-3.5" />
              <span>⏸ 暂停</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              <span>▶ 播放</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleToggleSlow}
          className={`flex items-center justify-center rounded border py-2 text-xs font-medium transition ${
            isSlow
              ? 'border-[#c99a3f] bg-[#c99a3f]/20 text-[#c99a3f]'
              : 'border-[#e8ddc8]/20 bg-[#e8ddc8]/5 text-[#9e8f7c] hover:text-[#e8ddc8]'
          }`}
        >
          <span>{isSlow ? '慢走中 0.5x' : '慢走'}</span>
        </button>

        <button
          type="button"
          onClick={handleToggleLoop}
          className={`flex items-center justify-center rounded border py-2 text-xs font-medium transition ${
            isLooping
              ? 'border-[#c8472b] bg-[#c8472b]/20 text-[#f5ede0]'
              : 'border-[#e8ddc8]/20 bg-[#e8ddc8]/5 text-[#9e8f7c] hover:text-[#e8ddc8]'
          }`}
        >
          <span>{isLooping ? '循环开' : '循环关'}</span>
        </button>
      </div>

      {/* 录制与字幕 */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={recording}
          onClick={handleRecordWebM}
          className="flex items-center justify-center gap-1 rounded bg-[#c8472b] py-2 text-xs font-medium text-white transition hover:bg-[#b53c22] disabled:opacity-50"
        >
          <Video className="h-3.5 w-3.5" />
          <span>{recording ? recordProgress || '录制中…' : '● 录 WebM'}</span>
        </button>

        <button
          type="button"
          onClick={handleExportSrt}
          className="flex items-center justify-center gap-1 rounded border border-[#e8ddc8]/20 bg-[#e8ddc8]/5 py-2 text-xs font-medium text-[#e8ddc8] transition hover:bg-[#e8ddc8]/10"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>⬇ 导出 SRT</span>
        </button>
      </div>

      {/* 时刻表 */}
      <div className="flex items-center justify-between rounded border border-[#e8ddc8]/10 bg-[#e8ddc8]/[0.02] px-3 py-2 font-mono text-xs text-[#9e8f7c]">
        <span>时刻</span>
        <span className="font-bold text-[#e8ddc8]">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-[#9e8f7c]/70">
        点画面或空格暂停 · ←→跳段 · 点击上方行程可瞬时跳转
      </p>
    </aside>
  );
};
