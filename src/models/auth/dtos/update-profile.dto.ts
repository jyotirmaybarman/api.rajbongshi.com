import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    first_name?: string;
    
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    last_name?: string;
    
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    email?: string;
    
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    bio?: string;
}
