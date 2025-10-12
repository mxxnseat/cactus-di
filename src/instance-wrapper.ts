import { Provider } from "./interfaces";

export class InstanceWrapper {
  public instance: unknown = null;
  public isResolved: boolean = false;
  public isCreating: boolean = false;
  public isLazy: boolean = false;

  constructor(public readonly token: Provider) {}
}
