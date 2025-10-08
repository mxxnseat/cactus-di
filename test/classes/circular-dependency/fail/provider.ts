import { Injectable } from "../../../../src/decorators";
import { TestFailRootCircularDependency } from "./root";

@Injectable()
export class TestFailProvider {
  constructor(
    public readonly firstCircularDependency: TestFailRootCircularDependency
  ) {}
}
