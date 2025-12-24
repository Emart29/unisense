import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { University } from './university.entity';
import { Student } from './student.entity';

@Entity('semester_results')
@Unique(['studentId', 'session', 'semester'])
@Index(['studentId'])
export class SemesterResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'university_id', type: 'uuid' })
  universityId: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ type: 'varchar', length: 20 })
  session: string;

  @Column({ type: 'varchar', length: 20 })
  semester: string;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  gpa: number;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  cgpa: number;

  @Column({ name: 'total_credits', type: 'integer' })
  totalCredits: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => University)
  @JoinColumn({ name: 'university_id' })
  university: University;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
