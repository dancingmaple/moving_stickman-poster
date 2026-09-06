import React, { useRef } from 'react';
import {
  Download,
  ExternalLink,
  Eye,
  Copy,
  Video,
  FileText,
  Save,
  UploadCloud,
  RotateCcw,
  Archive,
} from 'lucide-react';
import { DEFAULT_CONFIG } from '../../constants/presets';
import { PosterConfig } from '../../types';
import { buildStandaloneHtml, downloadHtmlFile, openHtmlInNewTab } from '../../utils/htmlExporter';
import { exportSkillZip } from '../../utils/skillZipExporter';
import { downloadTextFile, generateSrtContent } from '../../utils/srtExporter';

interface ExportTabProps {
  config: PosterConfig;
  totalDuration: number;
  onOpenPreviewModal: () => void;
  onConfigLoaded: (cfg: PosterConfig) => void;
  onToast: (msg: string) => void;
}

export const ExportTab: React.FC<ExportTabProps> = ({
  config,
  totalDuration,
  onOpenPreviewModal,
  onConfigLoaded,
  onToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDownloadHtml = async () => {
    try {
      onToast('正在打包单文件 HTML…');
      const filename = await downloadHtmlFile(config, (msg) => onToast(msg));
      onToast(`✓ 纯 HTML 单文件已导出: ${filename}`);
    } catch (err: any) {
      onToast(`导出失败: ${err.message}`);
    }
  };

  const handleOpenNewTab = async () => {
    try {
      onToast('正在生成新标签页预览…');
      await openHtmlInNewTab(config, (msg) => onToast(msg));
    } catch (err: any) {
      onToast(`打开失败: ${err.message}`);
    }
  };

  const handleCopyHtml = async () => {
    try {
      onToast('正在生成 HTML 源代码…');
      const html = await buildStandaloneHtml(config);
      await navigator.clipboard.writeText(html);
      onToast('✓ 已复制纯 HTML 完整代码到剪贴板！');
    } catch (err: any) {
      onToast(`复制失败: ${err.message}`);
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(config, null, 2);
    const filename = `${(config.title || '行走海报').replace(/[\s·]+/g, '-')}-config.json`;
    downloadTextFile(filename, jsonStr);
    onToast(`✓ 已导出配置 JSON: ${filename}`);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed && parsed.scenes && Array.isArray(parsed.scenes)) {
          onConfigLoaded(parsed);
          onToast('✓ 配置文件加载成功');
        } else {
          onToast('无效的配置文件格式');
        }
      } catch (err: any) {
        onToast(`读取配置失败: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportSrt = () => {
    const srtText = generateSrtContent(config.scenes, totalDuration);
    const filename = `${(config.title || '行走海报').replace(/[\s·]+/g, '-')}.srt`;
    downloadTextFile(filename, srtText);
    onToast('✓ 已导出精确匹配的 SRT 字幕');
  };

  const handleExportSkillZip = async () => {
    try {
      onToast('正在打包 Skill ZIP…');
      const zipBlob = await exportSkillZip(config);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `walking-poster-skill-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
      onToast('✓ 已导出完整 Skill ZIP 增强包');
    } catch (err: any) {
      onToast(`打包失败: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 text-xs text-[#e8ddc8]">
      {/* 核心亮点：单文件纯 HTML */}
      <div className="rounded-lg border border-[#c99a3f]/40 bg-[#c99a3f]/[0.06] p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="rounded bg-[#c99a3f]/20 p-1 text-[#c99a3f]">
            <Download className="h-4 w-4" />
          </div>
          <h3 className="font-serif text-sm font-bold tracking-wider text-[#c99a3f]">
            单文件纯 HTML 导出与预览
          </h3>
        </div>

        <p className="mt-2 text-[12px] leading-relaxed text-[#9e8f7c]">
          把当前全部配置 + 零依赖渲染引擎 + 完整独立播放器 + 内置/自定义配图全部打包内嵌为一个{' '}
          <strong className="font-mono text-[#e8ddc8]">.html</strong>{' '}
          文件。无需任何服务器，下载后双击在任何电脑/手机浏览器即开即播；内含循环、慢走、跳段、WebM 录制与 SRT 导出完整功能！
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="flex items-center gap-1.5 rounded bg-[#c8472b] px-3.5 py-2 font-medium text-white shadow transition hover:bg-[#b53c22]"
          >
            <Download className="h-4 w-4" />
            <span>⬇ 导出单文件 HTML</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewTab}
            className="flex items-center gap-1.5 rounded border border-[#c99a3f]/50 bg-[#c99a3f]/15 px-3 py-2 text-[#c99a3f] transition hover:bg-[#c99a3f]/25"
          >
            <ExternalLink className="h-4 w-4" />
            <span>↗ 新标签页预览导出版</span>
          </button>

          <button
            type="button"
            onClick={onOpenPreviewModal}
            className="flex items-center gap-1.5 rounded border border-[#e8ddc8]/20 bg-[#e8ddc8]/5 px-3 py-2 text-[#e8ddc8] transition hover:bg-[#e8ddc8]/10"
          >
            <Eye className="h-4 w-4" />
            <span>👁 弹窗内嵌纯 HTML 实时预览</span>
          </button>

          <button
            type="button"
            onClick={handleCopyHtml}
            className="flex items-center gap-1.5 rounded border border-[#e8ddc8]/20 bg-[#e8ddc8]/5 px-3 py-2 text-[#9e8f7c] transition hover:text-[#e8ddc8]"
          >
            <Copy className="h-4 w-4" />
            <span>复制代码</span>
          </button>
        </div>
      </div>

      {/* 视频与字幕 */}
      <div className="space-y-3 border-t border-[#e8ddc8]/10 pt-4">
        <h3 className="font-serif text-sm font-bold tracking-wider text-[#c99a3f]">
          视频与字幕
        </h3>
        <p className="text-[11px] text-[#9e8f7c]">
          支持通过浏览器逐帧高品质录制 WebM 视频，以及导出与画面严格同步的 SRT 字幕文件，直通剪辑配音。
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportSrt}
            className="flex items-center gap-1.5 rounded border border-[#e8ddc8]/20 bg-[#e8ddc8]/5 px-3 py-1.5 text-xs text-[#e8ddc8] transition hover:bg-[#e8ddc8]/10"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>⬇ 导出 SRT 字幕</span>
          </button>
        </div>
      </div>

      {/* 配置数据备份与恢复 */}
      <div className="space-y-3 border-t border-[#e8ddc8]/10 pt-4">
        <h3 className="font-serif text-sm font-bold tracking-wider text-[#c99a3f]">
          配置数据管理
        </h3>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 rounded border border-[#e8ddc8]/20 bg-[#e8ddc8]/5 px-3 py-1.5 text-xs text-[#e8ddc8] transition hover:bg-[#e8ddc8]/10"
          >
            <Save className="h-3.5 w-3.5" />
            <span>⬇ 导出配置 JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded border border-[#e8ddc8]/20 bg-[#e8ddc8]/5 px-3 py-1.5 text-xs text-[#e8ddc8] transition hover:bg-[#e8ddc8]/10"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>⬆ 导入配置 JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportJson}
          />

          <button
            type="button"
            onClick={() => {
              if (window.confirm('确定恢复默认金句海报配置吗？当前未导出的更改将被覆盖。')) {
                onConfigLoaded(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
                onToast('已恢复默认配置');
              }
            }}
            className="flex items-center gap-1.5 rounded border border-[#c8472b]/30 px-3 py-1.5 text-xs text-[#c8472b] transition hover:bg-[#c8472b]/10"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>恢复默认配置</span>
          </button>
        </div>
      </div>

      {/* Skill ZIP 增强包 */}
      <div className="space-y-3 border-t border-[#e8ddc8]/10 pt-4">
        <h3 className="font-serif text-sm font-bold tracking-wider text-[#c99a3f]">
          Agent Skill 扩展包
        </h3>
        <p className="text-[11px] leading-relaxed text-[#9e8f7c]">
          导出包含 SKILL.md、纯单文件 HTML 运行时模板、Prompt 指南及当前个性化配置的完整 ZIP 技能包，供 Claude Code、Cursor 或 AI Studio 即装即用。
        </p>

        <button
          type="button"
          onClick={handleExportSkillZip}
          className="flex items-center gap-1.5 rounded border border-[#c99a3f]/40 bg-[#c99a3f]/10 px-3.5 py-1.5 text-xs text-[#c99a3f] transition hover:bg-[#c99a3f]/20"
        >
          <Archive className="h-3.5 w-3.5" />
          <span>⬇ 导出 Skill ZIP 增强包</span>
        </button>
      </div>
    </div>
  );
};
