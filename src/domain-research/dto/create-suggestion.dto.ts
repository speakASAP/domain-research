import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSuggestionDto {
  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tlds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seedNames?: string[];

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(50)
  count?: number;
}
