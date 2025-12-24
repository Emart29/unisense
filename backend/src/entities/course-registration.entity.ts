import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { University } from './university.entity';
import { Student } from './student.entity';
import { Course } from './course.entity';

@Entity('course_registrations')
@Unique(['studentId', 'courseId'])
@Index(['studentId'])
export class CourseRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'university_id', type: 'uuid' })
  universityId: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @CreateDateColumn({ name: 'registered_at' })
  registeredAt: Date;

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
