import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { University } from './university.entity';
import { User } from './user.entity';

@Entity('courses')
@Unique(['universityId', 'courseCode', 'session', 'semester'])
@Index(['universityId', 'courseCode'])
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'university_id', type: 'uuid' })
  universityId: string;

  @Column({ name: 'course_code', type: 'varchar', length: 50 })
  courseCode: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'credit_units', type: 'integer' })
  creditUnits: number;

  @Column({ type: 'varchar', length: 100 })
  faculty: string;

  @Column({ type: 'varchar', length: 100 })
  department: string;

  @Column({ type: 'integer' })
  level: number;

  @Column({ name: 'lecturer_id', type: 'uuid', nullable: true })
  lecturerId: string | null;

  @Column({ type: 'varchar', length: 20 })
  session: string;

  @Column({ type: 'varchar', length: 20 })
  semester: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => University)
  @JoinColumn({ name: 'university_id' })
  university: University;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'lecturer_id' })
  lecturer: User | null;
}
