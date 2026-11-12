import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Coffee Shop POS & Management API')
    .setDescription(
      'Hệ thống Backend quản lý quán cà phê toàn diện bằng NestJS + Prisma ORM (SQLite / PostgreSQL)',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Coffee Shop API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`☕ Coffee Shop Backend running on: http://localhost:${port}`);
  console.log(`📄 Swagger API Docs: http://localhost:${port}/docs`);
}
bootstrap();

