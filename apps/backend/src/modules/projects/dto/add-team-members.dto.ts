import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class AddTeamMembersDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds!: string[];
}
