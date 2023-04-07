import { IsEmail, IsString } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail({}, { message: 'invalid email address' })
  @IsString({ message: 'invalid email address' })
  email: string;
}
