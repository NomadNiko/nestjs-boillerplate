import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import crypto from 'crypto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { JwtRefreshPayloadType } from '../strategies/types/jwt-refresh-payload.type';
import { JwtPayloadType } from '../strategies/types/jwt-payload.type';
import { User } from '../../users/domain/user';
import { Session } from '../../session/domain/session';
import { AllConfigType } from '../../config/config.type';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService<AllConfigType>,
  ) {}

  async generateTokens(data: {
    id: User['id'];
    role: User['role'];
    sessionId: Session['id'];
  }): Promise<{
    token: string;
    refreshToken: string;
    tokenExpires: number;
    hash: string;
  }> {
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: data.id,
          role: data.role,
          sessionId: data.sessionId,
        } as JwtPayloadType,
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash,
        } as JwtRefreshPayloadType,
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
      hash,
    };
  }
}
