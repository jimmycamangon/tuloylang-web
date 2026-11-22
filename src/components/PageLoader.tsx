/**
 * Shown while a page's code chunk loads. Usually only visible for a moment on the very
 * first open; after that pages are preloaded or cached by the service worker.
 */
export default function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center ${fullScreen ? 'min-h-screen bg-background' : 'min-h-[40vh]'}`}
    >
      <span
        className="h-8 w-8 animate-spin rounded-full border-[3px] border-muted border-t-foreground motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
