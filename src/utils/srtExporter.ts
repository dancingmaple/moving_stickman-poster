import { PosterScene } from '../types';

export function formatTimeSrt(seconds: number): string {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${h}:${m}:${s.replace('.', ',')}`;
}

export function generateSrtContent(scenes: PosterScene[], totalDuration: number): string {
  const cues = scenes.map((s, idx) => {
    const text = `${s.quote}，${s.sub} ${s.source}`;
    const t0 = s.tStart !== undefined ? Math.max(0, s.tStart + 0.3) : (idx * totalDuration) / scenes.length;
    const nextStart =
      idx < scenes.length - 1 && scenes[idx + 1].tStart !== undefined
        ? scenes[idx + 1].tStart! - 0.2
        : totalDuration - 0.2;
    const t1 = Math.min(totalDuration, Math.max(t0 + 2.0, nextStart));

    return {
      index: idx + 1,
      t0,
      t1,
      text,
    };
  });

  return cues
    .map(
      (c) =>
        `${c.index}\n${formatTimeSrt(c.t0)} --> ${formatTimeSrt(c.t1)}\n${c.text}\n`
    )
    .join('\n');
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
}
