export const ModuleMetadataKey = "module";

export interface ModuleOptions {
  providers?: any[];
  imports?: new (...args: any[]) => unknown[];
  exports?: any[];
}

export const Module = (moduleOptions: ModuleOptions) => {
  return (target: Function) =>
    Reflect.defineMetadata(ModuleMetadataKey, moduleOptions, target);
};
