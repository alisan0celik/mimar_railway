import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Sunucu hatası";
    let details: any = undefined;
    let code: string | undefined;
    const isProd = process.env.NODE_ENV === "production";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object") {
        const resp = exceptionResponse as any;
        message = resp.message || message;
        code = resp.code;

        if (Array.isArray(resp.message)) {
          details = resp.message.map((msg: string) => {
            if (typeof msg === "string" && msg.includes(" ")) {
              const field = msg.split(" ")[0];
              return { field, message: msg };
            }
            return { field: "unknown", message: msg };
          });
          message = "Doğrulama hatası";
        }
      }
    } else if (exception instanceof Error) {
      if (!isProd) {
        message = exception.message;
      }
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    if (status >= 500 && isProd) {
      message = "Sunucu hatası";
    }

    const errorResponse: any = {
      statusCode: status,
      message,
      error: status >= 500 ? "Internal Server Error" : this.getErrorLabel(status),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (details) {
      errorResponse.details = details;
    }
    if (code) {
      errorResponse.code = code;
    }

    response.status(status).json(errorResponse);
  }

  private getErrorLabel(status: number): string {
    switch (status) {
      case 400: return "Bad Request";
      case 401: return "Unauthorized";
      case 403: return "Forbidden";
      case 404: return "Not Found";
      case 409: return "Conflict";
      case 422: return "Unprocessable Entity";
      case 429: return "Too Many Requests";
      default: return "Error";
    }
  }
}
