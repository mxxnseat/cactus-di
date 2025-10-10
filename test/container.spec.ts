import { describe, it } from "mocha";
import sinon from "sinon";
import { Container } from "../src/container";
import { Inject, Injectable, Module } from "../src/decorators";
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

  it("should build module with nested modules", () => {
    @Module({})
    class TestNestedModule {}

    @Module({
      imports: [TestNestedModule],
    })
    class TestModule {}

    const container = new Container();
    container.create(TestModule);

    expect(container).to.be.instanceOf(Container);
  });

  it("should not get provider from nested module if it is not exported", () => {
    @Injectable()
    class TestNestedDependency {}

    @Module({
      providers: [TestNestedDependency],
    })
    class TestNestedModule {}

    @Module({
      imports: [TestNestedModule],
    })
    class TestModule {}

    const container = new Container();
    container.create(TestModule);

    expect(container.get(TestNestedDependency)).to.be.null;
  });

  it("should get provider from nested module if it is exported", () => {
    @Injectable()
    class TestNestedDependency {}

    @Module({
      providers: [TestNestedDependency],
      exports: [TestNestedDependency],
    })
    class TestNestedModule {}

    @Module({
      imports: [TestNestedModule],
    })
    class TestModule {}

    const container = new Container();
    container.create(TestModule);

    expect(container.get(TestNestedDependency)).to.be.instanceOf(
      TestNestedDependency
    );
  });

  it("should build dependencies only once for nested modules", () => {
    const spy = sinon.spy();

    @Injectable()
    class TestNestedDependency {
      constructor() {
        spy();
      }
    }

    @Module({
      providers: [TestNestedDependency],
    })
    class TestNestedModule {}

    @Module({
      imports: [TestNestedModule],
      providers: [TestNestedDependency],
    })
    class TestModule {}

    const container = new Container();
    container.create(TestModule);

    expect(spy.calledOnce).to.be.true;
  });

  it("should resolve provider only when it's actually used", () => {
    @Injectable()
    class TestDependency {
      constructor() {}
    }

    @Injectable()
    class TestProvider {
      // @ts-ignore
      @Inject(TestDependency)
      testDependency!: TestDependency;

      public resolve() {
        this.testDependency;
      }
    }

    @Module({ providers: [TestProvider, TestDependency] })
    class TestModule {}

    const container = new Container();
    container.create(TestModule);
    expect(container.get(TestDependency)).to.be.null;

    const provider = container.get<any>(TestProvider);
    provider.resolve();

    expect(provider.testDependency).to.be.instanceOf(TestDependency);
  });

  it("should resolve providers by interface", () => {
    @Injectable()
    class TestDependency implements ITestDependency {
      constructor() {}

      public test() {}
    }

    interface ITestDependency {
      test(): void;
    }
    @Injectable()
    class TestProvider {
      constructor(
        @Inject(TestDependency) public readonly testDependency: ITestDependency
      ) {}
    }

    @Module({ providers: [TestProvider, TestDependency] })
    class TestModule {}

    const container = new Container();
    container.create(TestModule);

    expect(container.get<any>(TestProvider).testDependency).to.be.instanceOf(
      TestDependency
    );
  });

  it("should inject two providers", () => {
    @Injectable()
    class TestDependency {
      constructor() {}
    }

    @Injectable()
    class TestDependency2 {
      constructor() {}
    }

    @Injectable()
    class TestProvider {
      constructor(
        public readonly testDependency: TestDependency,
        public readonly testDependency2: TestDependency2
      ) {}
    }

    @Module({ providers: [TestProvider, TestDependency, TestDependency2] })
    class TestModule {}

    const container = new Container();
    container.create(TestModule);

    expect(container.get<any>(TestProvider).testDependency).to.be.instanceOf(
      TestDependency
    );
    expect(container.get<any>(TestProvider).testDependency2).to.be.instanceOf(
      TestDependency2
    );
  });

  it("should inject two providers using explicit inject", () => {
    @Injectable()
    class TestDependency {
      constructor() {}
    }

    @Injectable()
    class TestDependency2 {
      constructor() {}
    }

    @Injectable()
    class TestProvider {
      constructor(
        @Inject(TestDependency) public readonly testDependency: TestDependency,
        @Inject(TestDependency2)
        public readonly testDependency2: TestDependency2
      ) {}
    }

    @Module({ providers: [TestProvider, TestDependency, TestDependency2] })
    class TestModule {}

    const container = new Container();
    container.create(TestModule);

    expect(container.get<any>(TestProvider).testDependency).to.be.instanceOf(
      TestDependency
    );
    expect(container.get<any>(TestProvider).testDependency2).to.be.instanceOf(
      TestDependency2
    );
  });
});
