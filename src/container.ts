import "reflect-metadata";

import {
  ModuleMetadataKey,
  type ModuleOptions,
} from "./decorators/module.decorator";
import { Provider } from "./interfaces";
import { CircularDependencyError } from "./errors";
import { Constructor } from "type-fest";
import { designParamtypesMetadataKey, singletonMetadataKey } from "./constants";

export class Container {
  private readonly container = new Map<Provider, unknown>();
  private readonly moduleRefs = new Map<Constructor<unknown>, Container>();

  public get<T = unknown>(provider: Provider): T | null {
    return (this.container.get(provider) as T) ?? null;
  }

  public create(module: new (...args: any[]) => unknown) {
    const moduleOptions = this.getModuleOptions(module);
    if (!moduleOptions) {
      throw new Error(`Module ${module.name} is not a module`);
    }
    (moduleOptions.imports ?? []).forEach((importModule) => {
      const moduleContainer = new Container();
      const exportedProviders = moduleContainer.create(importModule);
      exportedProviders.forEach((provider: any) => {
        this.container.set(provider.constructor, provider);
      });

      this.moduleRefs.set(importModule, moduleContainer);
    });
    const sortedGraph = this.buildDependencyGraph(moduleOptions);
    this.initializeDependencies(sortedGraph);
    return this.exportProviders(moduleOptions);
  }

  private buildDependencyGraph({
    providers = [],
    imports = [],
  }: ModuleOptions) {
    const indegree = new Map<Provider, number>();
    const graph = new Map<Provider, Provider[]>();

    const providersCopy = [...providers];

    for (const provider of providersCopy) {
      const parameters =
        Reflect.getMetadata(designParamtypesMetadataKey, provider) ?? [];
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
    sortedGraph.map((provider) => {
      const parameters =
        Reflect.getMetadata(designParamtypesMetadataKey, provider) ?? [];
      const dependencies = parameters.map((param: Provider) =>
        this.container.get(param)
      );
      if (Reflect.hasOwnMetadata(singletonMetadataKey, provider)) {
        return;
      }
      const providerInstance = new provider(...dependencies);
      Reflect.defineMetadata(singletonMetadataKey, true, provider);
      this.container.set(provider, providerInstance);
    });
  }

  private exportProviders({ exports = [] }: ModuleOptions) {
    return Array.from(this.container.values()).filter((provider: any) =>
      exports.includes(provider.constructor)
    );
  }

  private getModuleOptions(
    module: new (...args: any[]) => unknown
  ): ModuleOptions | null {
    return Reflect.getMetadata(ModuleMetadataKey, module) ?? null;
  }
}
