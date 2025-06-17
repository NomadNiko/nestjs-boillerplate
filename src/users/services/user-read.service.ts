import { Injectable } from '@nestjs/common';
import { NullableType } from '../../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from '../dto/query-user.dto';
import { UserRepository } from '../infrastructure/persistence/user.repository';
import { User } from '../domain/user';
import { IPaginationOptions } from '../../utils/types/pagination-options';

@Injectable()
export class UserReadService {
  constructor(private readonly usersRepository: UserRepository) {}

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    return this.usersRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: User['id']): Promise<NullableType<User>> {
    return this.usersRepository.findById(id);
  }

  findByIds(ids: User['id'][]): Promise<User[]> {
    return this.usersRepository.findByIds(ids);
  }

  findByEmail(email: User['email']): Promise<NullableType<User>> {
    return this.usersRepository.findByEmail(email);
  }

  findByUsername(username: User['username']): Promise<NullableType<User>> {
    return this.usersRepository.findByUsername(username);
  }

  findBySocialIdAndProvider({
    socialId,
    provider,
  }: {
    socialId: User['socialId'];
    provider: User['provider'];
  }): Promise<NullableType<User>> {
    return this.usersRepository.findBySocialIdAndProvider({
      socialId,
      provider,
    });
  }
}
