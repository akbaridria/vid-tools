import { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export function useFFmpeg() {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    if (loaded || isLoading) return;
    setIsLoading(true);
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on('progress', ({ progress: prog }) => {
      setProgress(prog * 100);
    });

    ffmpeg.on('log', ({ message }) => {
      setLogs((prev) => [...prev, message].slice(-50)); // keep last 50 logs
    });

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setLoaded(true);
    } catch (err) {
      console.error("FFmpeg load error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return { ffmpeg: ffmpegRef.current, loaded, isLoading, progress, logs, load };
}
