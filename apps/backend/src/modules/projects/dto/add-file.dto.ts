import { IsNumber, IsString, Min } from "class-validator";

export class AddFileDto {
  @IsString()
  name!: string;

  @IsString()
  url!: string;

  @IsNumber()
  @Min(0)
  size!: number;

  @IsString()
  type!: string;
}
