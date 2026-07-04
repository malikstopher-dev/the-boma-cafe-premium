import { NextRequest, NextResponse } from 'next/server';
import { getCategories, saveCategory, deleteCategory, getMenuItems, saveMenuItem, deleteMenuItem } from '@/lib/cms-supabase';
import { requireAdminOrKitchen } from '@/lib/auth/requireRole';
import { getAdminClient } from '@/lib/supabase';
import { defaultCategories, defaultMenuItems } from '@/data/defaultData';
import { randomUUID } from 'crypto';

async function seedDefaultData() {
  const client = await getAdminClient()
  const now = new Date().toISOString()

  const { count: catCount } = await client.from('menu_categories').select('id', { count: 'exact', head: true })
  if (catCount && catCount > 0) return // already seeded

  // Insert categories with generated UUIDs
  const catIds: Record<string, string> = {}
  for (const cat of defaultCategories) {
    const id = randomUUID()
    catIds[cat.name] = id
    await client.from('menu_categories').insert({
      id,
      name: cat.name,
      description: cat.description || '',
      order_index: cat.order || 0,
      is_active: cat.isActive !== false,
      created_at: now,
      updated_at: now,
    })
  }

  // Insert menu items
  for (const item of defaultMenuItems) {
    const categoryId = catIds[item.category] || ''
    if (!categoryId) continue
    await client.from('menu_items').insert({
      id: crypto.randomUUID(),
      category_id: categoryId,
      name: item.name,
      description: item.description || '',
      price: String(item.price ?? ''),
      image: item.image || '',
      sizes: item.variants ? JSON.stringify(item.variants.map((v: any) => ({ name: v.name, price: String(v.price) }))) : null,
      add_ons: item.addOns ? JSON.stringify(item.addOns.map((a: any) => ({ name: a.name, price: String(a.price) }))) : null,
      is_available: !item.isOutOfStock,
      is_featured: item.isFeatured || false,
      is_on_promo: item.isOnPromo || false,
      promo_badge: item.promoBadge || '',
      order_index: item.order || 0,
      created_at: now,
      updated_at: now,
    })
  }
}

export async function GET(request: NextRequest) {
  const authError = await requireAdminOrKitchen(request)
  if (authError) return authError

  try {
    await seedDefaultData()
    const categories = await getCategories();
    const menuItems = await getMenuItems();
    return NextResponse.json({ categories, menuItems });
  } catch (error: any) {
    console.error('Error reading menu:', error?.message || error, error?.stack || '');
    return NextResponse.json({
      error: 'Failed to read menu',
      detail: error?.message || String(error),
      ...(error?.code && { code: error.code }),
      ...(error?.details && { supabaseDetails: error.details }),
      ...(error?.hint && { hint: error.hint }),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminOrKitchen(request)
  if (authError) return authError

  try {
    const body = await request.json();
    
    if (body.id && body.name !== undefined) {
      const category = await saveCategory(body);
      return NextResponse.json({ success: true, data: category });
    }
    
    if (body.categoryId !== undefined) {
      const item = await saveMenuItem(body);
      return NextResponse.json({ success: true, data: item });
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error saving menu:', error);
    return NextResponse.json({ error: 'Failed to save menu' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdminOrKitchen(request)
  if (authError) return authError

  try {
    const body = await request.json();
    
    if (body.categoryId || (body.id && body.name !== undefined)) {
      const category = await saveCategory(body);
      return NextResponse.json({ success: true, data: category });
    }
    
    const item = await saveMenuItem(body);
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error saving menu:', error);
    return NextResponse.json({ error: 'Failed to save menu' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdminOrKitchen(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const itemId = searchParams.get('itemId');
    
    if (id) {
      await deleteCategory(id);
      return NextResponse.json({ success: true });
    }
    
    if (itemId) {
      await deleteMenuItem(itemId);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}