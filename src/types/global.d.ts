declare global {
  interface Window {
    IdExtractionQR?: {
      initModel(env?: string, baseURL?: string): Promise<unknown>
      checkImageSide(image: CanvasImageSource): Promise<string>
      detectQR(image: CanvasImageSource): Promise<string>
    }
  }
}

export {}
