import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  try {
    const { slug } = request.query;

    if (!slug) {
      return response.redirect(307, '/');
    }

    const link = await kv.hgetall(`link:${slug}`);
    
    if (!link || !link.originalUrl) {
       return response.redirect(307, '/');
    }
    
    await kv.hincrby(`link:${slug}`, 'clicks', 1);

    return response.redirect(301, link.originalUrl);

  } catch (error) {
    console.error(error);
    return response.redirect(307, '/');
  }
}
