import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService, AuthResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login', description: 'Authenticate user with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token and user info' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile', description: 'Get authenticated user profile information' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async getProfile(@Request() req) {
    return {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      universityId: req.user.universityId,
    };
  }
}
