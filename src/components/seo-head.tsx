import { Helmet } from "react-helmet-async"

const SITE_URL = "https://vid-tools.vercel.app"

/**
 * FAQ items — rendered as both visible HTML and JSON-LD structured data
 */
export const faqItems = [
  {
    q: "Is VidTools really free?",
    a: "Yes, VidTools is completely free with no hidden costs, no sign-ups, and no watermarks.",
  },
  {
    q: "Are my files uploaded to a server?",
    a: "No. All processing happens directly in your browser using FFmpeg WebAssembly. Your files never leave your device.",
  },
  {
    q: "What video formats are supported?",
    a: "VidTools accepts virtually any video format as input — over 1000 formats are supported thanks to FFmpeg. For output, you can choose from MP4, WebM, MKV, MOV, AVI, FLV, OGV, MPEG-TS, and GIF. You can also extract audio to MP3, WAV, AAC, or OGG.",
  },
  {
    q: "Can I upscale a video to 4K?",
    a: "Yes. VidTools can upscale videos to 1080p or 4K using Lanczos interpolation. Note that 4K upscaling is CPU-intensive and may take time in the browser.",
  },
  {
    q: "How does audio noise removal work?",
    a: "VidTools uses FFmpeg's FFT-based denoising filter (afftdn) to reduce background noise from audio tracks.",
  },
  {
    q: "What browsers are supported?",
    a: "VidTools works in modern browsers that support WebAssembly, including Chrome, Firefox, Edge, and Safari.",
  },
]

/**
 * SEO Head — manages all meta tags, structured data,
 * and Open Graph tags via react-helmet-async.
 */
export default function SEOHead() {
  const title = "VidTools — Free Online Video Compressor, Converter & Enhancer"
  const description =
    "Compress, convert, upscale to 4K, and remove audio noise from videos — supports 1000+ input formats. 100% free, 100% private. All processing happens in your browser. No uploads, no servers."

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  }

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to compress a video online for free",
    description:
      "Use VidTools to compress any video file directly in your browser without uploading it to a server.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Open VidTools",
        text: "Go to vid-tools.vercel.app in your browser. The FFmpeg engine will load automatically.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Upload your video",
        text: "Drag and drop a video file onto the dropzone, or click to browse and select a file.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Adjust settings",
        text: "Use the Optimize tab to set compression level (CRF). Use the Format tab to choose an output format. Use the Enhance tab for upscaling or audio denoising.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Process and download",
        text: "Click 'Process video' and wait for it to complete. Then click 'Download' to save the result.",
      },
    ],
    tool: {
      "@type": "HowToTool",
      name: "A modern web browser (Chrome, Firefox, Edge, or Safari)",
    },
    totalTime: "PT2M",
  }

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "VidTools",
    url: SITE_URL,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (runs in browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: undefined, // Add later when you have ratings
    description,
  }

  return (
    <Helmet>
      {/* Primary */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="keywords"
        content="video compressor, video converter, compress video online, convert mp4, webm converter, mkv to mp4, video to gif, free video compressor, upscale video 4k, remove audio noise, ffmpeg online, browser video editor, client-side video processing, no upload video tool, video to mp3"
      />
      <link rel="canonical" href={SITE_URL} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={SITE_URL} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="VidTools" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* Structured Data */}
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(softwareSchema)}</script>
    </Helmet>
  )
}
