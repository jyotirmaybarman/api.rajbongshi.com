import { ValidationError, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { ValidationErrorException } from './common/exceptions/validation-error.exception';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        return new ValidationErrorException(errors);
      },

    }),
  );
  app.use(cookieParser());

  const configService: ConfigService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('CORS_DOMAINS').split(","),
    credentials: true,
  })
  

  await app.listen(3000);
}
bootstrap();
