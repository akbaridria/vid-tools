import { useState, useCallback, useEffect } from "react"
import { CheckCircle, XCircle, X } from "lucide-react"

type ToastType = "success" | "error"
interface Toast {
  id: number
  message: string
  type: ToastType
}

let addToastFn: ((message: string, type: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = "success") {
  addToastFn?.(message, type)
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  const remove = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type === "success" ? "toast-success" : "toast-error"}`}>
          {t.type === "success" ? (
            <CheckCircle size={16} style={{ color: "var(--color-success)", flexShrink: 0 }} />
          ) : (
            <XCircle size={16} style={{ color: "var(--color-danger)", flexShrink: 0 }} />
          )}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            style={{
              background: "none", border: "none", color: "var(--color-text-muted)",
              cursor: "pointer", padding: "2px", display: "flex", flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
