import "reflect-metadata";

import {
  ModuleMetadataKey,
  type ModuleOptions,
} from "./decorators/module.decorator";
import { Provider } from "./interfaces";
import { CircularDependencyError } from "./errors";
import { Constructor } from "type-fest";
import {
  designParamtypesMetadataKey,
  designTypeMetadataKey,
  selfContainerRelationMetadataKey,
  selfTypeMetadataKey,
  singletonMetadataKey,
} from "./constants";
import { LazyInjectTokenMetadataKey } from "./decorators";

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
    moduleOptions.providers?.forEach((provider) => {
      Reflect.defineMetadata(selfContainerRelationMetadataKey, this, provider);
    });
    (moduleOptions.imports ?? []).forEach((importModule) => {
      const moduleContainer = new Container();
      const exportedProviders = moduleContainer.create(importModule);
      exportedProviders.forEach((value, provider: Provider) => {
        this.container.set(provider, value);
      });
      this.moduleRefs.set(importModule, moduleContainer);
    });
    const sortedGraph = this.buildDependencyGraph(moduleOptions);
    this.initializeDependencies(sortedGraph);
    return this.exportProviders(moduleOptions);
  }

  private buildDependencyGraph({ providers = [] }: ModuleOptions) {
    const indegree = new Map<Provider, number>();
    const graph = new Map<Provider, Provider[]>();

    const providersCopy = [...providers];

    for (const provider of providersCopy) {
      this.container.set(provider, null);
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
        indegree.set(provider, (indegree.get(provider) ?? 0) + 1);
      });
    }
    const queue: Provider[] = providersCopy.filter(
      (provider) => indegree.get(provider) === 0
    );
    const sorted: Provider[] = [];

    while (queue.length !== 0) {
      const current = queue.shift()!;
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
      const lazyInject = Reflect.getMetadata(
        LazyInjectTokenMetadataKey,
        provider
      );
      const params =
        Reflect.getMetadata(selfTypeMetadataKey, provider.prototype) ?? [];
      params.forEach((param: any) => {
        const dependency = Reflect.getMetadata(
          designTypeMetadataKey,
          provider.prototype,
          param
        );
        Object.defineProperty(provider.prototype, param, {
          get: () => {
            const instance = this.container.get(dependency);
            const instanceContainer = Reflect.getMetadata(
              selfContainerRelationMetadataKey,
              dependency
            );
            if (!instanceContainer) {
              throw new Error("Unknown provider");
            }

            if (!instance) {
              this.container.set(
                dependency,
                instanceContainer?.buildDependency(dependency)
              );
            }
            return instance;
          },
        });
      });
      if (lazyInject) {
        return;
      }
      this.buildDependency(provider);
    });
  }

  private buildDependency(provider: Provider) {
    if (!this.container.has(provider)) {
      throw new Error(`Dependency ${provider.name} is not available`);
    }
    const existedProvider = this.container.get(provider);
    if (existedProvider) {
      return existedProvider;
    }
    const parameters =
      (Reflect.getMetadata(designParamtypesMetadataKey, provider) as any[]) ??
      [];
    const dependencies = parameters.map<unknown>((param: any) => {
      const resolvedParam = "forwardRef" in param ? param.forwardRef() : param;
      return this.container.get(resolvedParam);
    });
    if (Reflect.hasOwnMetadata(singletonMetadataKey, provider)) {
      return;
    }
    const providerInstance = new provider(...dependencies);
    Reflect.defineMetadata(singletonMetadataKey, true, provider);
    this.container.set(provider, providerInstance);
    return providerInstance;
  }

  private exportProviders({ exports = [] }: ModuleOptions) {
    const exportedProviders = new Map<Provider, unknown>();
    exports.forEach((exported) => {
      if (this.container.has(exported)) {
        exportedProviders.set(exported, this.container.get(exported));
      }
    });
    return exportedProviders;
  }

  private getModuleOptions(
    module: new (...args: any[]) => unknown
  ): ModuleOptions | null {
    return (
      (Reflect.getMetadata(ModuleMetadataKey, module) as ModuleOptions) ?? null
    );
  }
}
