import { IsOptional, IsString } from 'class-validator';

export class DuitkuCallbackDto {
  @IsString()
  merchantCode: string;

  @IsString()
  amount: string;

  @IsString()
  merchantOrderId: string;

  @IsOptional()
  @IsString()
  productDetail?: string;

  @IsOptional()
  @IsString()
  additionalParam?: string;

  @IsOptional()
  @IsString()
  paymentCode?: string;

  @IsString()
  resultCode: string;

  @IsString()
  signature: string;

  @IsString()
  reference: string;

  @IsOptional()
  @IsString()
  merchantUserId?: string;

  @IsOptional()
  @IsString()
  issuerName?: string;

  @IsOptional()
  @IsString()
  issuerBank?: string;
}
