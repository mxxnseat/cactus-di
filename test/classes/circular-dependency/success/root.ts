import { forwardRef, Inject, Injectable } from "../../../../src/decorators";
import { TestSuccessProvider } from "./provider";

@Injectable()
export class TestSuccessRootCircularDependency {
  constructor(
    @Inject(forwardRef(() => TestSuccessProvider))
    public readonly testProvider: TestSuccessProvider
  ) {}
}
