import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  ValidationError,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationErrorException } from '../exceptions/validation-error.exception';

@Catch(ValidationErrorException)
export class ValidationErrorFilter implements ExceptionFilter {
  catch(exception: ValidationErrorException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    let message: string;
    let data: ValidationError[] | { message: string } = exception.getData();
    if (Array.isArray(data)) {
      let constraints = data[0].constraints;
      message = constraints[Object.keys(constraints)[0]];
    } else {
      message = data.message;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      error: exception.message
    });
  }
}
