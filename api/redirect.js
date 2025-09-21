import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    
    if (!slug) {
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl, 307);
    }

    const link = await kv.hgetall(`link:${slug}`);
    
    if (!link || !link.originalUrl) {
       const homeUrl = new URL('/', request.url);
       return NextResponse.redirect(homeUrl, 307);
    }
    
    await kv.hincrby(`link:${slug}`, 'clicks', 1);

    return NextResponse.redirect(link.originalUrl, 301);

  } catch (error) {
    console.error(error);
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl, 307);
  }
}
