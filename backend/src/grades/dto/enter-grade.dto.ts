import { IsUUID, IsNumber, Min, Max } from 'class-validator';

export class EnterGradeDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  courseId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;
}
