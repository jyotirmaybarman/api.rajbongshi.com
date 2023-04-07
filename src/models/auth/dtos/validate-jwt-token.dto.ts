import { IsString, Matches } from 'class-validator';

export class ValidateJwtTokenDto {
  @IsString({ message: 'invalid token' })
  @Matches(/^(?:[\w-]*\.){2}[\w-]*$/, { message: 'invalid token' })
  token: string;
}
