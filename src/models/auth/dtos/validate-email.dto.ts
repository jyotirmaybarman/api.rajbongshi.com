import { IsEmail } from "class-validator";

export class ValidateEmailDto{
    
    @IsEmail()
    email: string;
}