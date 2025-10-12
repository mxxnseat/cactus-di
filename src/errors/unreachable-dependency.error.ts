import { Provider } from "../interfaces";

export class UnreachableDependencyError extends Error {
  constructor(dependency: Provider) {
    super(`Dependency ${dependency.name} is unreachable`);
  }
}
