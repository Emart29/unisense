import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  targetRoles: string[];
}
