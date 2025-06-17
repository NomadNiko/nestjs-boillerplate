import { Injectable } from '@nestjs/common';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { SocialInterface } from '../social/interfaces/social.interface';
import { NullableType } from '../utils/types/nullable.type';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';
import { User } from '../users/domain/user';
import { AuthenticationService } from './services/authentication.service';
import { RegistrationService } from './services/registration.service';
import { PasswordService } from './services/password.service';
import { UserProfileService } from './services/user-profile.service';

@Injectable()
export class AuthService {
  constructor(
    private authenticationService: AuthenticationService,
    private registrationService: RegistrationService,
    private passwordService: PasswordService,
    private userProfileService: UserProfileService,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    return this.authenticationService.validateLogin(loginDto);
  }

  async validateFlexibleLogin(
    loginDto: AuthLoginDto,
  ): Promise<LoginResponseDto> {
    return this.authenticationService.validateFlexibleLogin(loginDto);
  }

  async validateSocialLogin(
    authProvider: string,
    socialData: SocialInterface,
  ): Promise<LoginResponseDto> {
    return this.authenticationService.validateSocialLogin(
      authProvider,
      socialData,
    );
  }

  async register(dto: AuthRegisterLoginDto): Promise<void> {
    return this.registrationService.register(dto);
  }

  async confirmEmail(hash: string): Promise<void> {
    return this.registrationService.confirmEmail(hash);
  }

  async confirmNewEmail(hash: string): Promise<void> {
    return this.registrationService.confirmNewEmail(hash);
  }

  async forgotPassword(email: string): Promise<void> {
    return this.passwordService.forgotPassword(email);
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    return this.passwordService.resetPassword(hash, password);
  }

  async me(userJwtPayload: JwtPayloadType): Promise<NullableType<User>> {
    return this.userProfileService.me(userJwtPayload);
  }

  async update(
    userJwtPayload: JwtPayloadType,
    userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    return this.userProfileService.update(userJwtPayload, userDto);
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'sessionId' | 'hash'>,
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    return this.authenticationService.refreshToken(data);
  }

  async softDelete(user: User): Promise<void> {
    return this.userProfileService.softDelete(user);
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>) {
    return this.authenticationService.logout(data);
  }
}
