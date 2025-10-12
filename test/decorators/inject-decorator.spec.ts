import {
  selfDependenciesMetadataKey,
  selfPropertiesMetadataKey,
} from "../../src/constants";
import { Inject, Injectable } from "../../src/decorators";
import { expect } from "chai";

describe("InjectDecorator", () => {
  it(`should define ${selfDependenciesMetadataKey} metadata with empty arguments`, () => {
    @Injectable()
    class TestDependency {}

    @Injectable()
    class TestService {
      constructor(@Inject() private test1: TestDependency) {}
    }
    expect(
      Reflect.getMetadata(selfDependenciesMetadataKey, TestService)
    ).to.be.deep.equal([{ index: 0, param: TestDependency }]);
  });

  it(`should define ${selfDependenciesMetadataKey} metadata with arguments`, () => {
    @Injectable()
    class TestDependency {}

    @Injectable()
    class TestService {
      constructor(@Inject(TestDependency) private test1: {}) {}
    }

    expect(
      Reflect.getMetadata(selfDependenciesMetadataKey, TestService)
    ).to.be.deep.equal([{ index: 0, param: TestDependency }]);
  });

  it(`should define ${selfDependenciesMetadataKey} on constructor when @Inject used on properties`, () => {
    @Injectable()
    class TestDependency1 {}
    @Injectable()
    class TestDependency2 {}

    @Injectable()
    class TestService {
      @Inject(TestDependency1) private test1: any;
      @Inject(TestDependency2) private test2: any;
    }
    expect(
      Reflect.getMetadata(selfPropertiesMetadataKey, TestService)
    ).to.be.deep.equal([
      { key: "test1", type: TestDependency1 },
      { key: "test2", type: TestDependency2 },
    ]);
  });
});
