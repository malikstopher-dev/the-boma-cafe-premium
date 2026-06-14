import { NextResponse } from 'next/server';
import { getCategories, getMenuItems } from '@/lib/db';

export async function GET() {
  try {
    const allCategories = getCategories();
    const allItems = getMenuItems();

    const categories = allCategories.filter((c: any) => c.isActive);
    const menuItems = allItems.filter((m: any) => m.isAvailable);

    return NextResponse.json({ categories, menuItems });
  } catch (error) {
    console.error('Error reading public menu:', error);
    return NextResponse.json({ error: 'Failed to read menu' }, { status: 500 });
  }
}
