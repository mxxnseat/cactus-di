import {
  designParamtypesMetadataKey,
  selfTypeMetadataKey,
  designTypeMetadataKey,
} from "../constants";
import { Provider } from "../interfaces";

export const LazyInjectTokenMetadataKey = "self:lazyInjectToken";

export function Inject(
  dependency?: { forwardRef: any } | Provider
): ParameterDecorator;
export function Inject(dependency?: Provider): PropertyDecorator;
export function Inject(
  dependency?: { forwardRef: any } | Provider
): ParameterDecorator & PropertyDecorator;

export function Inject(
  dependency?: { forwardRef: any } | Provider
): ParameterDecorator & PropertyDecorator {
  return (
    target: object,
    propertyKey: string | symbol | undefined,
    parameterIndex?: number
  ) => {
    if (typeof parameterIndex === "number") {
      const paramTypes =
        Reflect.getMetadata(designParamtypesMetadataKey, target) ?? [];
      paramTypes[parameterIndex] = dependency ?? paramTypes[parameterIndex];
      Reflect.defineMetadata(
        designParamtypesMetadataKey,
        paramTypes,
        target,
        propertyKey as string
      );
    } else if (propertyKey !== undefined) {
      const metadataDependency = Reflect.getMetadata(
        designTypeMetadataKey,
        target,
        propertyKey as string
      );
      const resolvedDependency = dependency ?? metadataDependency;
      Reflect.defineMetadata(
        LazyInjectTokenMetadataKey,
        true,
        resolvedDependency
      );
      const params = Reflect.getMetadata(selfTypeMetadataKey, target) ?? [];
      Reflect.defineMetadata(
        selfTypeMetadataKey,
        [...params, propertyKey],
        target
      );
    }
  };
}

export const forwardRef = (fn: () => any) => ({ forwardRef: fn });
