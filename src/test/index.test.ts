import { describe, expect, it } from "bun:test";
import * as index from "../index";
import { deleteMany, findMany, insertMany, insertOne } from "../index";

describe("index", () => {
	it("should export findMany function", () => {
		expect(index.findMany).toBe(findMany);
	});

	it("should export deleteMany function", () => {
		expect(index.deleteMany).toBe(deleteMany);
	});

	it("should export insertOne function", () => {
		expect(index.insertOne).toBe(insertOne);
	});

	it("should export insertMany function", () => {
		expect(index.insertMany).toBe(insertMany);
	});

	it("should export updateMany function", () => {
		expect(index.updateMany).toBe(index.updateMany);
	});

	it("should export pgFn function", () => {
		expect(index.pgFn).toBe(index.pgFn);
	});

	it("should export raw function", () => {
		expect(index.raw).toBe(index.raw);
	});

	it("should export bindParams function", () => {
		expect(index.bindParams).toBe(index.bindParams);
	});

	it("should export quoteIdentifier function", () => {
		expect(index.quoteIdentifier).toBe(index.quoteIdentifier);
	});

	it("should export escapeStringLiteral function", () => {
		expect(index.escapeStringLiteral).toBe(index.escapeStringLiteral);
	});

	it("should export formatValue function", () => {
		expect(index.formatValue).toBe(index.formatValue);
	});
});
