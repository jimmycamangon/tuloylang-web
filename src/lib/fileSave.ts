/**
 * Saves files the way that suits the device: phones get the share sheet (Files, Google
 * Drive, Messenger…), desktops get ordinary downloads.
 */

export type SaveResult = 'shared' | 'downloaded' | 'cancelled'

export function localDateStamp(now = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoke later: revoking synchronously can cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

function shouldUseShareSheet(files: File[]) {
  return (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files }) &&
    window.matchMedia('(pointer: coarse)').matches
  )
}

export async function saveFiles(
  files: File[],
  share: { title: string; text: string },
): Promise<SaveResult> {
  if (shouldUseShareSheet(files)) {
    try {
      await navigator.share({ files, ...share })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      // Share failed for another reason (e.g. no share target): fall back to downloads.
    }
  }

  files.forEach((file, index) => {
    // Small gap between files so browsers don't drop the second download.
    window.setTimeout(() => downloadFile(file), index * 300)
  })
  return 'downloaded'
}
