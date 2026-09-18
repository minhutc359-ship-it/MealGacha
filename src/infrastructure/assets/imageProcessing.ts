export function convertImageToWebp(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)
    image.onload = () => {
      const size = 512
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext("2d")
      if (!context) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error("Canvas unavailable"))
        return
      }
      const sourceSize = Math.min(image.naturalWidth, image.naturalHeight)
      const sourceX = (image.naturalWidth - sourceSize) / 2
      const sourceY = (image.naturalHeight - sourceSize) / 2
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL("image/webp", 0.86))
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Image load failed"))
    }
    image.src = objectUrl
  })
}
