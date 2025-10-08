import { Constructor } from "type-fest";

export const ModuleMetadataKey = "module";

export interface ModuleOptions {
  providers?: any[];
  imports?: Constructor<void>[];
  exports?: any[];
}

export const Module = (moduleOptions: ModuleOptions) => {
  return (target: Function) =>
    Reflect.defineMetadata(ModuleMetadataKey, moduleOptions, target);
};
