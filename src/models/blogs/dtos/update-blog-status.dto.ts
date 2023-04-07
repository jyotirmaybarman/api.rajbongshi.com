import { BlogStaus } from "@prisma/client";
import { IsIn, IsString } from "class-validator";

export class UpdateBlogStatusDto {
    @IsString()
    @IsIn(['draft', 'published', 'unpublished'])
    status: BlogStaus;
}