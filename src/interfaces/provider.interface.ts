import { Constructor } from "type-fest";

export type Provider = Constructor<unknown>;

export type Dependency =
  | {
      forwardRef: () => Provider;
    }
  | Provider;

export type SelfDefinedDependency = {
  index: number;
  param: Dependency;
};

export type SelfDefinedProperty = {
  key: string;
  type: Dependency;
};
