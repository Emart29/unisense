import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
import { Grade } from '../entities/grade.entity';
import { SemesterResult } from '../entities/semester-result.entity';
import { Course } from '../entities/course.entity';
import { Student } from '../entities/student.entity';
import { CourseRegistration } from '../entities/course-registration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Grade,
      SemesterResult,
      Course,
      Student,
      CourseRegistration,
    ]),
  ],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
