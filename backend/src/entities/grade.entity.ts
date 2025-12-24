import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { University } from './university.entity';
import { Student } from './student.entity';
import { Course } from './course.entity';

@Entity('grades')
@Unique(['studentId', 'courseId'])
@Index(['studentId'])
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'university_id', type: 'uuid' })
  universityId: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column({ name: 'letter_grade', type: 'varchar', length: 2 })
  letterGrade: string;

  @Column({ name: 'grade_point', type: 'decimal', precision: 3, scale: 2 })
  gradePoint: number;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => University)
  @JoinColumn({ name: 'university_id' })
  university: University;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;
}
