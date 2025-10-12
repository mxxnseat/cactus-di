import { Constructor } from "type-fest";
import { moduleMetadataKey } from "./constants";
import { NotModuleError } from "./errors/not-module.error";
import { Container } from "./container";
import { ModuleOptions } from "./decorators";

export class ModuleScanner {
  constructor(private readonly container: Container) {}

  public scan(module: Constructor<unknown>) {
    this.scanForModules(module);
  }

  public scanForModules(module: Constructor<unknown>) {
    const builtModule = this.container.addModule(module);

    const { imports, exports, providers } = this.getModuleOptions(module);
    imports?.forEach((importModule) => {
      this.scanForModules(importModule);
      builtModule.addImport(this.container.addModule(importModule));
    });

    builtModule.addProviders(providers ?? []);
    builtModule.addExports(exports ?? []);
  }

  private getModuleOptions(module: Constructor<unknown>): ModuleOptions {
    if (!Reflect.hasMetadata(moduleMetadataKey, module)) {
      throw new NotModuleError(module);
    }
    return (
      (Reflect.getMetadata(moduleMetadataKey, module) as ModuleOptions) ?? {}
    );
  }
}
