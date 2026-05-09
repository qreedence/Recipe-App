import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { recipeId } = await request.json()
  if (!recipeId) {
    return NextResponse.json({ error: 'Missing recipeId' }, { status: 400 })
  }

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .eq('user_id', user.id)
    .single()

  if (recipeError || !recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
  }

  const { user_id, updated_at, ...snapshot } = recipe

  const { data: existing } = await supabase
    .from('shared_recipes')
    .select('id')
    .eq('owner_id', user.id)
    .eq('recipe_id', recipeId)
    .single()

  if (existing) {
    await supabase
      .from('shared_recipes')
      .update({ recipe_snapshot: snapshot })
      .eq('id', existing.id)

    return NextResponse.json({ shareId: existing.id })
  }

  const { data: share, error: shareError } = await supabase
    .from('shared_recipes')
    .insert({ owner_id: user.id, recipe_id: recipeId, recipe_snapshot: snapshot })
    .select('id')
    .single()

  if (shareError || !share) {
    return NextResponse.json({ error: 'Failed to create share' }, { status: 500 })
  }

  return NextResponse.json({ shareId: share.id })
}
