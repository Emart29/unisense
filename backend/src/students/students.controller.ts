import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createStudentDto: CreateStudentDto, @Request() req) {
    createStudentDto.universityId = req.user.universityId;
    return this.studentsService.create(createStudentDto);
  }

  @Post('import')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async importCSV(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const csvContent = file.buffer.toString('utf-8');
    return this.studentsService.importFromCSV(req.user.universityId, csvContent);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DEAN, UserRole.FINANCE)
  findAll(
    @Request() req,
    @Query('faculty') faculty?: string,
    @Query('department') department?: string,
    @Query('level') level?: string,
  ) {
    const levelNum = level ? parseInt(level) : undefined;
    return this.studentsService.findAll(req.user.universityId, faculty, department, levelNum);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DEAN, UserRole.FINANCE)
  findOne(@Param('id') id: string, @Request() req) {
    return this.studentsService.findOne(id, req.user.universityId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto, @Request() req) {
    return this.studentsService.update(id, req.user.universityId, updateStudentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.studentsService.remove(id, req.user.universityId);
  }
}
