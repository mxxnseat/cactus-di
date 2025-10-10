import { Inject } from "./inject.decorator";
import { Provider } from "../interfaces";
import { designParamtypesMetadataKey, selfTypeMetadataKey } from "../constants";

export const LazyInjectMetadataKey = "self:lazyInject";
export const LazyInjectTokenMetadataKey = "self:lazyInjectToken";

export const LazyInject = (token: any): PropertyDecorator => {
  return (target: Object, propertyKey: string | symbol) => {
    Reflect.defineMetadata(LazyInjectTokenMetadataKey, true, token);
    const params = Reflect.getMetadata(selfTypeMetadataKey, target) ?? [];
    Reflect.defineMetadata(
      selfTypeMetadataKey,
      [...params, propertyKey],
      target
    );
  };
};
