import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { config } from 'dotenv';

// Load environment variables
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global API prefix
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('UniSense API')
    .setDescription('UniSense University Management System API Documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('students', 'Student information system')
    .addTag('courses', 'Course management')
    .addTag('grades', 'Grading and GPA calculation')
    .addTag('fees', 'Fee management and invoicing')
    .addTag('announcements', 'Announcements and notifications')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`UniSense Backend running on port ${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api`);
}

bootstrap();
