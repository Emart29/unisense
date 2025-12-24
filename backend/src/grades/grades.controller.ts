import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GradesService } from './grades.service';
import { EnterGradeDto } from './dto/enter-grade.dto';
import { PublishResultsDto } from './dto/publish-results.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post('enter')
  @Roles(UserRole.LECTURER)
  async enterGrade(@Body() enterGradeDto: EnterGradeDto, @Request() req) {
    const universityId = req.user.universityId;
    const lecturerId = req.user.userId;
    return await this.gradesService.enterGrade(enterGradeDto, universityId, lecturerId);
  }

  @Post('publish')
  @Roles(UserRole.LECTURER)
  async publishResults(@Body() publishResultsDto: PublishResultsDto, @Request() req) {
    const universityId = req.user.universityId;
    const lecturerId = req.user.userId;
    await this.gradesService.publishResults(publishResultsDto.courseId, universityId, lecturerId);
    return { message: 'Results published successfully' };
  }

  @Get('student/:studentId')
  @Roles(UserRole.STUDENT, UserRole.LECTURER, UserRole.ADMIN, UserRole.DEAN, UserRole.FINANCE)
  async getStudentGrades(@Param('studentId') studentId: string, @Request() req) {
    const universityId = req.user.universityId;
    const requestingUserId = req.user.userId;
    const userRole = req.user.role;
    return await this.gradesService.getStudentGrades(studentId, universityId, requestingUserId, userRole);
  }

  @Get('course/:courseId')
  @Roles(UserRole.LECTURER)
  async getCourseGrades(@Param('courseId') courseId: string, @Request() req) {
    const universityId = req.user.universityId;
    const lecturerId = req.user.userId;
    return await this.gradesService.getCourseGrades(courseId, universityId, lecturerId);
  }

  @Get('semester-results/:studentId')
  @Roles(UserRole.STUDENT, UserRole.LECTURER, UserRole.ADMIN, UserRole.DEAN, UserRole.FINANCE)
  async getStudentSemesterResults(@Param('studentId') studentId: string, @Request() req) {
    const universityId = req.user.universityId;
    return await this.gradesService.getStudentSemesterResults(studentId, universityId);
  }
}
