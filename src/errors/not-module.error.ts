export class NotModuleError extends Error {
  constructor(module: new (...args: any[]) => unknown) {
    super(`Module ${module.name} is not a module`);
  }
}
