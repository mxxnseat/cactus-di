import { Injectable } from "../../../../src/decorators";
import { TestFailProvider } from "./provider";

@Injectable()
export class TestFailRootCircularDependency {
  constructor(public readonly testProvider: TestFailProvider) {}
}
