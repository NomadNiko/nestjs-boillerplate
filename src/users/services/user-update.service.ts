import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NullableType } from '../../utils/types/nullable.type';
import { UserRepository } from '../infrastructure/persistence/user.repository';
import { User } from '../domain/user';
import bcrypt from 'bcryptjs';
import { FilesService } from '../../files/files.service';
import { RoleEnum } from '../../roles/roles.enum';
import { StatusEnum } from '../../statuses/statuses.enum';
import { FileType } from '../../files/domain/file';
import { Role } from '../../roles/domain/role';
import { Status } from '../../statuses/domain/status';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserUpdateService {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly filesService: FilesService,
  ) {}

  async update(
    id: User['id'],
    updateUserDto: UpdateUserDto,
  ): Promise<NullableType<User>> {
    // Do not remove comment below.
    // <updating-property />

    let password: string | undefined = undefined;

    if (updateUserDto.password) {
      const userObject = await this.usersRepository.findById(id);

      if (userObject && userObject?.password !== updateUserDto.password) {
        const salt = await bcrypt.genSalt();
        password = await bcrypt.hash(updateUserDto.password, salt);
      }
    }

    let email: string | null | undefined = undefined;

    if (updateUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(
        updateUserDto.email,
      );

      if (userObject && userObject.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailAlreadyExists',
          },
        });
      }

      email = updateUserDto.email;
    } else if (updateUserDto.email === null) {
      email = null;
    }

    let username: string | null | undefined = undefined;

    if (updateUserDto.username) {
      const userObject = await this.usersRepository.findByUsername(
        updateUserDto.username,
      );

      if (userObject && userObject.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            username: 'usernameAlreadyExists',
          },
        });
      }

      username = updateUserDto.username;
    } else if (updateUserDto.username === null) {
      username = null;
    }

    let photo: FileType | null | undefined = undefined;

    if (updateUserDto.photo?.id) {
      const fileObject = await this.filesService.findById(
        updateUserDto.photo.id,
      );
      if (!fileObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            photo: 'imageNotExists',
          },
        });
      }
      photo = fileObject;
    } else if (updateUserDto.photo === null) {
      photo = null;
    }

    let role: Role | undefined = undefined;

    if (updateUserDto.role?.id) {
      const roleObject = Object.values(RoleEnum)
        .map(String)
        .includes(String(updateUserDto.role.id));
      if (!roleObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            role: 'roleNotExists',
          },
        });
      }

      role = {
        id: updateUserDto.role.id,
      };
    }

    let status: Status | undefined = undefined;

    if (updateUserDto.status?.id) {
      const statusObject = Object.values(StatusEnum)
        .map(String)
        .includes(String(updateUserDto.status.id));
      if (!statusObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            status: 'statusNotExists',
          },
        });
      }

      status = {
        id: updateUserDto.status.id,
      };
    }

    return this.usersRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      email,
      username,
      password,
      photo,
      role,
      status,
      provider: updateUserDto.provider,
      socialId: updateUserDto.socialId,
    });
  }
}
