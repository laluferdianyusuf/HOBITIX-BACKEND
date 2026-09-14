import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBankAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  accountName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  accountNumber?: string;
}
