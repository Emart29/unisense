import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student, EnrollmentStatus } from '../entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ImportResultDto, ImportErrorDto } from './dto/import-result.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const existingStudent = await this.studentRepository.findOne({
      where: {
        universityId: createStudentDto.universityId,
        studentId: createStudentDto.studentId,
      },
    });

    if (existingStudent) {
      throw new ConflictException('Student with this ID already exists in this university');
    }

    const student = this.studentRepository.create(createStudentDto);
    return this.studentRepository.save(student);
  }

  async findAll(
    universityId: string,
    faculty?: string,
    department?: string,
    level?: number,
  ): Promise<Student[]> {
    const query = this.studentRepository.createQueryBuilder('student')
      .where('student.universityId = :universityId', { universityId });

    if (faculty) {
      query.andWhere('student.faculty = :faculty', { faculty });
    }

    if (department) {
      query.andWhere('student.department = :department', { department });
    }

    if (level !== undefined) {
      query.andWhere('student.level = :level', { level });
    }

    return query.getMany();
  }

  async findOne(id: string, universityId: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id, universityId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async update(id: string, universityId: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id, universityId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    Object.assign(student, updateStudentDto);
    return this.studentRepository.save(student);
  }

  async remove(id: string, universityId: string): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { id, universityId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.studentRepository.remove(student);
  }

  async importFromCSV(universityId: string, csvContent: string): Promise<ImportResultDto> {
    const lines = csvContent.trim().split('\n');
    
    if (lines.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['student_id', 'first_name', 'last_name', 'faculty', 'department', 'level', 'enrollment_status'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new BadRequestException(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const result: ImportResultDto = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      try {
        await this.validateAndCreateStudent(universityId, row, i + 1);
        result.successCount++;
      } catch (error) {
        result.failureCount++;
        result.errors.push({
          row: i + 1,
          studentId: row['student_id'] || 'unknown',
          error: error.message,
        });
      }
    }

    return result;
  }

  private async validateAndCreateStudent(
    universityId: string,
    row: Record<string, string>,
    rowNumber: number,
  ): Promise<Student> {
    const studentId = row['student_id'];
    const firstName = row['first_name'];
    const lastName = row['last_name'];
    const faculty = row['faculty'];
    const department = row['department'];
    const levelStr = row['level'];
    const enrollmentStatusStr = row['enrollment_status'];

    if (!studentId || !firstName || !lastName || !faculty || !department || !levelStr || !enrollmentStatusStr) {
      throw new Error('Missing required fields');
    }

    const level = parseInt(levelStr);
    if (isNaN(level) || level < 1) {
      throw new Error('Invalid level value');
    }

    if (!Object.values(EnrollmentStatus).includes(enrollmentStatusStr as EnrollmentStatus)) {
      throw new Error(`Invalid enrollment status: ${enrollmentStatusStr}`);
    }

    const existingStudent = await this.studentRepository.findOne({
      where: { universityId, studentId },
    });

    if (existingStudent) {
      throw new Error('Student ID already exists');
    }

    const createDto: CreateStudentDto = {
      universityId,
      studentId,
      firstName,
      lastName,
      faculty,
      department,
      level,
      enrollmentStatus: enrollmentStatusStr as EnrollmentStatus,
      creditLimit: row['credit_limit'] ? parseInt(row['credit_limit']) : 24,
    };

    return this.create(createDto);
  }
}
