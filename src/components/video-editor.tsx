import { useState, useRef, useMemo } from "react"
import { useFFmpeg } from "@/hooks/use-ffmpeg"
import { fetchFile } from "@ffmpeg/util"
import { toast } from "@/components/toast"
import { trackEvent } from "@/lib/analytics"
import {
  Upload,
  FileVideo,
  Settings2,
  Download,
  Loader2,
  Sparkles,
  Wand2,
  X,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
} from "lucide-react"

type TabId = "optimize" | "format" | "enhance"

export default function VideoEditor() {
  const { ffmpeg, loaded, progress, logs, cancel, loadError, retry } = useFFmpeg()

  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultName, setResultName] = useState("")
  const [activeTab, setActiveTab] = useState<TabId>("optimize")

  const [format, setFormat] = useState("mp4")
  const [quality, setQuality] = useState(28)
  const [resolution, setResolution] = useState("original")
  const [denoise, setDenoise] = useState("off")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const sliderProgress = useMemo(() => (quality / 51) * 100, [quality])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith("video/")) {
      setFile(f); setResultUrl(null)
      trackEvent("file_uploaded", { file_type: f.type, file_size_mb: (f.size / 1048576).toFixed(1) })
    } else {
      toast("Please drop a valid video file.", "error")
    }
  }

  const handleProcess = async () => {
    if (!file || !loaded) return
    setIsProcessing(true); setResultUrl(null)
    trackEvent("processing_started", { format, quality, resolution, denoise })

    const inputName = `input_${file.name.replace(/\s+/g, "_")}`
    const ext = format === "original" ? file.name.split(".").pop() || "mp4" : format
    const isAudioOnly = ["mp3", "wav", "aac", "ogg"].includes(ext)
    const outputName = `output.${ext}`

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      const cmd = ["-i", inputName]

      if (isAudioOnly) {
        // Audio-only extraction
        cmd.push("-vn") // strip video
        if (ext === "mp3") cmd.push("-c:a", "libmp3lame", "-q:a", "2")
        else if (ext === "wav") cmd.push("-c:a", "pcm_s16le")
        else if (ext === "aac") cmd.push("-c:a", "aac", "-b:a", "192k")
        else if (ext === "ogg") cmd.push("-c:a", "libvorbis", "-q:a", "6")
        if (denoise === "on") cmd.push("-af", "afftdn")
      } else {
        // Video encoding per format
        switch (format) {
          case "webm":
            cmd.push("-c:v", "libvpx-vp9", "-crf", quality.toString(), "-b:v", "0", "-row-mt", "1", "-deadline", "realtime", "-cpu-used", "8")
            break
          case "ogv":
            cmd.push("-c:v", "libtheora", "-q:v", Math.max(0, Math.min(10, Math.round((51 - quality) / 5.1))).toString())
            break
          case "gif":
            cmd.push("-vf", resolution !== "original"
              ? `scale=${resolution === "4k" ? "3840:-1" : "1920:-1"}:flags=lanczos,fps=10`
              : "fps=10,scale=480:-1:flags=lanczos"
            )
            cmd.push("-loop", "0")
            break
          case "flv":
            cmd.push("-c:v", "flv1", "-q:v", Math.max(1, Math.min(31, Math.round(quality * 31 / 51))).toString())
            break
          case "ts":
            cmd.push("-c:v", "libx264", "-crf", quality.toString(), "-preset", "fast", "-f", "mpegts")
            break
          default:
            // mp4, mkv, mov, avi all use H.264
            cmd.push("-c:v", "libx264", "-crf", quality.toString(), "-preset", "fast")
            break
        }
        // Scaling (skip for gif, handled above)
        if (resolution !== "original" && format !== "gif") {
          cmd.push("-vf", `scale=${resolution === "4k" ? "3840:2160" : "1920:1080"}:flags=lanczos`)
        }
        // Limit threads when combining heavy filters to prevent deadlock in WASM multi-threading
        if (resolution !== "original" && denoise === "on") {
          cmd.push("-threads", "2")
        }
        // Audio
        if (format !== "gif") {
          if (denoise === "on") cmd.push("-af", "afftdn")
          else cmd.push("-c:a", "copy")
        }
      }
      cmd.push(outputName)

      const code = await ffmpeg.exec(cmd)
      if (code === 0) {
        const data = await ffmpeg.readFile(outputName)
        const mime = isAudioOnly ? `audio/${ext === "mp3" ? "mpeg" : ext}` : (ext === "gif" ? "image/gif" : `video/${ext}`)
        const blob = new Blob([data as any], { type: mime })
        const url = URL.createObjectURL(blob)
        setResultUrl(url)
        setResultName(`vidtools_${file.name.split(".")[0]}.${ext}`)
        trackEvent("processing_completed", { format: ext, file_size_mb: (blob.size / 1048576).toFixed(1) })
        toast("Video processed successfully.", "success")
      } else {
        toast("Processing failed.", "error")
      }
    } catch {
      toast("An error occurred during processing.", "error")
    } finally {
      setIsProcessing(false)
    }
  }

  /* ── Loading ──────────────────────────── */
  if (!loaded) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        {loadError ? (
          <>
            <AlertTriangle size={20} style={{ color: "var(--color-warning)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4 }}>{loadError}</p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 16 }}>
              This can happen due to browser restrictions or network issues.
            </p>
            <button className="btn btn-primary" onClick={retry} style={{ fontSize: 12 }}>
              <RotateCcw size={14} /> Retry
            </button>
          </>
        ) : (
          <>
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--color-text-muted)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Loading FFmpeg engine...</p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>~31 MB WebAssembly module</p>
          </>
        )}
      </div>
    )
  }

  /* ── Dropzone ─────────────────────────── */
  if (!file) {
    return (
      <div className="animate-fade-in">
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, letterSpacing: "-0.3px" }}>
          Process a video
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20 }}>
          Supports virtually any video format. Compress, convert, upscale, or denoise — everything runs locally.
        </p>
        <div
          className={`dropzone ${isDragging ? "dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={20} style={{ color: "var(--color-text-muted)", marginBottom: 10 }} />
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            Drop a video or <span style={{ color: "var(--color-text)", textDecoration: "underline", textUnderlineOffset: 3 }}>browse</span>
          </p>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 6 }}>
            Any video format — 1000+ formats supported
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            onChange={(e) => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setResultUrl(null) } }}
          />
        </div>
      </div>
    )
  }

  /* ── Processing ───────────────────────── */
  if (isProcessing) {
    return (
      <div className="animate-fade-in" style={{ padding: "40px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Loader2 size={16} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Processing...</span>
          <span className="badge" style={{ marginLeft: "auto" }}>{progress.toFixed(1)}%</span>
        </div>
        <div className="progress-bar" style={{ marginBottom: 20 }}>
          <div className="progress-bar-fill" style={{ width: `${Math.max(1, progress)}%` }} />
        </div>
        <div
          style={{
            background: "var(--color-bg)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xs)", padding: "10px 12px",
            fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)",
            maxHeight: 100, overflowY: "auto", lineHeight: 1.7,
            marginBottom: 20
          }}
        >
          {logs.slice(-6).map((log, i) => (
            <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{log}</div>
          ))}
        </div>
        
        <div style={{ textAlign: "center" }}>
          <button 
            className="btn" 
            onClick={() => { cancel(); setIsProcessing(false); }}
            style={{ 
              background: "var(--color-bg-secondary)", 
              border: "1px solid var(--color-border)", 
              color: "var(--color-error)",
              fontSize: 12
            }}
          >
            <X size={14} style={{ marginRight: 6 }} /> Cancel Processing
          </button>
        </div>
      </div>
    )
  }

  /* ── Result ───────────────────────────── */
  if (resultUrl) {
    return (
      <div className="animate-fade-in" style={{ padding: "40px 0", textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Done</p>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 24 }}>
          Processed entirely on your device.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <a href={resultUrl} download={resultName} style={{ textDecoration: "none" }}>
            <button className="btn btn-primary">
              <Download size={14} /> Download
            </button>
          </a>
          <button className="btn btn-secondary" onClick={() => { setResultUrl(null); setFile(null) }}>
            <RotateCcw size={14} /> New file
          </button>
        </div>
      </div>
    )
  }

  /* ── Editor ───────────────────────────── */
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "optimize", label: "Optimize", icon: <Wand2 size={14} /> },
    { id: "format", label: "Format", icon: <Settings2 size={14} /> },
    { id: "enhance", label: "Enhance", icon: <Sparkles size={14} /> },
  ]

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* File */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px", background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
        }}
      >
        <FileVideo size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {file.name}
          </p>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
        <button className="btn btn-danger-ghost" style={{ padding: 4 }} onClick={() => { setFile(null); setResultUrl(null) }}>
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div>
        <div className="tab-list">
          {tabs.map((t) => (
            <button key={t.id} className={`tab-trigger ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "20px 0" }}>
          {activeTab === "optimize" && (
            <div>
              <Label>Compression (CRF)</Label>
              <Hint>Lower = better quality, larger file.</Hint>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <input
                  type="range" className="range-slider" min={0} max={51} step={1} value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  style={{ "--slider-progress": `${sliderProgress}%`, flex: 1 } as React.CSSProperties}
                />
                <span className="badge">{quality}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Lossless</span>
                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Max compression</span>
              </div>
            </div>
          )}

          {activeTab === "format" && (
            <div>
              <Label>Output format</Label>
              <Hint>Choose the container format.</Hint>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 12, marginTop: 4 }}>Video</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
                {[
                  { value: "original", label: "Original" },
                  { value: "mp4", label: "MP4" },
                  { value: "webm", label: "WebM" },
                  { value: "mkv", label: "MKV" },
                  { value: "mov", label: "MOV" },
                  { value: "avi", label: "AVI" },
                  { value: "flv", label: "FLV" },
                  { value: "ogv", label: "OGV" },
                  { value: "ts", label: "MPEG-TS" },
                  { value: "gif", label: "GIF" },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className="btn"
                    style={{
                      padding: "8px 0",
                      fontSize: 12,
                      fontWeight: format === f.value ? 600 : 400,
                      background: format === f.value ? "var(--color-text)" : "var(--color-bg-input)",
                      color: format === f.value ? "var(--color-bg)" : "var(--color-text-secondary)",
                      border: `1px solid ${format === f.value ? "var(--color-text)" : "var(--color-border)"}`,
                      borderRadius: "var(--radius-xs)",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="separator" style={{ margin: "16px 0" }} />
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 8 }}>Audio only (extract)</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
                {[
                  { value: "mp3", label: "MP3" },
                  { value: "wav", label: "WAV" },
                  { value: "aac", label: "AAC" },
                  { value: "ogg", label: "OGG" },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className="btn"
                    style={{
                      padding: "8px 0",
                      fontSize: 12,
                      fontWeight: format === f.value ? 600 : 400,
                      background: format === f.value ? "var(--color-text)" : "var(--color-bg-input)",
                      color: format === f.value ? "var(--color-bg)" : "var(--color-text-secondary)",
                      border: `1px solid ${format === f.value ? "var(--color-text)" : "var(--color-border)"}`,
                      borderRadius: "var(--radius-xs)",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "enhance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <Label>Resolution</Label>
                <Hint>Upscale using Lanczos interpolation.</Hint>
                <div className="select-wrapper" style={{ marginTop: 12 }}>
                  <select className="select-control" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                    <option value="original">Original</option>
                    <option value="1080p">1080p</option>
                    <option value="4k">4K</option>
                  </select>
                  <ChevronDown size={14} className="select-arrow" />
                </div>
                {resolution === "4k" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10, fontSize: 12, color: "var(--color-warning)" }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>4K upscaling is CPU-intensive and may be slow.</span>
                  </div>
                )}
              </div>
              <div className="separator" />
              <div>
                <Label>Audio denoise</Label>
                <Hint>FFT-based noise reduction.</Hint>
                <div className="select-wrapper" style={{ marginTop: 12 }}>
                  <select className="select-control" value={denoise} onChange={(e) => setDenoise(e.target.value)}>
                    <option value="off">Off</option>
                    <option value="on">On</option>
                  </select>
                  <ChevronDown size={14} className="select-arrow" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button className="btn btn-primary btn-lg" onClick={handleProcess} style={{ width: "100%" }}>
        Process video
      </button>
    </div>
  )
}

/* ── Tiny helpers ─────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{children}</p>
}
function Hint({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{children}</p>
}
