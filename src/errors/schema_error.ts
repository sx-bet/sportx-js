export class APISchemaError extends Error {
  constructor(...args: any[]) {
    super(...args);
    Error.captureStackTrace(this, Error);
  }
}
