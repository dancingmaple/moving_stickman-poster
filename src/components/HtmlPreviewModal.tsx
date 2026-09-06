import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Download,
  Copy,
  Code,
  Eye,
  Check,
  RefreshCw,
} from 'lucide-react';
import { PosterConfig } from '../types';
import { buildStandaloneHtml, downloadHtmlFile, openHtmlInNewTab } from '../utils/htmlExporter';

interface HtmlPreviewModalProps {
  isOpen: boolean;
  config: PosterConfig;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const HtmlPreviewModal: React.FC<HtmlPreviewModalProps> = ({
  isOpen,
  config,
  onClose,
  onToast,
}) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setLoading(true);

    buildStandaloneHtml(config)
      .then((html) => {
        if (!active) return;
        setHtmlContent(html);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to generate preview HTML:', err);
        if (active) {
          setLoading(false);
          onToast(`生成预览失败: ${err.message}`);
        }
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      active = false;
      window.removeEventListener('keydown', handleKeyDown);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      onToast('✓ 纯 HTML 代码已复制到剪贴板！');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('复制失败，请手动选择复制');
    }
  };

  const handleDownload = async () => {
    await downloadHtmlFile(config);
    onToast('✓ 纯 HTML 文件下载已开始');
  };

  const handleOpenNewTab = async () => {
    await openHtmlInNewTab(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col rounded-xl border border-[#c99a3f]/40 bg-[#14100c] shadow-2xl overflow-hidden">
        {/* 顶部栏 */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#e8ddc8]/10 bg-[#19140f] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded bg-[#c8472b] font-serif text-sm font-bold text-white shadow">
              HTML
            </div>
            <div>
              <h2 className="font-serif text-base font-bold tracking-wide text-[#e8ddc8] sm:text-lg">
                纯 HTML 单文件版本 · 独立预览
              </h2>
              <p className="text-[11px] text-[#9e8f7c]">
                内嵌零依赖渲染引擎 + 完整独立播放器 + 内置配图 · 离线无需网络即可全屏播放
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            {/* 切换效果/代码 */}
            <div className="flex rounded border border-[#e8ddc8]/20 bg-[#120e0b] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
                  viewMode === 'preview'
                    ? 'bg-[#c99a3f]/20 font-medium text-[#c99a3f]'
                    : 'text-[#9e8f7c] hover:text-[#e8ddc8]'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>实时效果</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
                  viewMode === 'code'
                    ? 'bg-[#c99a3f]/20 font-medium text-[#c99a3f]'
                    : 'text-[#9e8f7c] hover:text-[#e8ddc8]'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>查看源码</span>
              </button>
            </div>

            {/* 新标签页打开 */}
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="flex items-center gap-1 rounded border border-[#e8ddc8]/20 bg-[#e8ddc8]/5 px-3 py-1.5 text-xs text-[#e8ddc8] transition hover:bg-[#e8ddc8]/10"
              title="在新标签页全屏打开"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">新标签页</span>
            </button>

            {/* 复制代码 */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded border border-[#e8ddc8]/20 bg-[#e8ddc8]/5 px-3 py-1.5 text-xs text-[#e8ddc8] transition hover:bg-[#e8ddc8]/10"
              title="复制全部纯 HTML 代码"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">复制代码</span>
                </>
              )}
            </button>

            {/* 下载文件 */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1 rounded bg-[#c8472b] px-3.5 py-1.5 text-xs font-medium text-white shadow transition hover:bg-[#b53c22]"
              title="下载 .html 文件"
            >
              <Download className="h-3.5 w-3.5" />
              <span>下载 HTML</span>
            </button>

            {/* 关闭 */}
            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded p-1.5 text-[#9e8f7c] transition hover:bg-[#e8ddc8]/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 内容主体 */}
        <div className="relative flex-1 overflow-hidden bg-[#0c0907]">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-xs text-[#c99a3f]">
              <RefreshCw className="h-6 w-6 animate-spin text-[#c99a3f]" />
              <span>正在构建离线纯 HTML 页面…</span>
            </div>
          ) : viewMode === 'preview' ? (
            <iframe
              title="纯 HTML 单文件离线预览"
              src={blobUrl}
              className="h-full w-full border-0"
              sandbox="allow-scripts allow-downloads allow-same-origin"
            />
          ) : (
            <div className="h-full overflow-auto p-4 font-mono text-xs leading-relaxed text-[#e8ddc8] [scrollbar-width:thin]">
              <div className="mb-2 flex items-center justify-between text-[11px] text-[#9e8f7c]">
                <span>
                  单文件纯 HTML 源码 · 大小 {(htmlContent.length / 1024).toFixed(1)} KB · 零外部服务依赖
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded border border-[#c99a3f]/40 px-2 py-0.5 text-[11px] text-[#c99a3f] hover:bg-[#c99a3f]/10"
                >
                  一键复制源码
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre rounded border border-[#e8ddc8]/10 bg-[#120e0b] p-4 text-[11px] text-[#e8ddc8]/90">
                {htmlContent}
              </pre>
            </div>
          )}
        </div>

        {/* 底部信息提示 */}
        <div className="flex flex-wrap items-center justify-between border-t border-[#e8ddc8]/10 bg-[#19140f] px-4 py-2 text-[11px] text-[#9e8f7c]">
          <span>
            💡 提示：导出的单文件 HTML 无需安装任何环境，双击即可在 Edge、Chrome、Safari 等任何浏览器全屏运行。
          </span>
          <span className="font-mono">
            分辨率 1080×1920 · 9:16 自适应
          </span>
        </div>
      </div>
    </div>
  );
};
