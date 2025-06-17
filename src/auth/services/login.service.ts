import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthEmailLoginDto } from '../dto/auth-email-login.dto';
import { AuthLoginDto } from '../dto/auth-login.dto';
import { AuthProvidersEnum } from '../auth-providers.enum';
import { SocialInterface } from '../../social/interfaces/social.interface';
import { NullableType } from '../../utils/types/nullable.type';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/domain/user';
import { RoleEnum } from '../../roles/roles.enum';
import { StatusEnum } from '../../statuses/statuses.enum';

@Injectable()
export class LoginService {
  constructor(private usersService: UsersService) {}

  async validateEmailLogin(loginDto: AuthEmailLoginDto): Promise<User> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'notFound',
        },
      });
    }

    if (user.provider !== AuthProvidersEnum.email) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: `needLoginViaProvider:${user.provider}`,
        },
      });
    }

    if (!user.password) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    return user;
  }

  async validateFlexibleLogin(loginDto: AuthLoginDto): Promise<User> {
    // Determine if login is email or username
    const isEmail = loginDto.login.includes('@');
    let user: NullableType<User> = null;

    if (isEmail) {
      user = await this.usersService.findByEmail(loginDto.login);
    } else {
      user = await this.usersService.findByUsername(loginDto.login);
    }

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          login: 'notFound',
        },
      });
    }

    if (user.provider !== AuthProvidersEnum.email) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          login: `needLoginViaProvider:${user.provider}`,
        },
      });
    }

    if (!user.password) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    return user;
  }

  async validateSocialLogin(
    authProvider: string,
    socialData: SocialInterface,
  ): Promise<User> {
    let user: NullableType<User> = null;
    const socialEmail = socialData.email?.toLowerCase();
    let userByEmail: NullableType<User> = null;

    if (socialEmail) {
      userByEmail = await this.usersService.findByEmail(socialEmail);
    }

    if (socialData.id) {
      user = await this.usersService.findBySocialIdAndProvider({
        socialId: socialData.id,
        provider: authProvider,
      });
    }

    if (user) {
      if (socialEmail && !userByEmail) {
        user.email = socialEmail;
      }
      await this.usersService.update(user.id, user);
    } else if (userByEmail) {
      user = userByEmail;
    } else if (socialData.id) {
      const role = {
        id: RoleEnum.user,
      };
      const status = {
        id: StatusEnum.active,
      };

      user = await this.usersService.create({
        email: socialEmail ?? null,
        firstName: socialData.firstName ?? null,
        lastName: socialData.lastName ?? null,
        socialId: socialData.id,
        provider: authProvider,
        role,
        status,
      });

      user = await this.usersService.findById(user.id);
    }

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    return user;
  }
}
