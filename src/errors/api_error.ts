export class APIError extends Error {
  public details = {};
  constructor(details = {}, ...args: any[]) {
    super(...args);
    Error.captureStackTrace(this, Error);
    this.details = details;
  }
}
