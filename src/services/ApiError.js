export class ApiError extends Error {
  constructor(code, message, { field, status } = {}) {
    super(message);
    this.code = code;
    this.field = field;
    this.status = status;
  }
}
