import { IsUUID } from 'class-validator';

export class PublishResultsDto {
  @IsUUID()
  courseId: string;
}
