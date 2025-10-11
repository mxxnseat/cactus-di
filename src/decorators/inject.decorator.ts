import {
  designParamtypesMetadataKey,
  selfTypeMetadataKey,
  designTypeMetadataKey,
} from "../constants";
import { Provider } from "../interfaces";

export const LazyInjectTokenMetadataKey = "self:lazyInjectToken";

function resolveDependency(dependency?: { forwardRef: any } | Provider): any {
  return dependency
    ? "forwardRef" in dependency
      ? dependency.forwardRef()
      : dependency
    : undefined;
}

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
      const resolvedDependency =
        resolveDependency(dependency) ?? metadataDependency;

      Reflect.defineMetadata(
        designTypeMetadataKey,
        resolvedDependency,
        target,
        propertyKey as string
      );
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
