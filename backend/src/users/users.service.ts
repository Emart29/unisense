import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authService: AuthService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await this.authService.hashPassword(createUserDto.password);

    const user = this.userRepository.create({
      universityId: createUserDto.universityId,
      email: createUserDto.email,
      passwordHash,
      role: createUserDto.role,
    });

    return this.userRepository.save(user);
  }

  async findAll(universityId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { universityId },
      select: ['id', 'email', 'role', 'universityId', 'createdAt'],
    });
  }

  async findOne(id: string, universityId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, universityId },
      select: ['id', 'email', 'role', 'universityId', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, universityId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, universityId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      user.email = updateUserDto.email;
    }

    if (updateUserDto.password) {
      user.passwordHash = await this.authService.hashPassword(updateUserDto.password);
    }

    if (updateUserDto.role) {
      user.role = updateUserDto.role;
    }

    return this.userRepository.save(user);
  }

  async remove(id: string, universityId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id, universityId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);
  }
}
