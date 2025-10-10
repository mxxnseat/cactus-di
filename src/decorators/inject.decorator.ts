export const InjectMetadataKey = "self:inject";

export const Inject = (resolver?: { forwardRef: any }): ParameterDecorator => {
  return (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (resolver) {
      Reflect.defineMetadata(
        "design:paramtypes",
        [resolver],
        target,
        propertyKey as string
      );
    }
    return Reflect.defineMetadata(
      InjectMetadataKey,
      true,
      target,
      propertyKey as string
    );
  };
};

export const forwardRef = (fn: () => any) => ({ forwardRef: fn });
