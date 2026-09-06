import { BUILTIN_ASSETS } from '../engine/builtinAssets';
import { PLAYER_CSS, PLAYER_RUNTIME_JS, POSTER_ENGINE_JS } from '../engine/engineSource';
import { PosterEngine } from '../engine/posterEngine';
import { PosterConfig } from '../types';

async function imageToDataUrl(src: string): Promise<string> {
  if (!src || src.startsWith('data:')) return src;
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.82);
    }
    return src;
  } catch {
    return src;
  }
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function buildStandaloneHtml(
  config: PosterConfig,
  onProgress?: (msg: string) => void
): Promise<string> {
  const cloned: PosterConfig = JSON.parse(JSON.stringify(config));

  // Inline all image assets as Base64 Data URLs so the HTML is 100% offline
  for (let i = 0; i < cloned.scenes.length; i++) {
    const scene = cloned.scenes[i];
    let img = scene.image;
    if (img && img.startsWith('builtin:')) {
      img = BUILTIN_ASSETS[img] || img;
    }
    onProgress?.(`内嵌场景配图 (${i + 1}/${cloned.scenes.length})…`);
    scene.image = img ? await imageToDataUrl(img) : '';
  }

  onProgress?.('编译单文件 HTML…');

  const configJson = JSON.stringify(cloned).replace(/<\/script/gi, '<\\/script');
  const compiled = PosterEngine.compile(cloned);
  const title = cloned.title || '行者 · 金句漫游';
  const subtitle = cloned.subtitle || '一直走的海报';
  const firstChar = [...title][0] || '行';
  const [part1, part2] = title.split(/\s*·\s*/);

  const googleFontsUrl =
    'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@700;900&display=swap';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escapeHtml(title)} — ${escapeHtml(subtitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${googleFontsUrl}">
<style>${PLAYER_CSS}</style>
</head>
<body>
<div class="glyph" aria-hidden="true">${escapeHtml(firstChar)}</div>
<div class="wrap">
<header>
  <div class="hseal">${escapeHtml(firstChar)}</div>
  <h1>${escapeHtml(part1 || title)}${part2 ? ' · <em>' + escapeHtml(part2) + '</em>' : ''}</h1>
  <div class="hmeta">
    <span>9:16 · 1080×1920</span>
    <span>${cloned.scenes.length} 段文案</span>
    <span>${compiled.T.toFixed(0)} 秒</span>
    <span>单文件 · 离线可开</span>
  </div>
</header>
<main>
  <div class="stage">
    <canvas id="cv" title="点击 播放/暂停"></canvas>
    <div class="pbar" id="pbar"><i id="pfill"></i></div>
    <div class="cap">点画面暂停 · 空格暂停 · ←→ 跳段 · 点右侧行程跳转 · ?t=秒 定格 · ?clean=1 纯净模式</div>
  </div>
  <aside class="rail">
    <div class="rt">行 程</div>
    <div id="phases"></div>
    <div class="ctrl">
      <button class="btn pri" id="bReplay">↺ 重走</button>
      <button class="btn" id="bPause">⏸ 暂停</button>
      <button class="btn tgl" id="bSlow" aria-pressed="false">慢走</button>
      <button class="btn tgl" id="bLoop" aria-pressed="true">循环</button>
      <button class="btn pri" id="bRec">● 录制 WebM</button>
      <button class="btn" id="bSrt">⬇ 导出 SRT</button>
    </div>
    <div class="clock">时刻 <b id="clk">0:00.0</b></div>
    <div class="exp" id="exp">由「行者 · 金句漫游」配置面板导出 · 配图已内嵌，断网亦可流畅播放</div>
  </aside>
</main>
<footer>${escapeHtml(subtitle)} · 世界横向滚动，行者原地踏步 · 文字与配图从右缘入场横穿全屏 · 昼夜/地形/天气按路段平滑过渡 · 场景：${cloned.scenes.map(s => s.label + '「' + s.quote + '」').join(' / ')}</footer>
</div>
<script>window.POSTER_CONFIG=${configJson};<\/script>
<script>${POSTER_ENGINE_JS.replace(/<\/script/gi, '<\\/script')}<\/script>
<script>${PLAYER_RUNTIME_JS.replace(/<\/script/gi, '<\\/script')}<\/script>
</body>
</html>`;
}

export async function downloadHtmlFile(
  config: PosterConfig,
  onProgress?: (msg: string) => void
): Promise<string> {
  const html = await buildStandaloneHtml(config, onProgress);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const filename = `${(config.title || '行走金句海报').replace(/[\s·]+/g, '-')}-单文件版.html`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
  return filename;
}

export async function openHtmlInNewTab(
  config: PosterConfig,
  onProgress?: (msg: string) => void
): Promise<void> {
  const html = await buildStandaloneHtml(config, onProgress);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // keep URL active for some time for the tab to load
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function generateHtmlBlobUrl(
  config: PosterConfig,
  onProgress?: (msg: string) => void
): Promise<{ url: string; html: string; revoke: () => void }> {
  const html = await buildStandaloneHtml(config, onProgress);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  return {
    url,
    html,
    revoke: () => URL.revokeObjectURL(url),
  };
}
