import { IsNumber, Min, IsNotEmpty } from 'class-validator';

export class RecordPaymentDto {
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;
}
