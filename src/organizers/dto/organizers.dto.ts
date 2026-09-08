import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateOrganizerDto {
  @IsString()
  name: string;

  @IsEnum(['EVENT_ORGANIZER', 'PROMOTER', 'COMMUNITY', 'COMPANY', 'INDIVIDUAL'])
  type: any;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;
}
