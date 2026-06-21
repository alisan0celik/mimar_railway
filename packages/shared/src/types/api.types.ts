export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: import("./user.types").UserDTO;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}
