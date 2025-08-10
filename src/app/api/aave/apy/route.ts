import { NextResponse } from 'next/server';
import { getValidatedEnv } from '@/config/env';
import { MARKETS } from '@/config/markets';
import { getAllMarketsApy } from '@/data/aave/queries';

export const revalidate = 0;

export async function GET() {
  try {
    const env = getValidatedEnv();
    const data = await getAllMarketsApy(env, MARKETS);
    return NextResponse.json({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
