import { BaseJobDto } from './base-job.dto';

export class UploadBlogImageJobDto extends BaseJobDto{
    task: "uploadBlogImage";
    data: {
        file: Express.Multer.File;
        folder: string;
        blog_id: string;
    }
}