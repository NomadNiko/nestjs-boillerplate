import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import fs from 'node:fs/promises';
import Handlebars from 'handlebars';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class MailerService {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.resend = new Resend(configService.get('mail.resendApiKey', { infer: true }));
  }

  async sendMail({
    templatePath,
    context,
    to,
    subject,
    from,
    text,
  }: {
    templatePath: string;
    context: Record<string, unknown>;
    to: string;
    subject: string;
    from?: string;
    text?: string;
  }): Promise<void> {
    try {
      // Default HTML content in case template loading fails
      let html = '<p>Email content could not be loaded.</p>';
      
      if (templatePath) {
        const template = await fs.readFile(templatePath, 'utf-8');
        html = Handlebars.compile(template, {
          strict: true,
        })(context);
      }

      const emailData = {
        from: from || `${this.configService.get('mail.defaultName', { infer: true })} <${this.configService.get('mail.defaultEmail', { infer: true })}>`,
        to,
        subject,
        html,
        ...(text && { text })
      };

      await this.resend.emails.send(emailData);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
}