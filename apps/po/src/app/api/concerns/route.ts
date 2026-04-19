import { getConcerns, getConcernPhotos } from '@hyliren/shared/src/server/data-store';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const concerns = getConcerns()
      .filter(c => c.status !== 'draft' && c.status !== 'cancelled' && !c.deletedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const photos = getConcernPhotos();
    return NextResponse.json({ concerns, photos });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load concerns' }, { status: 500 });
  }
}
