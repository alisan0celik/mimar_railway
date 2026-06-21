import { IsNotEmpty, IsString } from "class-validator";

export class ApproveMemberDto {
  @IsString()
  @IsNotEmpty()
  roleId!: string;
}
