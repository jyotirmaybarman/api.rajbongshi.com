import { Exclude } from 'class-transformer';
import { IsString, IsEmail, Matches, IsOptional, IsNotEmpty } from 'class-validator';
import { SameAs } from '../../../common/decorators/same-as.decorator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/[a-z]/, { message: 'password must consist an lowercase' })
  @Matches(/[A-Z]/, { message: 'password must consist an uppercase' })
  @Matches(/[0-9]/, { message: 'password must consist a digit' })
  @Matches(/.{8,}/, { message: 'password must be atleast 8 chars long' })
  @Matches(/\W|_/, { message: 'password must consist a special character' })
  password: string;

  @SameAs<RegisterDto>('password')
  @Exclude({ toPlainOnly: true })
  password_confirmation: string;

  @IsString()
  @IsOptional()
  bio?: string;
}
