import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { PosterEngine } from '../engine/posterEngine';
import { CanvasPlayerHandle, EngineRenderer, PosterConfig } from '../types';

interface CanvasPreviewProps {
  config: PosterConfig;
  onFrame?: (t: number, total: number, sceneIndex: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onEnded?: () => void;
}

export const CanvasPreview = forwardRef<CanvasPlayerHandle, CanvasPreviewProps>(
  ({ config, onFrame, onPlayingChange, onEnded }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rendererRef = useRef<EngineRenderer | null>(null);
    const stateRef = useRef({
      t: 0,
      playing: true,
      loop: true,
      slow: false,
      last: performance.now(),
    });
    const callbacksRef = useRef({ onFrame, onPlayingChange, onEnded });
    callbacksRef.current = { onFrame, onPlayingChange, onEnded };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        rendererRef.current = PosterEngine.createRenderer(canvas, config);
      } catch (err) {
        console.error('Failed to create renderer:', err);
        return;
      }

      let animId = 0;
      const loop = (now: number) => {
        const s = stateRef.current;
        const r = rendererRef.current;
        if (r && r.model) {
          const T = r.model.T;
          const dt = Math.min(0.1, (now - s.last) / 1000);
          s.last = now;

          if (s.playing) {
            s.t += dt * (s.slow ? 0.5 : 1);
            if (s.t > T) {
              if (s.loop) {
                s.t %= T;
              } else {
                s.t = T;
                s.playing = false;
                callbacksRef.current.onPlayingChange?.(false);
                callbacksRef.current.onEnded?.();
              }
            }
          }

          const curT = Math.min(s.t, T - 0.001);
          r.draw(curT);
          const sIdx = r.model.sceneIndexAt(curT);
          callbacksRef.current.onFrame?.(curT, T, sIdx);
        }
        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animId);
    }, []);

    // Update config on change
    useEffect(() => {
      if (rendererRef.current) {
        rendererRef.current.setConfig(config);
        if (stateRef.current.t > rendererRef.current.model.T) {
          stateRef.current.t = 0;
        }
      }
    }, [config]);

    const setPlaying = (play: boolean) => {
      stateRef.current.playing = play;
      stateRef.current.last = performance.now();
      callbacksRef.current.onPlayingChange?.(play);
    };

    useImperativeHandle(
      ref,
      () => ({
        seek: (t: number) => {
          stateRef.current.t = Math.max(0, t);
        },
        toggle: () => setPlaying(!stateRef.current.playing),
        replay: () => {
          stateRef.current.t = 0;
          setPlaying(true);
        },
        setLoop: (loop: boolean) => {
          stateRef.current.loop = loop;
        },
        setSlow: (slow: boolean) => {
          stateRef.current.slow = slow;
        },
        setPlaying,
        isPlaying: () => stateRef.current.playing,
        time: () => stateRef.current.t,
        duration: () => rendererRef.current?.model?.T ?? 0,
        renderer: () => rendererRef.current,
        canvas: () => canvasRef.current,
      }),
      []
    );

    return (
      <canvas
        id="main-poster-canvas"
        ref={canvasRef}
        width={PosterEngine.W}
        height={PosterEngine.H}
        onClick={() => setPlaying(!stateRef.current.playing)}
        title="点击 播放 / 暂停"
        className="aspect-[9/16] h-[min(78vh,820px)] w-auto max-w-[92vw] cursor-pointer rounded-sm border border-[#c99a3f]/40 bg-[#120e0b] shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all hover:border-[#c99a3f]/70"
      />
    );
  }
);

CanvasPreview.displayName = 'CanvasPreview';
