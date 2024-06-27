import { describe, expect, it } from "bun:test";
import { select } from "../lib/select";

describe("select", () => {
	it("should generate a simple SELECT query with column aliases", () => {
		const columns = { col1: true, col2: "alias2" };
		const result = select(columns, "table", "simple");
		expect(result).toBe('SELECT "col1", "alias2" AS "col2" FROM "table"');
	});

	it("should throw an error if dataKey is not provided for aggregated type", () => {
		const columns = {}; // columns are not used in aggregated type
		expect(() => select(columns, "table", "aggregated")).toThrow(
			"dataKey is required for aggregated and object types",
		);
	});

	it("should generate an aggregated SELECT query when dataKey is provided", () => {
		const columns = {}; // columns are not used in aggregated type
		const result = select(columns, "table", "aggregated", "aggKey");
		expect(result).toBe('SELECT jsonb_agg("aggKey") AS "aggKey" FROM "table"');
	});

	it("should throw an error if dataKey is not provided for object type", () => {
		const columns = { col1: true, col2: "alias2" };
		expect(() => select(columns, "table", "object")).toThrow(
			"dataKey is required for aggregated and object types",
		);
	});

	it("should generate an object SELECT query when dataKey is provided", () => {
		const columns = { col1: true, col2: "alias2" };
		const result = select(columns, "table", "object", "objKey");
		expect(result).toBe(
			`SELECT jsonb_build_object('col1', "col1", 'col2', "alias2") AS "objKey" FROM "table"`,
		);
	});

	it("should generate a simple SELECT query without column aliases", () => {
		const columns = { col1: true, col2: true };
		const result = select(columns, "table", "simple");
		expect(result).toBe('SELECT "col1", "col2" FROM "table"');
	});

	it("should handle the dataKey parameter for aliasing in a simple query but ignore it", () => {
		const columns = { col1: true, col2: "alias2" };
		const result = select(columns, "table", "simple", "keyAlias");
		expect(result).toBe('SELECT "col1", "alias2" AS "col2" FROM "table"');
	});
});
