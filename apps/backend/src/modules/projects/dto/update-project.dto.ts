import { IsOptional, IsString, IsNumber, IsDateString, IsIn } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  projectType?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  hasInspection?: boolean;

  @IsOptional()
  @IsString()
  inspectionCompany?: string;

  @IsOptional()
  @IsIn(["planning", "active", "waiting", "completed"])
  status?: string;

  @IsOptional()
  @IsIn(["low", "medium", "high", "urgent"])
  priority?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;
}
