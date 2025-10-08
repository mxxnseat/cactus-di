import { Injectable } from "../../../../src/decorators";
import { TestSuccessRootCircularDependency } from "./root";

@Injectable()
export class TestSuccessProvider {
  constructor(
    public readonly firstCircularDependency: TestSuccessRootCircularDependency
  ) {}
}
