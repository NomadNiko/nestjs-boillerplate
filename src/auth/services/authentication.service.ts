import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthEmailLoginDto } from '../dto/auth-email-login.dto';
import { AuthLoginDto } from '../dto/auth-login.dto';
import { SocialInterface } from '../../social/interfaces/social.interface';
import { LoginResponseDto } from '../dto/login-response.dto';
import { JwtRefreshPayloadType } from '../strategies/types/jwt-refresh-payload.type';
import { UsersService } from '../../users/users.service';
import { SessionService } from '../../session/session.service';
import { LoginService } from './login.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthenticationService {
  constructor(
    private loginService: LoginService,
    private tokenService: TokenService,
    private usersService: UsersService,
    private sessionService: SessionService,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    const user = await this.loginService.validateEmailLogin(loginDto);

    const session = await this.sessionService.create({
      user,
      hash: '',
    });

    const { token, refreshToken, tokenExpires, hash } =
      await this.tokenService.generateTokens({
        id: user.id,
        role: user.role,
        sessionId: session.id,
      });

    await this.sessionService.update(session.id, { hash });

    return {
      refreshToken,
      token,
      tokenExpires,
      user,
    };
  }

  async validateFlexibleLogin(
    loginDto: AuthLoginDto,
  ): Promise<LoginResponseDto> {
    const user = await this.loginService.validateFlexibleLogin(loginDto);

    const session = await this.sessionService.create({
      user,
      hash: '',
    });

    const { token, refreshToken, tokenExpires, hash } =
      await this.tokenService.generateTokens({
        id: user.id,
        role: user.role,
        sessionId: session.id,
      });

    await this.sessionService.update(session.id, { hash });

    return {
      refreshToken,
      token,
      tokenExpires,
      user,
    };
  }

  async validateSocialLogin(
    authProvider: string,
    socialData: SocialInterface,
  ): Promise<LoginResponseDto> {
    const user = await this.loginService.validateSocialLogin(
      authProvider,
      socialData,
    );

    const session = await this.sessionService.create({
      user,
      hash: '',
    });

    const { token, refreshToken, tokenExpires, hash } =
      await this.tokenService.generateTokens({
        id: user.id,
        role: user.role,
        sessionId: session.id,
      });

    await this.sessionService.update(session.id, { hash });

    return {
      refreshToken,
      token,
      tokenExpires,
      user,
    };
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'sessionId' | 'hash'>,
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    const session = await this.sessionService.findById(data.sessionId);

    if (!session) {
      throw new UnauthorizedException();
    }

    if (session.hash !== data.hash) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findById(session.user.id);

    if (!user?.role) {
      throw new UnauthorizedException();
    }

    const { token, refreshToken, tokenExpires, hash } =
      await this.tokenService.generateTokens({
        id: session.user.id,
        role: user.role,
        sessionId: session.id,
      });

    await this.sessionService.update(session.id, { hash });

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>) {
    return this.sessionService.deleteById(data.sessionId);
  }
}
