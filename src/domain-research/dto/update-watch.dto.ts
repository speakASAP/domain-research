import { IsBoolean, IsEmail, IsOptional } from 'class-validator';

export class UpdateWatchDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsEmail()
  notificationEmail?: string;
}
