import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from '../entities/course.entity';
import { CourseRegistration } from '../entities/course-registration.entity';
import { Student } from '../entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, CourseRegistration, Student])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
