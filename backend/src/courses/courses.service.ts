import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { CourseRegistration } from '../entities/course-registration.entity';
import { Student } from '../entities/student.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { RegisterCourseDto } from './dto/register-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(CourseRegistration)
    private courseRegistrationRepository: Repository<CourseRegistration>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const existingCourse = await this.courseRepository.findOne({
      where: {
        universityId: createCourseDto.universityId,
        courseCode: createCourseDto.courseCode,
        session: createCourseDto.session,
        semester: createCourseDto.semester,
      },
    });

    if (existingCourse) {
      throw new ConflictException('Course with this code already exists for this session and semester');
    }

    const course = this.courseRepository.create(createCourseDto);
    return this.courseRepository.save(course);
  }

  async findAll(
    universityId: string,
    faculty?: string,
    department?: string,
    level?: number,
  ): Promise<Course[]> {
    const query = this.courseRepository.createQueryBuilder('course')
      .where('course.universityId = :universityId', { universityId });

    if (faculty) {
      query.andWhere('course.faculty = :faculty', { faculty });
    }

    if (department) {
      query.andWhere('course.department = :department', { department });
    }

    if (level !== undefined) {
      query.andWhere('course.level = :level', { level });
    }

    return query.getMany();
  }

  async findOne(id: string, universityId: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id, universityId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findByLecturer(lecturerId: string, universityId: string): Promise<Course[]> {
    return this.courseRepository.find({
      where: { lecturerId, universityId },
    });
  }

  async update(id: string, universityId: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id, universityId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    Object.assign(course, updateCourseDto);
    return this.courseRepository.save(course);
  }

  async remove(id: string, universityId: string): Promise<void> {
    const course = await this.courseRepository.findOne({
      where: { id, universityId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.courseRepository.remove(course);
  }

  async registerCourse(registerCourseDto: RegisterCourseDto, universityId: string): Promise<CourseRegistration> {
    const { studentId, courseId } = registerCourseDto;

    // Check if student exists and belongs to the university
    const student = await this.studentRepository.findOne({
      where: { id: studentId, universityId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if course exists and belongs to the university
    const course = await this.courseRepository.findOne({
      where: { id: courseId, universityId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check for duplicate registration
    const existingRegistration = await this.courseRegistrationRepository.findOne({
      where: { studentId, courseId },
    });

    if (existingRegistration) {
      throw new ConflictException('Student is already registered for this course');
    }

    // Calculate total credit units including the new course
    const existingRegistrations = await this.courseRegistrationRepository.find({
      where: { studentId },
      relations: ['course'],
    });

    const currentCredits = existingRegistrations.reduce((sum, reg) => {
      return sum + (reg.course?.creditUnits || 0);
    }, 0);

    const totalCredits = currentCredits + course.creditUnits;

    // Check credit limit
    if (totalCredits > student.creditLimit) {
      throw new BadRequestException(
        `Credit limit exceeded. Current: ${currentCredits}, Attempted: ${totalCredits}, Limit: ${student.creditLimit}`
      );
    }

    // Create registration
    const registration = this.courseRegistrationRepository.create({
      universityId,
      studentId,
      courseId,
    });

    return this.courseRegistrationRepository.save(registration);
  }

  async getStudentRegistrations(studentId: string, universityId: string): Promise<CourseRegistration[]> {
    return this.courseRegistrationRepository.find({
      where: { studentId, universityId },
      relations: ['course'],
    });
  }

  async getCourseRegistrations(courseId: string, universityId: string): Promise<CourseRegistration[]> {
    return this.courseRegistrationRepository.find({
      where: { courseId, universityId },
      relations: ['student'],
    });
  }
}
