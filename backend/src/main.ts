import dns from 'node:dns';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

// Solo para mi PC: arreglo del DNS local
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

async function crearApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: [process.env.FRONTEND_URL ?? '', 'http://localhost:4200'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  if (!process.env.VERCEL) {
    app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  }
  return app;
}

// En Vercel: se exporta una función que atiende cada petición
let servidor: Promise<(req: IncomingMessage, res: ServerResponse) => void> | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  servidor ??= crearApp().then(async (app) => {
    await app.init();
    return app.getHttpAdapter().getInstance();
  });
  const atender = await servidor;
  return atender(req, res);
}

// En mi PC: arranque normal con listen
if (!process.env.VERCEL) {
  crearApp().then((app) => app.listen(process.env.PORT ?? 3000));
}