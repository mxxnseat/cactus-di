import { selfLazyMetadataKey, selfPropertiesMetadataKey } from "./constants";
import { InstanceWrapper } from "./instance-wrapper";
import { Provider, SelfDefinedProperty } from "./interfaces";

export class Module {
  public readonly imports = new Set<Module>();
  public readonly providers = new Map<Provider, InstanceWrapper>();
  public readonly exports = new Set<Provider>();

  public addImports(imports: Module[]) {
    imports.forEach((importModule) => {
      this.addImport(importModule);
    });
  }

  public addImport(importModule: Module) {
    this.imports.add(importModule);
  }

  public addProviders(providers: Provider[]) {
    providers.forEach((provider) => {
      this.addProvider(provider);
    });
  }

  public addProvider(provider: Provider) {
    this.markProviderDependenciesLazy(provider);
    const instanceWrapper = new InstanceWrapper(provider);
    this.providers.set(provider, instanceWrapper);
  }

  public addExports(exports: Provider[]) {
    exports.forEach((exported) => {
      this.addExport(exported);
    });
  }

  public addExport(exported: Provider) {
    this.exports.add(exported);
  }

  public get<T = unknown>(provider: Provider): T | null {
    const inCurrentModule = this.providers.get(provider)?.instance ?? null;
    if (inCurrentModule) {
      return inCurrentModule as T;
    }
    for (const importModule of this.imports) {
      const exported = importModule.get<T>(provider);
      if (exported) {
        return exported;
      }
    }
    return null;
  }

  private markProviderDependenciesLazy(provider: Provider) {
    const properties =
      (Reflect.getMetadata(
        selfPropertiesMetadataKey,
        provider
      ) as SelfDefinedProperty[]) ?? [];
    properties.forEach((property) => {
      const resolvedProperty = this.resolveProperty(property);
      Reflect.defineMetadata(selfLazyMetadataKey, true, resolvedProperty);
    });
  }

  private resolveProperty(property: SelfDefinedProperty): Provider {
    if ("forwardRef" in property.type && property.type.forwardRef) {
      return property.type.forwardRef();
    }
    return property.type as Provider;
  }
}
