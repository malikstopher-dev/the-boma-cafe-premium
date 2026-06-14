import { NextResponse } from 'next/server';
import { getAllSettings, getAnnouncement, getPopup, getEvents, getPromotions } from '@/lib/db';

export async function GET() {
  try {
    const allEvents = getEvents();
    const allPromotions = getPromotions();

    return NextResponse.json({
      settings: getAllSettings(),
      announcement: getAnnouncement(),
      popup: getPopup(),
      events: allEvents.filter((e: any) => e.visible !== false),
      promotions: allPromotions.filter((p: any) => p.isActive === true),
    });
  } catch (error) {
    console.error('Error reading public data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}
