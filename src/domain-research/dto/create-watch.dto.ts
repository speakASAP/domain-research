import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateWatchDto {
  @IsString()
  fqdn!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEmail()
  notificationEmail?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
