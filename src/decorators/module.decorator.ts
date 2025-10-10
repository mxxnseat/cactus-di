import { Constructor } from "type-fest";

export const ModuleMetadataKey = "self:module";

export interface ModuleOptions {
  providers?: any[];
  imports?: Constructor<void>[];
  exports?: any[];
}

export const Module = (moduleOptions: ModuleOptions): ClassDecorator => {
  return (target: object) =>
    Reflect.defineMetadata(ModuleMetadataKey, moduleOptions, target);
};
