import { IsString, IsNotEmpty, IsInt, Min, IsNumber, IsUUID } from 'class-validator';

export class CreateFeeStructureDto {
  @IsUUID()
  @IsNotEmpty()
  universityId: string;

  @IsString()
  @IsNotEmpty()
  session: string;

  @IsInt()
  @Min(1)
  level: number;

  @IsNumber()
  @Min(0)
  amount: number;
}
