import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { CoursesModule } from './courses/courses.module';
import { GradesModule } from './grades/grades.module';
import { FeesModule } from './fees/fees.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { University } from './entities/university.entity';
import { User } from './entities/user.entity';
import { Student } from './entities/student.entity';
import { Course } from './entities/course.entity';
import { CourseRegistration } from './entities/course-registration.entity';
import { Grade } from './entities/grade.entity';
import { SemesterResult } from './entities/semester-result.entity';
import { FeeStructure } from './entities/fee-structure.entity';
import { Invoice } from './entities/invoice.entity';
import { Announcement } from './entities/announcement.entity';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'unisense',
      entities: [University, User, Student, Course, CourseRegistration, Grade, SemesterResult, FeeStructure, Invoice, Announcement],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UsersModule,
    StudentsModule,
    CoursesModule,
    GradesModule,
    FeesModule,
    AnnouncementsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    Reflector,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
