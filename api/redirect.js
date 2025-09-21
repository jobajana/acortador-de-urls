import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  try {
    // Obtenemos el ID corto de la URL (ej: /abcde)
    const { slug } = request.query;

    if (!slug) {
      // Si no hay slug, redirigimos a la página principal
      return response.redirect(307, '/');
    }

    // Buscamos el enlace en la base de datos
    const link = await kv.hgetall(`link:${slug}`);

    // Si no se encuentra, redirigimos a la página principal
    if (!link || !link.originalUrl) {
       return response.redirect(307, '/');
    }
    
    // Incrementamos el contador de clics
    await kv.hincrby(`link:${slug}`, 'clicks', 1);

    // Redirigimos al usuario a la URL original
    return response.redirect(301, link.originalUrl);

  } catch (error) {
    console.error(error);
    // Si algo falla, también redirigimos a la página principal
    return response.redirect(307, '/');
  }
}
