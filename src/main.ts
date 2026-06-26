import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api', {
    exclude: ['health', '/', 'assets/(.*)'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number.parseInt(process.env.PORT || '4860', 10);
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((error) => {
  console.error('[domain-research] bootstrap failed', error);
  process.exit(1);
});
