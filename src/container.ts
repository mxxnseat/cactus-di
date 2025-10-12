import { Constructor } from "type-fest";
import { Provider } from "./interfaces";
import { Module } from "./module";
import { ModuleScanner } from "./module-scanner";
import { InstanceLoader } from "./instance-loader";
import { selfGlobalMetadataKey } from "./constants";

export class Container {
  private readonly globalModules = new Set<Module>();
  private readonly modules = new Map<Constructor<unknown>, Module>();
  private readonly scanner = new ModuleScanner(this);
  private readonly instanceLoader = new InstanceLoader();

  public get<T = unknown>(provider: Provider): T | null {
    for (const module of this.modules.values()) {
      const instance = module.get(provider);
      if (instance) {
        return instance as T;
      }
    }
    for (const module of this.globalModules) {
      const instance = module.get(provider);
      if (instance) {
        return instance as T;
      }
    }
    return null;
  }

  public create(module: new (...args: any[]) => unknown) {
    this.scanner.scan(module);
    this.modules.forEach((module) => {
      this.bindGlobalModulesToModule(module);
    });
    this.instanceLoader.load([...this.modules.values()]);
  }

  public addModule(module: Constructor<unknown>): Module {
    if (this.modules.has(module)) return this.modules.get(module)!;

    const moduleRef = new Module();
    this.modules.set(module, moduleRef);
    if (Reflect.getMetadata(selfGlobalMetadataKey, module)) {
      this.globalModules.add(moduleRef);
    }
    return moduleRef;
  }

  private bindGlobalModulesToModule(targetModule: Module) {
    for (const globalModule of this.globalModules) {
      if (targetModule === globalModule) continue;
      targetModule.addImport(globalModule);
    }
  }
}
