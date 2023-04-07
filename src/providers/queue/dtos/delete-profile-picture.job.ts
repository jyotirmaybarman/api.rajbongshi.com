import { BaseJobDto } from './base-job.dto';

export class DeleteProfilePictureJobDto extends BaseJobDto{
    task: "deleteProfilePicture";
    data:{
        file_id: string;
    }
}