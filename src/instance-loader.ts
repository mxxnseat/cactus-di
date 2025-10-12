import { selfLazyMetadataKey } from "./constants";
import { Injector } from "./injector";
import { Module } from "./module";

export class InstanceLoader {
  private readonly injector = new Injector();

  public load(module: Module[]) {
    module.forEach((module) => {
      this.createInstancesOfProviders(module);
    });
  }

  private createInstancesOfProviders(module: Module) {
    for (const [, instanceWrapper] of module.providers) {
      instanceWrapper.isLazy = Reflect.hasMetadata(
        selfLazyMetadataKey,
        instanceWrapper.token
      );
      if (instanceWrapper.isLazy) {
        continue;
      }
      this.injector.inject(instanceWrapper, module);
    }
  }
}
