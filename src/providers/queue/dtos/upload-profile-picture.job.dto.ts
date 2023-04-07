import { BaseJobDto } from './base-job.dto';

export class UploadProfilePictureJobDto extends BaseJobDto {
    task: "uploadProfilePicture";
    data:{
        file: Express.Multer.File;
        folder: string;
        user_id: string;
    }
}