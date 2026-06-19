import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class SyncMutationDto {
  @IsUUID()
  mutationId!: string;

  @IsIn(["note", "task", "message"])
  entity!: "note" | "task" | "message";

  @IsIn(["create", "update", "delete"])
  action!: "create" | "update" | "delete";

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsISO8601()
  clientCreatedAt!: string;
}

export class PushSyncDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncMutationDto)
  mutations!: SyncMutationDto[];
}
