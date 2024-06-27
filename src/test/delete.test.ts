import { describe, expect, it } from "bun:test";
import { deleteMany } from "../lib/delete.ts";

describe("delete", () => {
	it("should generate a basic delete query without conditions", () => {
		const result = deleteMany({
			table: "users",
			query: {},
		});
		const expected = 'DELETE FROM "users"';
		expect(result).toEqual(expected);
	});

	it("should generate a delete query with condition", () => {
		const result = deleteMany({
			table: "users",
			query: {
				where: {
					id: 1,
				},
			},
		});
		const expected = 'DELETE FROM "users" WHERE "id" = 1';
		expect(result).toEqual(expected);
	});
});
