import { EmailService } from '../email/email.service';
import { Injectable } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UploadProfilePictureJobDto } from './dtos/upload-profile-picture.job.dto';
import { UsersV1Service } from '../../models/users/services/users.v1.service';
import { SendEmailJobDto } from './dtos/send-email-job.dto';
import { UploadBlogImageJobDto } from './dtos/upload-blog-image-job.dto';
import { BlogsV1Service } from '../../models/blogs/services/blogs.v1.service';
import { DeleteProfilePictureJobDto } from './dtos/delete-profile-picture.job';

@Injectable()
export class QueueJobs{
    constructor(
        private readonly emailService: EmailService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly usersService: UsersV1Service,
        private readonly blogsService: BlogsV1Service
    ){}

    async sendEmail(data: SendEmailJobDto){        
        return await this.emailService.sendEmail(data.data);
    }

    async uploadProfilePicture(data: UploadProfilePictureJobDto){
        const user = await this.usersService.findOneOrFail({
            where: {
                id: data.data.user_id
            }
        });
        
        if(user.avatar_id){
            this.cloudinaryService.removeFile(user.avatar_id);
        }
        
        const res = await this.cloudinaryService.uploadFile(data.data.file, data.data.folder);
        
        await this.usersService.updateOne({
            where: {
                id: data.data.user_id,
            },
            data:{
                avatar: res.secure_url,
                avatar_id: res.public_id,
            }
        })

        return true;
    }

    async uploadBlogImage({ data }: UploadBlogImageJobDto){

        const blog = await this.blogsService.findOneOrFail({ where:{ id: data.blog_id } });

        if(!blog) return false;

        if(blog.image_id){
            this.cloudinaryService.removeFile(blog.image_id);
        }

        const res = await this.cloudinaryService.uploadFile(data.file, data.folder);
        
        await this.blogsService.updateOneBlog({
            data:{
                image_id: res.public_id,
                image_link: res.secure_url
            },
            where: {
                id: data.blog_id,
            }
        });

        return true;
    }

    async deleteProfilePicture({ data }: DeleteProfilePictureJobDto){
        try {
            await this.cloudinaryService.removeFile(data.file_id);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}