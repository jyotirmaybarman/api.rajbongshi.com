import { HttpException, HttpStatus, ValidationError } from "@nestjs/common";

export class ValidationErrorException extends HttpException {
  data: ValidationError[] | { message: string };
  constructor(data: ValidationError[] | { message: string, error?: string, statusCode?: number } = { message: 'validation failed' }) {
    if(Array.isArray(data)){
      super('ValidationError', HttpStatus.BAD_REQUEST);
    }else{
      super(data.error ? data.error : 'ValidationError', data.statusCode ? data.statusCode : HttpStatus.BAD_REQUEST);
    }
    this.data = data
  }
  getData(){
    return this.data;
  }
}