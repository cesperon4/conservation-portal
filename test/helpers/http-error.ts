import { expect } from "vitest";
import { HttpError } from "../../src/lib/errors.js";

export function expectHttpError(
  promise: Promise<unknown>,
  statusCode: number,
  message: string,
) {
  return expect(promise).rejects.toSatisfy((err: unknown) => {
    return (
      err instanceof HttpError &&
      err.statusCode === statusCode &&
      err.message === message
    );
  });
}
