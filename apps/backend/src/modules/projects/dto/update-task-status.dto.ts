import { IsIn } from "class-validator";

export class UpdateTaskStatusDto {
  @IsIn(["todo", "in-progress", "completed", "cancelled"])
  status!: string;
}
