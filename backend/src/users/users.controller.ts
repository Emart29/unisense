import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    // Ensure user can only create users in their own university
    createUserDto.universityId = req.user.universityId;
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.universityId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(id, req.user.universityId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.update(id, req.user.universityId, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user.universityId);
  }
}
