import { IsString, IsEmail, Matches, IsNotEmpty, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsEmail({},{ message: "invalid username or password" })
  @IsNotEmpty({ message: "invalid username or password" })
  email: string;

  @IsBoolean()
  remember: boolean = false;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, { message: 'invalid username or password' })
  password: string;
}
