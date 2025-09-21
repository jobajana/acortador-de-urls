import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    
    if (!slug) {
      return new NextResponse(null, { status: 400, statusText: 'Bad Request: Slug is missing.' });
    }

    const link = await kv.hgetall(`link:${slug}`);
    
    if (!link || !link.originalUrl) {
       // Si no se encuentra el enlace, redirigir a la página principal
       const homeUrl = new URL('/', request.url);
       return NextResponse.redirect(homeUrl, 307);
    }
    
    // Incrementar el contador de clics de forma atómica
    await kv.hincrby(`link:${slug}`, 'clicks', 1);

    // Redirigir al usuario a la URL original
    return NextResponse.redirect(link.originalUrl, 301);

  } catch (error) {
    console.error(error);
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl, 307);
  }
}
