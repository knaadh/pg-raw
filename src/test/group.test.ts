import { describe, expect, it } from "bun:test";
import { group } from "../lib/group";

describe("group", () => {
	it("should return an empty string when given an empty array", () => {
		expect(group([])).toBe("");
	});

	it("should return a single double-quoted column name when given an array with one element", () => {
		expect(group(["column1"])).toBe('"column1"');
	});

	it("should return a comma-separated string of double-quoted column names when given an array with multiple elements", () => {
		expect(group(["column1", "column2", "column3"])).toBe(
			'"column1", "column2", "column3"',
		);
	});
});
