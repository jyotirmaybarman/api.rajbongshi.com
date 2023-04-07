import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
  ) {}

  async sendEmail(data: ISendMailOptions) {
    return await this.mailerService.sendMail(data)
  }
}
