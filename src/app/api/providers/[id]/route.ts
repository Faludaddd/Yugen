/**
 * DELETE /api/providers/[id]
 *   Delete a provider. Only non-preset providers can be deleted.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const provider = await db.provider.findUnique({ where: { id } });
  if (!provider) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (provider.isPreset) {
    return NextResponse.json(
      { error: 'Cannot delete a preset provider — disable it instead' },
      { status: 400 }
    );
  }

  await db.provider.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
