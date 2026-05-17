import { S3Client } from '@aws-sdk/client-s3'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET = process.env.R2_BUCKET!
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!

const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'

export function imageKey(userId: string, recipeId: string): string {
  return `${env}/${userId}/${recipeId}.webp`
}

export function publicImageUrl(userId: string, recipeId: string): string {
  return `${R2_PUBLIC_URL}/${imageKey(userId, recipeId)}`
}

export function avatarKey(userId: string): string {
  return `${env}/${userId}/avatar.webp`
}

export function publicAvatarUrl(userId: string): string {
  return `${R2_PUBLIC_URL}/${avatarKey(userId)}`
}
