export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  field: string;

  constructor(message: string, field: string) {
    super(message, 400);
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
