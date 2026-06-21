import { IsDateString, IsIn, IsOptional, IsString } from "class-validator";

export class CreateCalendarEventDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  projectName?: string;

  @IsString()
  time!: string;

  @IsOptional()
  @IsIn(["deadline", "meeting", "other"])
  type?: string;

  @IsDateString()
  date!: string;
}
