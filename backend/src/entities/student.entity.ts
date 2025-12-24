import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { University } from './university.entity';
import { User } from './user.entity';

export enum EnrollmentStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  GRADUATED = 'graduated',
}

@Entity('students')
@Unique(['universityId', 'studentId'])
@Index(['universityId', 'studentId'])
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'university_id', type: 'uuid' })
  universityId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'student_id', type: 'varchar', length: 50 })
  studentId: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 100 })
  faculty: string;

  @Column({ type: 'varchar', length: 100 })
  department: string;

  @Column({ type: 'integer' })
  level: number;

  @Column({
    name: 'enrollment_status',
    type: 'varchar',
    length: 20,
    enum: EnrollmentStatus,
  })
  enrollmentStatus: EnrollmentStatus;

  @Column({ name: 'credit_limit', type: 'integer', default: 24 })
  creditLimit: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => University)
  @JoinColumn({ name: 'university_id' })
  university: University;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}
