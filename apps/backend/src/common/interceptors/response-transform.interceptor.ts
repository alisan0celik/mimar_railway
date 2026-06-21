import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((response: unknown) => {
        const res = response as { data?: unknown; meta?: Record<string, unknown> };
        if (res?.data && res?.meta) {
          return {
            statusCode: context.switchToHttp().getResponse().statusCode,
            message: "OK",
            data: res.data as T,
            meta: res.meta,
          };
        }

        return {
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: "OK",
          data: response as T,
        };
      }),
    );
  }
}
