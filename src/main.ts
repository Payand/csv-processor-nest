import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    
    app.use((req: any, res: { setHeader: (arg0: string, arg1: string) => void; }, next: () => void) => {
      res.setHeader('Content-Type', 'application/json');
      next();
    });

    app.setGlobalPrefix('api/v1');
    const config = new DocumentBuilder()
      .setTitle('CSV Processing API')
      .setDescription('API for processing CSV files with multiple methods including RabbitMQ integration')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      customJs: '/swagger-custom.js',
    });

    app.connectMicroservice({
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('rabbitmq.url')],
        queue: 'queue1',
        queueOptions: {
          durable: true,
        },
        persistent: true,
      },
    });

    await app.startAllMicroservices();

    const port = configService.get('app.port');
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`Swagger documentation is available at: http://localhost:${port}/api`);
  } catch (error) {
    logger.error('Error starting the application:', error);
    process.exit(1);
  }
}
bootstrap();
