import { describe, it } from "mocha";
import { Container } from "../src/container";
import { Injectable, Module } from "../src/decorators";
import { expect } from "chai";
import {
  TestSuccessProvider,
  TestSuccessRootCircularDependency,
  TestFailProvider,
  TestFailRootCircularDependency,
} from "./classes/circular-dependency";
import { CircularDependencyError } from "../src/errors";

describe("Container", () => {
  it("should build module with no dependencies", () => {
    @Module({})
    class TestModule {}

    const container = new Container();

    container.create(TestModule);
  });

  it("should build module with dependencies", () => {
    @Injectable()
    class TestDependency {}

    @Injectable()
    class TestProvider {
      constructor(public readonly testDependency: TestDependency) {}
    }

    @Module({ providers: [TestProvider, TestDependency] })
    class TestModule {}

    const container = new Container();

    container.create(TestModule);

    expect(container.get(TestProvider)).to.be.instanceOf(TestProvider);
    expect(container.get(TestDependency)).to.be.instanceOf(TestDependency);
  });

  it("should throw an error when try to build module with circular dependencies", () => {
    @Module({ providers: [TestFailProvider, TestFailRootCircularDependency] })
    class TestModule {}

    const container = new Container();

    expect(() => container.create(TestModule)).throws(CircularDependencyError);
  });

  it("should build module with circular dependencies if the dependencies are injected with forwardRef", () => {
    @Module({
      providers: [TestSuccessProvider, TestSuccessRootCircularDependency],
    })
    class TestModule {}

    const container = new Container();
    container.create(TestModule);

    expect(container.get(TestSuccessProvider)).to.be.instanceOf(
      TestSuccessProvider
    );
    expect(container.get(TestSuccessRootCircularDependency)).to.be.instanceOf(
      TestSuccessRootCircularDependency
    );
  });
});
