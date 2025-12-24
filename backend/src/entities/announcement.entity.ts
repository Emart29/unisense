import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { University } from './university.entity';
import { User } from './user.entity';

@Entity('announcements')
@Index(['universityId', 'createdAt'])
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'university_id', type: 'uuid' })
  universityId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'target_roles', type: 'text', array: true })
  targetRoles: string[];

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => University)
  @JoinColumn({ name: 'university_id' })
  university: University;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
