export type ApiFieldError = {
  field: string;
  message: string;
  type: string;
};

export type ApiConflict = {
  resource_type?: string;
  resource_id?: number;
  expected_version?: number;
  current_version?: number;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  field_errors: ApiFieldError[];
  conflict: ApiConflict | null;
};

export type ApiErrorResponse = {
  error: ApiErrorBody;
};

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly response: ApiErrorResponse,
  ) {
    super(response.error.message);
    this.name = "ApiClientError";
  }
}
