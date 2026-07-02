import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/backend/config/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 min cache

export async function GET() {
  try {
    const db = getFirebaseAdmin();
    const snap = await db.collection('uploads').where('status', '==', 'active').get();

    let totalDownloads = 0;
    const paperCounts: Record<string, number> = {};
    snap.docs.forEach((d) => {
      totalDownloads += d.data().downloadCount || 0;
      const code = d.data().subjectCode;
      if (code) {
        paperCounts[code] = (paperCounts[code] || 0) + 1;
      }
    });

    return NextResponse.json({
      totalPapers: snap.size,
      totalDownloads,
      totalSubjects: Object.keys(paperCounts).length,
      paperCounts,
    });
  } catch (err) {
    console.error('[stats]', err);
    return NextResponse.json({ totalPapers: 0, totalDownloads: 0, totalSubjects: 0 });
  }
}
