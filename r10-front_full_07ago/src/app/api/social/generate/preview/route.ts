import { NextRequest, NextResponse } from 'next/server';
import { generateFeedBuffer } from '@/lib/social/generateFeed';

export async function POST(req: NextRequest) {
  try {
    const { title, hat, imageUrl } = await req.json();
    const buf = await generateFeedBuffer({
      title,
      hat,
      imageUrl: imageUrl || 'https://picsum.photos/1080/1350',
      overlayUrl: '/templates/r10/overlay.png',
    });
    const preview = `data:image/png;base64,${buf.toString('base64')}`;
    return NextResponse.json({ ok: true, preview });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Erro ao gerar preview' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 