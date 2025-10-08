export const InjectableMetadataKey = "injectable";

export const Injectable = (): ClassDecorator => {
  return (target) =>
    Reflect.defineMetadata(InjectableMetadataKey, true, target);
};
