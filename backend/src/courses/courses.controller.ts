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
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { RegisterCourseDto } from './dto/register-course.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DEAN)
  create(@Body() createCourseDto: CreateCourseDto, @Request() req) {
    createCourseDto.universityId = req.user.universityId;
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DEAN, UserRole.LECTURER, UserRole.STUDENT)
  findAll(
    @Request() req,
    @Query('faculty') faculty?: string,
    @Query('department') department?: string,
    @Query('level') level?: string,
  ) {
    const levelNum = level ? parseInt(level) : undefined;
    return this.coursesService.findAll(req.user.universityId, faculty, department, levelNum);
  }

  @Get('lecturer/:lecturerId')
  @Roles(UserRole.ADMIN, UserRole.DEAN, UserRole.LECTURER)
  findByLecturer(@Param('lecturerId') lecturerId: string, @Request() req) {
    return this.coursesService.findByLecturer(lecturerId, req.user.universityId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DEAN, UserRole.LECTURER, UserRole.STUDENT)
  findOne(@Param('id') id: string, @Request() req) {
    return this.coursesService.findOne(id, req.user.universityId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DEAN)
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto, @Request() req) {
    return this.coursesService.update(id, req.user.universityId, updateCourseDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DEAN)
  remove(@Param('id') id: string, @Request() req) {
    return this.coursesService.remove(id, req.user.universityId);
  }

  @Post('register')
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  registerCourse(@Body() registerCourseDto: RegisterCourseDto, @Request() req) {
    return this.coursesService.registerCourse(registerCourseDto, req.user.universityId);
  }

  @Get('registrations/student/:studentId')
  @Roles(UserRole.ADMIN, UserRole.DEAN, UserRole.STUDENT)
  getStudentRegistrations(@Param('studentId') studentId: string, @Request() req) {
    return this.coursesService.getStudentRegistrations(studentId, req.user.universityId);
  }

  @Get('registrations/course/:courseId')
  @Roles(UserRole.ADMIN, UserRole.DEAN, UserRole.LECTURER)
  getCourseRegistrations(@Param('courseId') courseId: string, @Request() req) {
    return this.coursesService.getCourseRegistrations(courseId, req.user.universityId);
  }
}
