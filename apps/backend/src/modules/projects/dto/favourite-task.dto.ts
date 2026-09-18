import { IsString, MaxLength, MinLength } from "class-validator";

export class FavouriteTaskDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  title!: string;
}
