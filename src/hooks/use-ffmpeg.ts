import { useState, useEffect, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const BASE_URL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';

export function useFFmpeg() {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());

  const attachListeners = useCallback((ffmpeg: FFmpeg) => {
    ffmpeg.on('progress', ({ progress: prog }) => {
      setProgress(prog * 100);
    });
    ffmpeg.on('log', ({ message }) => {
      setLogs((prev) => [...prev, message].slice(-50));
    });
  }, []);

  const loadInstance = useCallback(async (ffmpeg: FFmpeg) => {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.worker.js`, 'text/javascript'),
    });
  }, []);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    if (loaded || isLoading) return;
    setIsLoading(true);
    const ffmpeg = ffmpegRef.current;
    attachListeners(ffmpeg);

    try {
      await loadInstance(ffmpeg);
      setLoaded(true);
    } catch (err) {
      console.error("FFmpeg load error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const cancel = async () => {
    // Terminate the current instance
    try {
      ffmpegRef.current.terminate();
    } catch (e) {
      // ignore
    }

    setProgress(0);
    setLogs([]);

    // Create a fresh instance and silently reload in the background
    // Do NOT set loaded=false so the user stays in the editor
    const ff = new FFmpeg();
    attachListeners(ff);
    ffmpegRef.current = ff;

    try {
      await loadInstance(ff);
      // loaded stays true — seamless reload
    } catch (err) {
      console.error("FFmpeg reload error:", err);
      setLoaded(false); // only show loading screen if reload actually fails
    }
  }

  return { ffmpeg: ffmpegRef.current, loaded, isLoading, progress, logs, load, cancel };
}

