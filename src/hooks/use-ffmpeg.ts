import { useState, useEffect, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const MT_URL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
const ST_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
const LOAD_TIMEOUT_MS = 30_000;

function canUseMultiThread(): boolean {
  return typeof SharedArrayBuffer !== 'undefined' && crossOriginIsolated === true;
}

export function useFFmpeg() {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());
  const isMultiThreadRef = useRef(false);

  const attachListeners = useCallback((ffmpeg: FFmpeg) => {
    ffmpeg.on('progress', ({ progress: prog }) => {
      setProgress(prog * 100);
    });
    ffmpeg.on('log', ({ message }) => {
      setLogs((prev) => [...prev, message].slice(-50));
    });
  }, []);

  const loadWithTimeout = useCallback(async (ffmpeg: FFmpeg, baseURL: string, multiThread: boolean) => {
    const loadPromise = ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      ...(multiThread && {
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
      }),
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('FFmpeg load timed out')), LOAD_TIMEOUT_MS)
    );

    await Promise.race([loadPromise, timeoutPromise]);
  }, []);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    if (loaded || isLoading) return;
    setIsLoading(true);
    setLoadError(null);

    const useMultiThread = canUseMultiThread();
    isMultiThreadRef.current = useMultiThread;

    // Attempt 1: try preferred core (multi-threaded if supported)
    try {
      const ffmpeg = ffmpegRef.current;
      attachListeners(ffmpeg);
      await loadWithTimeout(ffmpeg, useMultiThread ? MT_URL : ST_URL, useMultiThread);
      console.log(`FFmpeg loaded (${useMultiThread ? 'multi-threaded' : 'single-threaded'})`);
      setLoaded(true);
      setIsLoading(false);
      return;
    } catch (err) {
      console.error("FFmpeg load attempt 1 failed:", err);
    }

    // Attempt 2: if multi-threaded failed, fallback to single-threaded
    if (useMultiThread) {
      console.log("Falling back to single-threaded core...");
      try { ffmpegRef.current.terminate(); } catch (e) { /* ignore */ }

      const ff = new FFmpeg();
      attachListeners(ff);
      ffmpegRef.current = ff;
      isMultiThreadRef.current = false;

      try {
        await loadWithTimeout(ff, ST_URL, false);
        console.log("FFmpeg loaded (single-threaded fallback)");
        setLoaded(true);
        setIsLoading(false);
        return;
      } catch (fallbackErr) {
        console.error("Single-threaded fallback also failed:", fallbackErr);
      }
    }

    // Both attempts failed
    setLoadError("Failed to load FFmpeg engine. Please retry.");
    setIsLoading(false);
  }

  const retry = () => {
    // Reset everything so load() can run again
    try { ffmpegRef.current.terminate(); } catch (e) { /* ignore */ }
    ffmpegRef.current = new FFmpeg();
    setLoaded(false);
    setIsLoading(false);
    setLoadError(null);
    // Use setTimeout to ensure state resets before load() checks guards
    setTimeout(() => load(), 0);
  }

  const cancel = async () => {
    try {
      ffmpegRef.current.terminate();
    } catch (e) {
      // ignore
    }

    setProgress(0);
    setLogs([]);

    const ff = new FFmpeg();
    attachListeners(ff);
    ffmpegRef.current = ff;

    try {
      const useMultiThread = canUseMultiThread();
      await loadWithTimeout(ff, useMultiThread ? MT_URL : ST_URL, useMultiThread);
    } catch (err) {
      console.error("FFmpeg reload error:", err);
      setLoaded(false);
      setLoadError("Failed to reload FFmpeg engine. Please retry.");
    }
  }

  return { ffmpeg: ffmpegRef.current, loaded, isLoading, loadError, progress, logs, load, cancel, retry };
}
