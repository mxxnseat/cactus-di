import "reflect-metadata";

import {
  ModuleMetadataKey,
  type ModuleOptions,
} from "./decorators/module.decorator";
import { Provider } from "./interfaces";
import { CircularDependencyError } from "./errors";

export class Container {
  private readonly container = new Map<Provider, unknown>();

  public get(provider: Provider) {
    return this.container.get(provider);
  }

  public create(module: new (...args: any[]) => unknown) {
    const moduleOptions = this.getModuleOptions(module);
    if (!moduleOptions) {
      throw new Error(`Module ${module.name} is not a module`);
    }
    const sortedGraph = this.buildDependencyGraph(moduleOptions);
    this.initializeDependencies(sortedGraph);
  }

  private buildDependencyGraph({ providers = [] }: ModuleOptions) {
    const indegree = new Map<Provider, number>();
    const graph = new Map<Provider, Provider[]>();

    const providersCopy = [...providers];

    for (const provider of providersCopy) {
      const parameters =
        Reflect.getMetadata("design:paramtypes", provider) ?? [];
      indegree.set(provider, indegree.get(provider) ?? 0);
      parameters.forEach((parameter: Provider | { forwardRef: any }) => {
        if (parameter && "forwardRef" in parameter) {
          providersCopy.push(parameter);
        }
        graph.set(parameter as any, [
          ...(graph.get(parameter as any) ?? ([] as any)),
          provider,
        ]);
        indegree.set(provider, (indegree.get(provider as any) ?? 0) + 1);
      });
    }
    const queue: Provider[] = providersCopy.filter(
      (provider) => indegree.get(provider) === 0
    );
    const sorted: Provider[] = [];

    while (queue.length !== 0) {
      let current = queue.shift()!;
      if (!("forwardRef" in current)) {
        sorted.push(current);
      }
      const deps = graph.get(current) ?? [];
      deps.forEach((dep) => {
        indegree.set(dep, indegree.get(dep)! - 1);
        if (indegree.get(dep) === 0) {
          queue.push(dep);
        }
      });
    }
    if (sorted.length !== providers.length) {
      throw new CircularDependencyError("Circular dependecy");
    }

    return sorted;
  }

  private initializeDependencies(sortedGraph: Provider[]) {
    sortedGraph.forEach((provider) => {
      const parameters =
        Reflect.getMetadata("design:paramtypes", provider) ?? [];
      const dependencies = parameters.map((param: Provider) =>
        this.container.get(param)
      );
      this.container.set(provider, new provider(...dependencies));
    });
  }

  private getModuleOptions(
    module: new (...args: any[]) => unknown
  ): ModuleOptions | null {
    return Reflect.getMetadata(ModuleMetadataKey, module) ?? null;
  }
}
