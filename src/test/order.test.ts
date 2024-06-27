import { describe, expect, it } from "bun:test";
import { order } from "../lib/order";
import type { OrderBy } from "../lib/types";

describe("order", () => {
	it("should return a valid SQL order by clause for a single field", () => {
		const orderBy: OrderBy = { name: "ASC" };
		const result = order(orderBy);
		expect(result).toBe('"name" ASC');
	});

	it("should return a valid SQL order by clause for multiple fields", () => {
		const orderBy: OrderBy = { name: "ASC", age: "DESC" };
		const result = order(orderBy);
		expect(result).toBe('"name" ASC, "age" DESC');
	});

	it("should handle an empty order object", () => {
		const orderBy: OrderBy = {};
		const result = order(orderBy);
		expect(result).toBe("");
	});

	it("should handle fields with different order types", () => {
		const orderBy: OrderBy = { name: "ASC", age: "DESC", createdAt: "ASC" };
		const result = order(orderBy);
		expect(result).toBe('"name" ASC, "age" DESC, "createdAt" ASC');
	});
});
