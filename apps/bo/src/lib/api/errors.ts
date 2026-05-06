/**
 * BO API 에러 클래스 — FO/PO 의 ApiError 와 동일 컨벤션.
 */
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  static network(message: string): ApiError {
    return new ApiError(0, 'NETWORK_ERROR', message);
  }
}
