import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AnonymousStrategy } from './strategies/anonymous.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { MailModule } from '../mail/mail.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';
import { AuthenticationService } from './services/authentication.service';
import { RegistrationService } from './services/registration.service';
import { PasswordService } from './services/password.service';
import { UserProfileService } from './services/user-profile.service';
import { TokenService } from './services/token.service';
import { LoginService } from './services/login.service';

@Module({
  imports: [
    UsersModule,
    SessionModule,
    PassportModule,
    MailModule,
    JwtModule.register({}),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    AnonymousStrategy,
    AuthenticationService,
    RegistrationService,
    PasswordService,
    UserProfileService,
    TokenService,
    LoginService,
  ],

  exports: [AuthService],
})
export class AuthModule {}
