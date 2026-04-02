import VideoEditor from "@/components/video-editor"
import SEOHead, { faqItems } from "@/components/seo-head"
import { Toaster } from "@/components/toast"

function App() {
  return (
    <>
      <SEOHead />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header
          role="banner"
          style={{
            borderBottom: "1px solid var(--color-border)",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <nav aria-label="Main navigation" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.5px" }}>
                VidTools
              </span>
            </a>
            <span style={{ fontSize: 11, color: "var(--color-text-muted)", padding: "1px 6px", border: "1px solid var(--color-border)", borderRadius: 4 }}>
              beta
            </span>
          </nav>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            100% client-side processing
          </span>
        </header>

        {/* Main Content */}
        <main role="main" style={{ flex: 1, display: "flex", justifyContent: "center", padding: "48px 24px" }}>
          <article style={{ width: "100%", maxWidth: 560 }}>
            <VideoEditor />

            {/* Features Section — indexable content */}
            <section aria-label="Features" style={{ marginTop: 64, borderTop: "1px solid var(--color-border)", paddingTop: 32 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                Free online video processing
              </h2>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
                VidTools lets you compress, convert, upscale, and denoise videos without uploading anything.
                Everything runs locally in your browser using FFmpeg WebAssembly — your files never leave your device.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { title: "Any input format", desc: "Accepts virtually any video format — 1000+ formats supported via FFmpeg." },
                  { title: "Convert formats", desc: "MP4, WebM, MKV, MOV, AVI, FLV, OGV, MPEG-TS, GIF." },
                  { title: "Upscale resolution", desc: "Scale up to 1080p or 4K using Lanczos interpolation." },
                  { title: "Remove audio noise", desc: "Clean up audio with FFT-based denoising." },
                  { title: "Extract audio", desc: "Export audio tracks as MP3, WAV, AAC, or OGG." },
                  { title: "100% private", desc: "No uploads, no servers, no data collection." },
                ].map((f) => (
                  <div key={f.title}>
                    <h3 style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{f.title}</h3>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ Section — matches JSON-LD FAQPage schema */}
            <section aria-label="Frequently Asked Questions" style={{ marginTop: 40, borderTop: "1px solid var(--color-border)", paddingTop: 32 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                Frequently asked questions
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {faqItems.map((item) => (
                  <details
                    key={item.q}
                    style={{
                      background: "var(--color-bg-secondary)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "12px 16px",
                    }}
                  >
                    <summary
                      style={{
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}
                    >
                      {item.q}
                      <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>+</span>
                    </summary>
                    <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.7, marginTop: 10 }}>
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          </article>
        </main>

        {/* Footer */}
        <footer
          role="contentinfo"
          style={{
            borderTop: "1px solid var(--color-border)",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--color-text-muted)",
          }}
        >
          <span>Powered by FFmpeg WebAssembly</span>
          <span>No data leaves your device</span>
        </footer>
      </div>
      <Toaster />
    </>
  )
}

export default App
