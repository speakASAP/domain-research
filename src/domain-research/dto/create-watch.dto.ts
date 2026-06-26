import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateWatchDto {
  @IsString()
  fqdn!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
