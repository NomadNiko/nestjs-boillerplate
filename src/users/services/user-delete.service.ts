import { Injectable } from '@nestjs/common';
import { UserRepository } from '../infrastructure/persistence/user.repository';
import { User } from '../domain/user';

@Injectable()
export class UserDeleteService {
  constructor(private readonly usersRepository: UserRepository) {}

  async remove(id: User['id']): Promise<void> {
    await this.usersRepository.remove(id);
  }
}
