import JSZip from 'jszip';
import { PosterConfig } from '../types';
import { buildStandaloneHtml } from './htmlExporter';
import { generateSrtContent } from './srtExporter';
import { PosterEngine } from '../engine/posterEngine';

export async function exportSkillZip(config: PosterConfig): Promise<Blob> {
  const zip = new JSZip();

  // Compile to get duration
  const compiled = PosterEngine.compile(config);

  // 1. Root README.md
  const readmeContent = `# 行者 · 金句漫游 (Walking Poster Skill) - 增强定制版

这是经过深度优化的「行走文字海报」Skill 技能包，专门用于生成东方雅韵、富有生命力的动态行走文字海报视频、单文件离线网页与配音字幕。

## 🎯 优化升级亮点
1. **单文件纯 HTML 独立播放器**：
   - 包含 \`poster-standalone.html\`，零外部服务依赖，离线双击即播。
   - 包含完整的循环、慢放、分段跳转、WebM 录制与 SRT 导出能力。
2. **多款国风人物造型与骨骼动力学**：
   - 书生(长衫·书箱)、背包客(现代)、行脚僧(斗笠·锡杖)、汉服少女(飘带)、原版小人。
   - 两段式腿部骨骼(髋 + 膝)与反相摆臂，脚落地自然起伏，步频与距离物理绑定。
   - 斗笠/草帽/鸭舌帽、伴行小狗/小鸟、雨天自动撑伞、天黑自动点灯笼。
3. **六大传统书法排版与二十余种点缀**：
   - 错落横排、竖排长题、阶梯落字、宣纸卡片、扇面题画、手卷横批。
   - 晨曦、白昼、黄昏、星夜平滑渐变过渡，平原、群山、江湖、古城、竹林、大漠六种地貌。
4. **精确毫秒级 SRT 字幕**：
   - 随包附带 \`poster.srt\`，直接对齐每幕金句入场时间点，直通剪辑配音。

## 📂 技能包目录
- \`SKILL.md\`：AI Agent 核心调用指南与工作流规范
- \`poster-standalone.html\`：当前海报的完整单文件纯 HTML 离线播放器
- \`custom-preset.json\`：当前海报的全部配置 JSON
- \`poster.srt\`：严格对齐的时间轴字幕
`;
  zip.file('README.md', readmeContent);

  // 2. SKILL.md
  const skillMdContent = `---
name: walking-poster
description: 生成"行走金句海报" — 一个小人细线条不停往前走并带丰富动作、道具、伴行生灵与气候天色的 9:16 动态海报，文字金句优雅入场，全元素带动画，一键导出纯 HTML 单文件、MP4/WebM 视频与高精度 SRT 字幕。
---

# 行走海报 (Walking Poster) 规范

给一个主题或一段文案，产出一支"小人一直往前走"的动态海报：世界横向滚动、小人原地走（腿摆与地面同步、脚印留身后、天亮提灯、雨雪撑伞），沿途逐景弹出金句大字、印章、意象图与诗文；最终交付 **单文件离线 HTML 播放器 + 视频录制 + 同步 SRT 字幕**。
`;
  zip.file('SKILL.md', skillMdContent);

  // 3. custom-preset.json
  zip.file('custom-preset.json', JSON.stringify(config, null, 2));

  // 4. poster.srt
  const srtContent = generateSrtContent(config.scenes, compiled.T);
  zip.file('poster.srt', srtContent);

  // 5. poster-standalone.html (The standalone offline pure HTML!)
  const standaloneHtml = await buildStandaloneHtml(config);
  zip.file('poster-standalone.html', standaloneHtml);

  return await zip.generateAsync({ type: 'blob' });
}
