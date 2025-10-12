import { selfGlobalMetadataKey } from "../constants";

export const Global = (): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(selfGlobalMetadataKey, true, target);
  };
};
