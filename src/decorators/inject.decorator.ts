import {
  designParamtypesMetadataKey,
  designTypeMetadataKey,
  selfDependenciesMetadataKey,
  selfPropertiesMetadataKey,
} from "../constants";
import { Provider } from "../interfaces";

export type InjectOptions =
  | {
      forwardRef?: () => Provider;
    }
  | Provider;

export function Inject(
  dependency?: InjectOptions
): ParameterDecorator & PropertyDecorator {
  const isArgumentsDefined = arguments.length > 0;
  return (
    target: object,
    propertyKey: string | symbol | undefined,
    parameterIndex?: number
  ) => {
    let type =
      dependency ??
      Reflect.getMetadata(designTypeMetadataKey, target, propertyKey!);
    if (!type && !isArgumentsDefined) {
      type = Reflect.getMetadata(
        designParamtypesMetadataKey,
        target,
        propertyKey!
      )?.[parameterIndex!];
    }

    if (parameterIndex !== undefined) {
      let dependencies =
        Reflect.getMetadata(selfDependenciesMetadataKey, target) ?? [];

      dependencies = [...dependencies, { index: parameterIndex, param: type }];
      Reflect.defineMetadata(selfDependenciesMetadataKey, dependencies, target);
      return;
    }

    let properties =
      Reflect.getMetadata(selfPropertiesMetadataKey, target.constructor) ?? [];

    properties = [...properties, { key: propertyKey!, type }];
    Reflect.defineMetadata(
      selfPropertiesMetadataKey,
      properties,
      target.constructor
    );
  };
}

export const forwardRef = (fn: () => any) => ({ forwardRef: fn });
