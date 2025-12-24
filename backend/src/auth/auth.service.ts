import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  universityId: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    universityId: string;
  };
}

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.validatePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      universityId: user.universityId,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        universityId: user.universityId,
      },
    };
  }

  async validateToken(token: string): Promise<User> {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
