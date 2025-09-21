import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

function generateShortId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

export default async function handler(request) {
    // Manejar petición GET para listar todos los enlaces
    if (request.method === 'GET') {
        try {
            const linkIds = await kv.zrange('links_by_date', 0, -1, { rev: true });
            if (!linkIds || linkIds.length === 0) {
                return NextResponse.json({ links: [] });
            }
            const pipeline = kv.pipeline();
            linkIds.forEach(id => pipeline.hgetall(`link:${id}`));
            const links = await pipeline.exec();
            
            return NextResponse.json({ links });
        } catch (error) {
            console.error(error);
            return new NextResponse('Error al obtener los enlaces desde la base de datos.', { status: 500 });
        }
    }

    // Manejar petición POST para crear un nuevo enlace
    if (request.method === 'POST') {
        try {
            const { url } = await request.json();
            if (!url) {
                return new NextResponse('La URL es requerida.', { status: 400 });
            }

            let id;
            let exists = true;
            while(exists) {
                id = generateShortId();
                exists = await kv.exists(`link:${id}`);
            }

            const newLink = { id, originalUrl: url, clicks: 0, createdAt: Date.now() };
            
            await kv.hset(`link:${id}`, newLink);
            await kv.zadd('links_by_date', { score: newLink.createdAt, member: id });

            return NextResponse.json({ id: newLink.id });
        } catch (error) {
            console.error(error);
            return new NextResponse('Error al crear el enlace en la base de datos.', { status: 500 });
        }
    }

    return new NextResponse('Método no permitido.', { status: 405 });
}

