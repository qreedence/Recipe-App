export async function uploadImage(
  base64: string,
  recipeId: string,
): Promise<string> {
  const res = await fetch(base64)
  const blob = await res.blob()

  const formData = new FormData()
  formData.append('file', blob, `${recipeId}.webp`)
  formData.append('recipeId', recipeId)

  const response = await fetch('/api/images/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Image upload failed')
  }

  const { url } = await response.json()
  return url
}

export function isBase64Image(src: string | null): boolean {
  return !!src && src.startsWith('data:')
}
