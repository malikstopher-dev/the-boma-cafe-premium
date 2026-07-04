import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCategories, saveCategory, deleteCategory, getMenuItems, saveMenuItem, deleteMenuItem } from '@/lib/cms-supabase';
import { requireAdminOrKitchen } from '@/lib/auth/requireRole';

export async function GET(request: NextRequest) {
  const authError = await requireAdminOrKitchen(request)
  if (authError) return authError

  let categories: any[] | null = null;
  let items: any[] | null = null;
  const errors: Record<string, any> = {};

  try {
    console.log("GET /api/cms/menu — calling getCategories()");
    categories = await getCategories();
    console.log("GET /api/cms/menu — getCategories() returned, count:", categories?.length);
  } catch (error: any) {
    console.error("GET /api/cms/menu — categories error");
    console.error("error.message:", error?.message);
    console.error("error.code:", error?.code);
    console.error("error.details:", error?.details);
    console.error("error.hint:", error?.hint);
    console.error("error.stack:", error?.stack);
    errors.categories = {
      message: error?.message || String(error),
      code: error?.code || null,
      details: error?.details || null,
      hint: error?.hint || null,
    };
  }

  try {
    console.log("GET /api/cms/menu — calling getMenuItems()");
    items = await getMenuItems();
    console.log("GET /api/cms/menu — getMenuItems() returned, count:", items?.length);
  } catch (error: any) {
    console.error("GET /api/cms/menu — items error");
    console.error("error.message:", error?.message);
    console.error("error.code:", error?.code);
    console.error("error.details:", error?.details);
    console.error("error.hint:", error?.hint);
    console.error("error.stack:", error?.stack);
    errors.items = {
      message: error?.message || String(error),
      code: error?.code || null,
      details: error?.details || null,
      hint: error?.hint || null,
    };
  }

  if (Object.keys(errors).length > 0) {
    console.log("GET /api/cms/menu — partial or complete failure, returning errors:", JSON.stringify(errors, null, 2));
    return NextResponse.json(
      {
        error: "Failed to read menu",
        errors,
        categories: categories || [],
        items: items || [],
        categoriesCount: categories?.length || 0,
        itemsCount: items?.length || 0,
      },
      { status: 200 }
    );
  }

  console.log("GET /api/cms/menu — returning success, categories:", categories.length, "items:", items.length);
  return NextResponse.json({ categories, menuItems: items });
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminOrKitchen(request)
  if (authError) return authError

  try {
    const body = await request.json();
    
    if (body.id && body.name !== undefined) {
      const category = await saveCategory(body);
      revalidatePath('/menu');
      return NextResponse.json({ success: true, data: category });
    }
    
    if (body.categoryId !== undefined) {
      const item = await saveMenuItem(body);
      revalidatePath('/menu');
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
      revalidatePath('/menu');
      return NextResponse.json({ success: true, data: category });
    }
    
    const item = await saveMenuItem(body);
    revalidatePath('/menu');
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
      revalidatePath('/menu');
      return NextResponse.json({ success: true });
    }
    
    if (itemId) {
      await deleteMenuItem(itemId);
      revalidatePath('/menu');
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}