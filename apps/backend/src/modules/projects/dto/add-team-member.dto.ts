import { IsOptional, IsString } from "class-validator";

export class AddTeamMemberDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  role?: string;
}
