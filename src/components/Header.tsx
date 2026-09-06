import React from 'react';
import { Eye, ExternalLink, Download } from 'lucide-react';
import { PosterConfig } from '../types';

interface HeaderProps {
  config: PosterConfig;
  duration: number;
  onOpenPreviewModal: () => void;
  onOpenNewTab: () => void;
  onDownloadHtml: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  duration,
  onOpenPreviewModal,
  onOpenNewTab,
  onDownloadHtml,
}) => {
  const title = config.title || '行者 · 金句漫游';
  const firstChar = [...title][0] || '行';
  const parts = title.split(/\s*·\s*/);
  const part1 = parts[0] || title;
  const part2 = parts[1] || '';

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8ddc8]/10 pb-4 pt-5">
      <div className="flex items-center gap-3.5">
        {/* 朱砂印章 */}
        <div className="grid h-11 w-11 -rotate-3 place-items-center rounded-lg bg-[#c8472b] font-['Ma_Shan_Zheng',cursive] text-2xl font-bold text-white shadow-[2px_3px_0_rgba(0,0,0,0.4)]">
          {firstChar}
        </div>

        <div>
          <h1 className="flex items-baseline font-serif text-2xl font-black tracking-wide text-[#e8ddc8] sm:text-3xl">
            <span>{part1}</span>
            {part2 && (
              <>
                <span className="mx-1 text-[#c8472b]">·</span>
                <span className="text-[#c8472b]">{part2}</span>
              </>
            )}
            <span className="ml-2.5 hidden text-xs font-normal tracking-widest text-[#9e8f7c] sm:inline-block">
              {config.subtitle || '一直走的海报'} · 配置台
            </span>
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Badges */}
        <span className="hidden rounded border border-[#e8ddc8]/20 bg-[#e8ddc8]/5 px-2.5 py-1 text-xs font-mono text-[#9e8f7c] md:inline-block">
          9:16 · 1080×1920
        </span>
        <span className="rounded border border-[#e8ddc8]/20 bg-[#e8ddc8]/5 px-2.5 py-1 text-xs font-mono text-[#9e8f7c]">
          {config.scenes.length} 段文案 · {duration.toFixed(0)} 秒
        </span>
        <span className="hidden rounded border border-[#c99a3f]/30 bg-[#c99a3f]/10 px-2.5 py-1 text-xs font-sans text-[#c99a3f] lg:inline-block">
          昼夜 / 地形 / 天气平滑过渡
        </span>

        {/* Quick HTML Export Actions */}
        <button
          type="button"
          onClick={onOpenPreviewModal}
          className="flex items-center gap-1.5 rounded border border-[#c99a3f]/60 bg-[#c99a3f]/15 px-3 py-1.5 text-xs font-medium text-[#c99a3f] transition hover:bg-[#c99a3f]/25"
          title="在弹窗中实时预览导出的纯 HTML 页面"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>HTML 预览</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewTab}
          className="flex items-center gap-1.5 rounded border border-[#e8ddc8]/25 bg-[#e8ddc8]/5 px-3 py-1.5 text-xs font-medium text-[#e8ddc8] transition hover:border-[#e8ddc8]/50 hover:bg-[#e8ddc8]/10"
          title="在新标签页中全屏运行纯 HTML 播放器"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">新标签页</span>
        </button>

        <button
          type="button"
          onClick={onDownloadHtml}
          className="flex items-center gap-1.5 rounded bg-[#c8472b] px-3.5 py-1.5 text-xs font-medium text-white shadow transition hover:bg-[#b53c22]"
          title="下载离线纯 HTML 单文件"
        >
          <Download className="h-3.5 w-3.5" />
          <span>导出 HTML</span>
        </button>
      </div>
    </header>
  );
};
