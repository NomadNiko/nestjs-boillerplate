import { registerAs } from '@nestjs/config';
import { IsString, IsEmail } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { MailConfig } from './mail-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  RESEND_API_KEY: string;

  @IsEmail()
  MAIL_DEFAULT_EMAIL: string;

  @IsString()
  MAIL_DEFAULT_NAME: string;
}

export default registerAs<MailConfig>('mail', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    defaultEmail: process.env.MAIL_DEFAULT_EMAIL ?? 'noreply@example.com',
    defaultName: process.env.MAIL_DEFAULT_NAME ?? 'App Name',
  };
});