export class CircularDependencyError extends Error {
  constructor(message: string) {
    super(message);
  }
}
