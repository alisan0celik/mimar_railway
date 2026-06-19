import { IsIn, IsOptional, IsString, IsDateString } from "class-validator";

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(["todo", "in-progress", "completed", "cancelled"])
  status?: string;

  @IsOptional()
  @IsIn(["low", "medium", "high", "urgent"])
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}
