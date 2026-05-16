import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3001);

  // ── Security ───────────────────────────────────────────────
  app.use(helmet({ crossOriginEmbedderPolicy: false }));
  app.use(compression());

  // ── CORS ──────────────────────────────────────────────────
  app.enableCors({
    origin: [
      config.get('FRONTEND_URL', 'http://localhost:5173'),
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug'],
  });

  // ── API Versioning ─────────────────────────────────────────
  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('api');

  // ── Global Pipes ──────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global Filters & Interceptors ─────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ── Swagger ───────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ERP Gest API')
    .setDescription('Multi-tenant ERP — NestJS + MariaDB')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Tenant-Slug' }, 'TenantSlug')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  console.log(`\n🚀 ERP Gest API running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs:            http://localhost:${port}/api/docs\n`);
}

bootstrap();
