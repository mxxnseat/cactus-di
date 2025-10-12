import { expect } from "chai";
import { forwardRef, Inject, Injectable } from "../src/decorators";
import { Module } from "../src/decorators";
import { Container } from "../src/container";
import { UnreachableDependencyError } from "../src/errors/unreachable-dependency.error";
import { Global } from "../src/decorators/global.decorator";

describe("Container", () => {
  describe("basic", () => {
    it("should compile a module", () => {
      @Injectable()
      class TestService {}

      @Module({ providers: [TestService] })
      class TestModule {}

      @Module({ imports: [TestModule] })
      class RootModule {}

      const container = new Container();
      expect(() => container.create(RootModule)).to.not.throw();
      expect(container.get(TestService)).to.be.instanceOf(TestService);
    });

    it("should resolve a module with provider which has constructor dependency", () => {
      @Injectable()
      class TestDependency {}

      @Injectable()
      class TestService {
        constructor(public readonly testDependency: TestDependency) {}
      }

      @Module({ providers: [TestService, TestDependency] })
      class TestModule {}

      @Module({ imports: [TestModule] })
      class RootModule {}

      const container = new Container();
      expect(() => container.create(RootModule)).to.not.throw();
      expect(container.get(TestService)).to.be.instanceOf(TestService);
      expect(container.get(TestDependency)).to.be.instanceOf(TestDependency);
      expect(
        container.get<TestService>(TestService)?.testDependency
      ).to.be.instanceOf(TestDependency);
    });

    it("should throw an error if dependency not in providers", () => {
      @Injectable()
      class TestDependency {}

      @Injectable()
      class TestService {
        constructor(private readonly testDependency: TestDependency) {}
      }

      @Module({ providers: [TestService] })
      class TestModule {}

      @Module({ imports: [TestModule] })
      class RootModule {}

      const container = new Container();
      expect(() => container.create(RootModule)).to.throw(
        UnreachableDependencyError
      );
    });
  });
  describe("Resolve providers with @Inject", () => {
    it("should resolve provider by type", () => {
      @Injectable()
      class TestDependency {}

      @Injectable()
      class TestService {
        constructor(
          @Inject(TestDependency) public readonly testDependency: any
        ) {}
      }

      @Module({ providers: [TestService, TestDependency] })
      class RootModule {}

      const container = new Container();
      expect(() => container.create(RootModule)).to.not.throw();
      expect(container.get(TestService)).to.be.instanceOf(TestService);
      expect(container.get(TestDependency)).to.be.instanceOf(TestDependency);
      expect(
        container.get<TestService>(TestService)?.testDependency
      ).to.be.instanceOf(TestDependency);
    });

    it("should resolve all providers if @Inject and injection by type are used", () => {
      @Injectable()
      class TestDependency {}

      @Injectable()
      class TestDependency2 {}

      @Injectable()
      class TestService {
        constructor(
          @Inject(TestDependency) public readonly testDependency: any,
          public readonly testDependency2: TestDependency2
        ) {}
      }

      @Module({ providers: [TestService, TestDependency, TestDependency2] })
      class RootModule {}

      const container = new Container();
      expect(() => container.create(RootModule)).to.not.throw();
      expect(container.get(TestService)).to.be.instanceOf(TestService);
      expect(container.get(TestDependency)).to.be.instanceOf(TestDependency);
      expect(
        container.get<TestService>(TestService)?.testDependency
      ).to.be.instanceOf(TestDependency);
      expect(
        container.get<TestService>(TestService)?.testDependency2
      ).to.be.instanceOf(TestDependency2);
    });
  });
  describe("Forwards reference", () => {
    it("should resolve a forward reference", () => {
      @Injectable()
      class TestDependency {}

      @Injectable()
      class TestService {
        constructor(
          @Inject(forwardRef(() => TestDependency))
          public readonly testDependency: any
        ) {}
      }

      @Module({ providers: [TestService, TestDependency] })
      class RootModule {}

      const container = new Container();
      expect(() => container.create(RootModule)).to.not.throw();
      expect(container.get(TestService)).to.be.instanceOf(TestService);
      expect(container.get(TestDependency)).to.be.instanceOf(TestDependency);
      expect(
        container.get<TestService>(TestService)?.testDependency
      ).to.be.instanceOf(TestDependency);
    });

    it("should resolve circular dependency", () => {
      @Injectable()
      class TestDependency {
        constructor(
          @Inject(forwardRef(() => TestService))
          public readonly testService: any
        ) {}
      }

      @Injectable()
      class TestService {
        constructor(
          @Inject(TestDependency)
          public readonly testDependency: any
        ) {}
      }

      @Module({ providers: [TestService, TestDependency] })
      class RootModule {}

      const container = new Container();
      expect(() => container.create(RootModule)).to.not.throw();
      expect(container.get(TestService)).to.be.instanceOf(TestService);
      expect(container.get(TestDependency)).to.be.instanceOf(TestDependency);
      expect(
        container.get<TestDependency>(TestDependency)?.testService
      ).to.be.instanceOf(TestService);
      expect(
        container.get<TestService>(TestService)?.testDependency
      ).to.be.instanceOf(TestDependency);
    });

    it("should resolve circular dependency with biderectional forwardRef", () => {
      @Injectable()
      class TestDependency {
        constructor(
          @Inject(forwardRef(() => TestService))
          public readonly testService: any
        ) {}
      }

      @Injectable()
      class TestService {
        constructor(
          @Inject(forwardRef(() => TestDependency))
          public readonly testDependency: any
        ) {}
      }

      @Module({ providers: [TestService, TestDependency] })
      class RootModule {}

      const container = new Container();
      expect(() => container.create(RootModule)).to.not.throw();
      expect(container.get(TestService)).to.be.instanceOf(TestService);
      expect(container.get(TestDependency)).to.be.instanceOf(TestDependency);
      expect(
        container.get<TestDependency>(TestDependency)?.testService
      ).to.be.instanceOf(TestService);
      expect(
        container.get<TestService>(TestService)?.testDependency
      ).to.be.instanceOf(TestDependency);
    });
  });
  describe("Lazy", () => {
    it("should resolve a lazy provider", () => {
      @Injectable()
      class TestDependency {}

      @Injectable()
      class TestService {
        @Inject(TestDependency)
        public readonly testDependency: any;
      }

      @Module({ providers: [TestService, TestDependency] })
      class RootModule {}

      const container = new Container();
      expect(() => container.create(RootModule)).to.not.throw();
      expect(container.get(TestService)).to.be.instanceOf(TestService);
      expect(container.get(TestDependency)).to.be.not.instanceOf(
        TestDependency
      );
      expect(
        container.get<TestService>(TestService)?.testDependency
      ).to.be.instanceOf(TestDependency).to.be;
    });
    it("should resolve a lazy provider with forwardRef", () => {
      @Injectable()
      class TestDependency {}

      @Injectable()
      class TestService {
        @Inject(forwardRef(() => TestDependency))
        public readonly testDependency: any;
      }

      @Module({ providers: [TestService, TestDependency] })
      class RootModule {}

      const container = new Container();
      expect(() => container.create(RootModule)).to.not.throw();
      expect(container.get(TestService)).to.be.instanceOf(TestService);
      expect(container.get(TestDependency)).to.be.not.instanceOf(
        TestDependency
      );
      expect(
        container.get<TestService>(TestService)?.testDependency
      ).to.be.instanceOf(TestDependency).to.be;
    });
  });
  describe("Global", () => {
    it("should resolve a provider from global module", () => {
      @Injectable()
      class TestDependency {}

      @Injectable()
      class TestService {
        constructor(public readonly testDependency: TestDependency) {}
      }

      @Module({ providers: [TestService] })
      class TestModule {}

      @Global()
      @Module({ providers: [TestDependency], exports: [TestDependency] })
      class GlobalModule {}

      @Module({ imports: [GlobalModule, TestModule] })
      class RootModule {}

      const container = new Container();
      expect(() => container.create(RootModule)).to.not.throw();
      expect(container.get(TestDependency)).to.be.instanceOf(TestDependency);
      expect(container.get(TestService)).to.be.instanceOf(TestService);
      expect(
        container.get<TestService>(TestService)?.testDependency
      ).to.be.instanceOf(TestDependency);
    });
  });
});
