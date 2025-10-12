import { expect } from "chai";
import { Module } from "../../src/decorators";
import { moduleMetadataKey } from "../../src/constants";

describe("ModuleDecorator", () => {
  it(`should define ${moduleMetadataKey} metadata`, () => {
    @Module({})
    class TestModule {}

    expect(Reflect.getMetadata(moduleMetadataKey, TestModule)).to.be.deep.equal(
      {}
    );
  });

  it(`should define ${moduleMetadataKey} metadata with options`, () => {
    @Module({ imports: [], providers: [], exports: [] })
    class TestModule {}

    expect(Reflect.getMetadata(moduleMetadataKey, TestModule)).to.be.deep.equal(
      { imports: [], providers: [], exports: [] }
    );
  });
});
