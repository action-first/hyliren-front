export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static network(message = 'Network error') {
    return new ApiError(0, 'NETWORK', message);
  }

  isUnauthorized() { return this.status === 401; }
  isConflict() { return this.status === 409; }
  isServerError() { return this.status >= 500; }
}
