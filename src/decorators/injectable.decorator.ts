import { injectableMetadataKey } from "../constants";

export const Injectable = (): ClassDecorator => {
  return (target) =>
    Reflect.defineMetadata(injectableMetadataKey, true, target);
};
