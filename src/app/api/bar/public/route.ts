import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { getBarCategories, getBarItems } from '@/lib/cms-supabase';

export async function GET() {
  try {
    const [categories, items] = await Promise.all([getBarCategories(), getBarItems()]);

    // Diagnostic: raw query
    const client = getAdminClient();
    const raw = await client.from('bar_categories').select('count', { count: 'exact', head: true });

    const activeCategories = categories.filter((c: any) => c.isActive);
    const availableItems = items.filter((i: any) => i.isAvailable);
    return NextResponse.json({
      categories: activeCategories,
      items: availableItems,
      _debug: {
        categoriesReturned: categories.length,
        itemsReturned: items.length,
        rawCount: raw.count,
        rawError: raw.error,
      }
    });
  } catch (error) {
    console.error('Error reading public bar menu:', error);
    return NextResponse.json({ error: 'Failed to read bar menu', detail: String(error) }, { status: 500 });
  }
}
