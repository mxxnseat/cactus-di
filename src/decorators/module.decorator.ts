import { Constructor } from "type-fest";
import { Provider } from "../interfaces";
import { moduleMetadataKey } from "../constants";

export interface ModuleOptions {
  providers?: Provider[];
  imports?: Constructor<void>[];
  exports?: any[];
}

export const Module = (moduleOptions: ModuleOptions): ClassDecorator => {
  return (target: object) =>
    Reflect.defineMetadata(moduleMetadataKey, moduleOptions, target);
};
