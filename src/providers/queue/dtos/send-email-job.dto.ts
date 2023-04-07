import { ISendMailOptions } from '@nestjs-modules/mailer';
import { BaseJobDto } from './base-job.dto';

export class SendEmailJobDto extends BaseJobDto{
    task: "sendEmail"; 
    data: ISendMailOptions;
}