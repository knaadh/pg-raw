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
});
