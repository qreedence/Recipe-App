import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@/lib/supabase/server'
import { r2, R2_BUCKET, avatarKey, publicAvatarUrl } from '@/lib/r2'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = avatarKey(user.id)

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'image/webp',
    }),
  )

  const url = publicAvatarUrl(user.id)

  await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('user_id', user.id)

  return NextResponse.json({ url })
}
