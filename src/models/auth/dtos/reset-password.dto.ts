import { Exclude } from "class-transformer";
import { IsNotEmpty, IsString, Matches } from "class-validator";
import { SameAs } from "src/common/decorators/same-as.decorator";
import { ValidateJwtTokenDto } from './validate-jwt-token.dto';

export class ResetPasswordDto extends ValidateJwtTokenDto{
    @IsString()
    @IsNotEmpty()
    @Matches(/[a-z]/, { message: 'password must consist an lowercase' })
    @Matches(/[A-Z]/, { message: 'password must consist an uppercase' })
    @Matches(/[0-9]/, { message: 'password must consist a digit' })
    @Matches(/.{8,}/, { message: 'password must be atleast 8 chars long' })
    @Matches(/\W|_/, { message: 'password must consist a special character' })
    password: string;

    @SameAs<ResetPasswordDto>('password')
    @Exclude({ toPlainOnly: true })
    password_confirmation: string;
}