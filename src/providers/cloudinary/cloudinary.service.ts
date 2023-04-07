import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {

    constructor(private readonly config: ConfigService){
        cloudinary.config({
            cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'), 
            api_key: this.config.get('CLOUDINARY_API_KEY'), 
            api_secret: this.config.get('CLOUDINARY_API_SECRET'),
            secure: true
        });
    }
    
    async uploadFile(file: Express.Multer.File, folder: string){
        return await cloudinary.uploader.upload(file.path, {
            folder
        })
    }

    async removeFile(id: string){
        return await cloudinary.uploader.destroy(id);
    }
}
