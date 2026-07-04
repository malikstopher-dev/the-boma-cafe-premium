import { NextRequest, NextResponse } from 'next/server';
import { getCategories, saveCategory, deleteCategory, getMenuItems, saveMenuItem, deleteMenuItem } from '@/lib/cms-supabase';
import { requireAdminOrKitchen } from '@/lib/auth/requireRole';

export async function GET(request: NextRequest) {
  const authError = await requireAdminOrKitchen(request)
  if (authError) return authError

  try {
    const categories = await getCategories();
    const menuItems = await getMenuItems();
    return NextResponse.json({ categories, menuItems });
  } catch (error) {
    console.error("MENU API ERROR");
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to read menu",
        message:
          error instanceof Error
            ? error.message
            : String(error),
        stack:
          process.env.NODE_ENV !== "production"
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined
      },
      { status: 500 }
    );
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