import { describe, expect, it } from "bun:test";
import { updateMany } from "../lib/update";

describe("updateMany", () => {
	it("should throw an error if the table name is missing or invalid", () => {
		expect(() =>
			updateMany({
				table: "",
				query: {
					data: {},
				},
			}),
		).toThrow("Table name is missing or invalid");
	});

	it("should throw an error if the data is invalid", () => {
		expect(() =>
			updateMany({
				table: "users",
				query: {
					data: {},
				},
			}),
		).toThrow("Data object cannot be empty, an array, or otherwise invalid.");
	});

	it("should generate a simple update query", () => {
		const result = updateMany({
			table: "users",
			query: {
				data: {
					verified: true,
					status: "active",
				},
			},
		});
		const expected = `UPDATE "users" SET "verified" = true, "status" = 'active'`;
		expect(result).toEqual(expected);
	});

	it("should generate a update query with condition", () => {
		const result = updateMany({
			table: "users",
			query: {
				data: {
					verified: true,
					status: "active",
				},
				where: {
					id: 1,
				},
			},
		});
		const expected = `UPDATE "users" SET "verified" = true, "status" = 'active' WHERE "id" = 1`;
		expect(result).toEqual(expected);
	});
});
