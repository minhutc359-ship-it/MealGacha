import { Capacitor } from "@capacitor/core"
/** Native exports use content URIs; web exports retain the download path. */
export async function saveFile(blob: Blob, name: string) {
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory }, { Share }, { blobBase64 }] =
      await Promise.all([
        import("@capacitor/filesystem"),
        import("@capacitor/share"),
        import("../native/photos"),
      ])
    const safe = name.replace(/[^a-zA-Z0-9_.-]/g, "-")
    const { uri } = await Filesystem.writeFile({
      directory: Directory.Cache,
      path: `exports/${safe}`,
      data: await blobBase64(blob),
      recursive: true,
    })
    await Share.share({
      title: "Soul of Meal",
      files: [uri],
      dialogTitle: "Lưu hoặc chia sẻ tệp",
    })
    return
  }
  const url = URL.createObjectURL(blob),
    link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
