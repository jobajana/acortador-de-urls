import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    // Manejar petición GET para listar todos los enlaces
    if (request.method === 'GET') {
        try {
            const linkIds = await kv.zrange('links_by_date', 0, -1, { rev: true });
            if (!linkIds || linkIds.length === 0) {
                return response.status(200).json({ links: [] });
            }
            const pipeline = kv.pipeline();
            linkIds.forEach(id => pipeline.hgetall(`link:${id}`));
            const links = await pipeline.exec();
            
            return response.status(200).json({ links });
        } catch (error) {
            console.error(error);
            return response.status(500).json({ error: 'Error al obtener los enlaces.' });
        }
    }

    // Manejar petición POST para crear un nuevo enlace
    if (request.method === 'POST') {
        const { url } = request.body;
        if (!url) {
            return response.status(400).json({ error: 'La URL es requerida.' });
        }
        try {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let id;
            let exists = true;
            // Asegurarse de que el ID es único
            while(exists) {
                id = '';
                for (let i = 0; i < 5; i++) {
                    id += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                exists = await kv.exists(`link:${id}`);
            }

            const newLink = { id, originalUrl: url, clicks: 0, createdAt: Date.now() };
            
            await kv.hset(`link:${id}`, newLink);
            // Guardar en un set ordenado por fecha para fácil recuperación
            await kv.zadd('links_by_date', { score: newLink.createdAt, member: id });

            return response.status(200).json({ id: newLink.id });
        } catch (error) {
            console.error(error);
            return response.status(500).json({ error: 'Error al crear el enlace.' });
        }
    }

    // Si el método no es GET o POST
    return response.status(405).json({ error: 'Método no permitido.' });
}

