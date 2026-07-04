import { NextRequest, NextResponse } from 'next/server';
import { getCategories, saveCategory, deleteCategory, getMenuItems, saveMenuItem, deleteMenuItem } from '@/lib/cms-supabase';
import { requireAdminOrKitchen } from '@/lib/auth/requireRole';

export async function GET(request: NextRequest) {
  console.log("GET /api/cms/menu called")
  const authError = await requireAdminOrKitchen(request)
  console.log("authError:", authError)
  if (authError) return authError

  console.log("about to call getCategories()")
  const categories = await getCategories();
  console.log("getCategories() returned, count:", categories?.length)

  console.log("about to call getMenuItems()")
  const menuItems = await getMenuItems();
  console.log("getMenuItems() returned, count:", menuItems?.length)

  return NextResponse.json({ categories, menuItems });
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