import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@/lib/supabase/server'
import { r2, R2_BUCKET, imageKey, publicImageUrl } from '@/lib/r2'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const recipeId = formData.get('recipeId') as string | null

  if (!file || !recipeId) {
    return NextResponse.json({ error: 'Missing file or recipeId' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = imageKey(user.id, recipeId)

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'image/webp',
    }),
  )

  const url = publicImageUrl(user.id, recipeId)
  return NextResponse.json({ url })
}
