import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API');
    this.fromEmail = this.configService.get<string>(
      'RESEND_FROM_EMAIL',
      'noreply@ntbhub.com',
    );

    if (!apiKey) {
      throw new InternalServerErrorException(
        'RESEND_API key is missing in environment configuration',
      );
    }

    this.resend = new Resend(apiKey);
  }

  async sendEmail(to: string, subject: string, html: string) {
    return this.resend.emails.send({
      from: `"NTB HUB" <${this.fromEmail}>`,
      to,
      subject,
      html,
    });
  }
}
