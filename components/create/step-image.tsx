"use client"

import { useRef, useCallback } from "react"
import { Upload, X, ImageIcon } from "lucide-react"

interface StepImageProps {
  image: string | null
  setImage: (v: string | null) => void
}

export function StepImage({ image, setImage }: StepImageProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    },
    [setImage]
  )

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-medium text-foreground mb-1">Recipe Image</h2>
        <p className="text-xs text-muted-foreground">
          Upload a photo of your dish. This is optional.
        </p>
      </div>

      {image ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img
            src={image}
            alt="Recipe preview"
            className="w-full aspect-[4/3] object-cover"
          />
          <button
            onClick={() => setImage(null)}
            className="absolute top-3 right-3 p-2 rounded-full bg-foreground/70 text-background hover:bg-foreground/90 transition-colors"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="w-full aspect-[4/3] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary/70 transition-colors cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-7 w-7" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Click to upload</p>
            <p className="text-xs mt-0.5">or drag and drop</p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload recipe image"
      />
    </div>
  )
}
