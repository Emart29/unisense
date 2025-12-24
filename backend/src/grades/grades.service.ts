import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from '../entities/grade.entity';
import { SemesterResult } from '../entities/semester-result.entity';
import { Course } from '../entities/course.entity';
import { Student } from '../entities/student.entity';
import { CourseRegistration } from '../entities/course-registration.entity';
import { EnterGradeDto } from './dto/enter-grade.dto';

export interface GradeComputation {
  letterGrade: string;
  gradePoint: number;
}

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private gradesRepository: Repository<Grade>,
    @InjectRepository(SemesterResult)
    private semesterResultsRepository: Repository<SemesterResult>,
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(CourseRegistration)
    private courseRegistrationsRepository: Repository<CourseRegistration>,
  ) {}

  /**
   * Compute letter grade and grade point from numeric score
   * Grading scale: A (70-100), B (60-69), C (50-59), D (45-49), F (0-44)
   */
  computeGrade(score: number): GradeComputation {
    if (score < 0 || score > 100) {
      throw new Error('Score must be between 0 and 100');
    }

    if (score >= 70) {
      return { letterGrade: 'A', gradePoint: 5.0 };
    } else if (score >= 60) {
      return { letterGrade: 'B', gradePoint: 4.0 };
    } else if (score >= 50) {
      return { letterGrade: 'C', gradePoint: 3.0 };
    } else if (score >= 45) {
      return { letterGrade: 'D', gradePoint: 2.0 };
    } else {
      return { letterGrade: 'F', gradePoint: 0.0 };
    }
  }

  /**
   * Calculate GPA for a student in a specific semester
   * GPA = weighted average of grade points by credit units
   */
  async calculateGPA(studentId: string, session: string, semester: string, universityId: string): Promise<number> {
    // Get all grades for the student in this semester
    const grades = await this.gradesRepository
      .createQueryBuilder('grade')
      .innerJoin('grade.course', 'course')
      .where('grade.student_id = :studentId', { studentId })
      .andWhere('grade.university_id = :universityId', { universityId })
      .andWhere('course.session = :session', { session })
      .andWhere('course.semester = :semester', { semester })
      .select(['grade.gradePoint', 'course.creditUnits'])
      .getRawMany();

    if (grades.length === 0) {
      return 0;
    }

    let totalWeightedPoints = 0;
    let totalCredits = 0;

    for (const grade of grades) {
      const gradePoint = parseFloat(grade.grade_grade_point);
      const creditUnits = parseInt(grade.course_credit_units);
      totalWeightedPoints += gradePoint * creditUnits;
      totalCredits += creditUnits;
    }

    if (totalCredits === 0) {
      return 0;
    }

    return Math.round((totalWeightedPoints / totalCredits) * 100) / 100;
  }

  /**
   * Calculate CGPA for a student across all semesters
   * CGPA = weighted average of all grade points across all semesters
   */
  async calculateCGPA(studentId: string, universityId: string): Promise<number> {
    // Get all grades for the student across all semesters
    const grades = await this.gradesRepository
      .createQueryBuilder('grade')
      .innerJoin('grade.course', 'course')
      .where('grade.student_id = :studentId', { studentId })
      .andWhere('grade.university_id = :universityId', { universityId })
      .select(['grade.gradePoint', 'course.creditUnits'])
      .getRawMany();

    if (grades.length === 0) {
      return 0;
    }

    let totalWeightedPoints = 0;
    let totalCredits = 0;

    for (const grade of grades) {
      const gradePoint = parseFloat(grade.grade_grade_point);
      const creditUnits = parseInt(grade.course_credit_units);
      totalWeightedPoints += gradePoint * creditUnits;
      totalCredits += creditUnits;
    }

    if (totalCredits === 0) {
      return 0;
    }

    return Math.round((totalWeightedPoints / totalCredits) * 100) / 100;
  }

  /**
   * Enter a grade for a student in a course
   */
  async enterGrade(enterGradeDto: EnterGradeDto, universityId: string, lecturerId: string): Promise<Grade> {
    const { studentId, courseId, score } = enterGradeDto;

    // Verify the course exists and belongs to the university
    const course = await this.coursesRepository.findOne({
      where: { id: courseId, universityId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Verify the lecturer is assigned to this course
    if (course.lecturerId !== lecturerId) {
      throw new ForbiddenException('You are not assigned to this course');
    }

    // Verify the student exists and belongs to the university
    const student = await this.studentsRepository.findOne({
      where: { id: studentId, universityId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify the student is registered for this course
    const registration = await this.courseRegistrationsRepository.findOne({
      where: { studentId, courseId },
    });

    if (!registration) {
      throw new NotFoundException('Student is not registered for this course');
    }

    // Compute letter grade and grade point
    const { letterGrade, gradePoint } = this.computeGrade(score);

    // Check if grade already exists
    let grade = await this.gradesRepository.findOne({
      where: { studentId, courseId },
    });

    if (grade) {
      // Update existing grade
      grade.score = score;
      grade.letterGrade = letterGrade;
      grade.gradePoint = gradePoint;
    } else {
      // Create new grade
      grade = this.gradesRepository.create({
        universityId,
        studentId,
        courseId,
        score,
        letterGrade,
        gradePoint,
        isPublished: false,
      });
    }

    return await this.gradesRepository.save(grade);
  }

  /**
   * Publish results for a course
   */
  async publishResults(courseId: string, universityId: string, lecturerId: string): Promise<void> {
    // Verify the course exists and belongs to the university
    const course = await this.coursesRepository.findOne({
      where: { id: courseId, universityId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Verify the lecturer is assigned to this course
    if (course.lecturerId !== lecturerId) {
      throw new ForbiddenException('You are not assigned to this course');
    }

    // Update all grades for this course to published
    await this.gradesRepository.update(
      { courseId, universityId },
      { isPublished: true },
    );

    // Calculate and save semester results for all students in this course
    const grades = await this.gradesRepository.find({
      where: { courseId, universityId },
      relations: ['student'],
    });

    for (const grade of grades) {
      // Calculate GPA for this student's semester
      const gpa = await this.calculateGPA(
        grade.studentId,
        course.session,
        course.semester,
        universityId,
      );

      // Calculate CGPA for this student
      const cgpa = await this.calculateCGPA(grade.studentId, universityId);

      // Get total credits for this semester
      const semesterGrades = await this.gradesRepository
        .createQueryBuilder('grade')
        .innerJoin('grade.course', 'course')
        .where('grade.student_id = :studentId', { studentId: grade.studentId })
        .andWhere('grade.university_id = :universityId', { universityId })
        .andWhere('course.session = :session', { session: course.session })
        .andWhere('course.semester = :semester', { semester: course.semester })
        .select(['course.creditUnits'])
        .getRawMany();

      const totalCredits = semesterGrades.reduce(
        (sum, g) => sum + parseInt(g.course_credit_units),
        0,
      );

      // Save or update semester result
      let semesterResult = await this.semesterResultsRepository.findOne({
        where: {
          studentId: grade.studentId,
          session: course.session,
          semester: course.semester,
        },
      });

      if (semesterResult) {
        semesterResult.gpa = gpa;
        semesterResult.cgpa = cgpa;
        semesterResult.totalCredits = totalCredits;
      } else {
        semesterResult = this.semesterResultsRepository.create({
          universityId,
          studentId: grade.studentId,
          session: course.session,
          semester: course.semester,
          gpa,
          cgpa,
          totalCredits,
        });
      }

      await this.semesterResultsRepository.save(semesterResult);
    }
  }

  /**
   * Get grades for a student (with visibility logic)
   */
  async getStudentGrades(studentId: string, universityId: string, requestingUserId: string, userRole: string): Promise<Grade[]> {
    // Verify the student exists and belongs to the university
    const student = await this.studentsRepository.findOne({
      where: { id: studentId, universityId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // If requesting user is a student, verify they can only see their own grades
    if (userRole === 'STUDENT' && student.userId !== requestingUserId) {
      throw new ForbiddenException('You can only view your own grades');
    }

    const queryBuilder = this.gradesRepository
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.course', 'course')
      .where('grade.student_id = :studentId', { studentId })
      .andWhere('grade.university_id = :universityId', { universityId });

    // Students can only see published grades
    if (userRole === 'STUDENT') {
      queryBuilder.andWhere('grade.is_published = :isPublished', { isPublished: true });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get grades for a course (for lecturers)
   */
  async getCourseGrades(courseId: string, universityId: string, lecturerId: string): Promise<Grade[]> {
    // Verify the course exists and belongs to the university
    const course = await this.coursesRepository.findOne({
      where: { id: courseId, universityId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Verify the lecturer is assigned to this course
    if (course.lecturerId !== lecturerId) {
      throw new ForbiddenException('You are not assigned to this course');
    }

    return await this.gradesRepository.find({
      where: { courseId, universityId },
      relations: ['student'],
    });
  }

  /**
   * Get semester results for a student
   */
  async getStudentSemesterResults(studentId: string, universityId: string): Promise<SemesterResult[]> {
    // Verify the student exists and belongs to the university
    const student = await this.studentsRepository.findOne({
      where: { id: studentId, universityId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return await this.semesterResultsRepository.find({
      where: { studentId, universityId },
      order: { createdAt: 'DESC' },
    });
  }
}
