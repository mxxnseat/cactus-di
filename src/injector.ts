import {
  designParamtypesMetadataKey,
  selfDependenciesMetadataKey,
  selfPropertiesMetadataKey,
} from "./constants";
import { UnreachableDependencyError } from "./errors/unreachable-dependency.error";
import { InstanceWrapper } from "./instance-wrapper";
import {
  Provider,
  SelfDefinedDependency,
  SelfDefinedProperty,
} from "./interfaces";
import { Module } from "./module";

export class Injector {
  public inject(instanceWrapper: InstanceWrapper, module: Module): unknown {
    if (instanceWrapper.instance) {
      return instanceWrapper.instance;
    }
    if (instanceWrapper.isCreating) {
      return instanceWrapper.instance;
    }
    instanceWrapper.isCreating = true;
    instanceWrapper.instance = Object.create(instanceWrapper.token.prototype);

    const dependencies = this.resolveDependencies(instanceWrapper, module);
    const instance = Reflect.construct(instanceWrapper.token, dependencies);

    instanceWrapper.isCreating = false;
    instanceWrapper.isResolved = true;
    instanceWrapper.instance = instance;
    return instance;
  }

  private resolveDependencies(
    instanceWrapper: InstanceWrapper,
    module: Module
  ): unknown[] {
    const selfDefinedDependencies = Reflect.getMetadata(
      selfDependenciesMetadataKey,
      instanceWrapper.token
    ) as SelfDefinedDependency[];
    const contructorParams = Reflect.getMetadata(
      designParamtypesMetadataKey,
      instanceWrapper.token
    ) as Provider[];

    this.applyPropertyInjections(instanceWrapper, module);

    const params =
      this.resolveSelfDefinedDependency(selfDefinedDependencies) ??
      contructorParams ??
      [];

    return params.map((dep) => this.resolveDependency(dep, module));
  }

  private applyPropertyInjections(
    instanceWrapper: InstanceWrapper,
    module: Module
  ) {
    const properties =
      this.resolveSelfDefinedProperty(
        Reflect.getMetadata(selfPropertiesMetadataKey, instanceWrapper.token)
      ) ?? [];
    properties.forEach((property) => {
      Object.defineProperty(instanceWrapper.token.prototype, property.key, {
        configurable: true,
        enumerable: true,
        get: () => {
          const depInstance = this.resolveDependency(
            property.type as Provider,
            module
          );
          return depInstance;
        },
      });
    });
  }

  private resolveDependency(dependency: Provider, module: Module): unknown {
    if (module.providers.has(dependency)) {
      const wrapper = module.providers.get(dependency)!;
      if (wrapper.isResolved) {
        return wrapper.instance;
      }
      return this.inject(wrapper, module);
    }

    for (const imported of module.imports) {
      if (imported.providers.has(dependency)) {
        const exported = imported.providers.get(dependency)!;
        if (exported.isResolved) {
          return exported.instance;
        }
        return this.inject(exported, imported);
      }
    }

    throw new UnreachableDependencyError(dependency);
  }

  private resolveSelfDefinedDependency(
    dependencies?: SelfDefinedDependency[]
  ): Provider[] | undefined {
    if (!dependencies) {
      return;
    }
    return dependencies
      .map((dep) => {
        if ("forwardRef" in dep.param && dep.param.forwardRef) {
          return { ...dep, param: dep.param.forwardRef() };
        }
        return dep;
      })
      .sort((a, b) => a.index - b.index)
      .map((dep) => dep.param) as Provider[];
  }

  private resolveSelfDefinedProperty(
    properties?: SelfDefinedProperty[]
  ): SelfDefinedProperty[] | undefined {
    if (!properties) {
      return;
    }
    return properties.map((dep) => {
      if ("forwardRef" in dep.type && dep.type.forwardRef) {
        return { ...dep, type: dep.type.forwardRef() };
      }
      return dep;
    });
  }
}
