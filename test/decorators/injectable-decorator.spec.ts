import { expect } from "chai";
import { Injectable } from "../../src/decorators";
import { injectableMetadataKey } from "../../src/constants";

describe("InjectableDecorator", () => {
  it(`should define ${injectableMetadataKey} metadata`, () => {
    @Injectable()
    class TestService {}

    expect(Reflect.getMetadata(injectableMetadataKey, TestService)).to.be.true;
  });
});
