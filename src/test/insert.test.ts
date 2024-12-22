import { describe, expect, it } from "bun:test";
import { insertMany, insertOne } from "../lib/insert";
import type { InsertManyParams, InsertOneParams } from "../lib/types";
import { raw } from "../lib/util";

describe("insertOne", () => {
	it("should generate a correct SQL query with valid inputs", () => {
		const params: InsertOneParams = {
			table: "users",
			data: { name: "John Doe", age: 30 },
			returning: ["id", "name"],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30) RETURNING "id", "name"';
		expect(insertOne(params)).toBe(expectedQuery);
	});

	it("should generate a correct SQL query without returning statement", () => {
		const params: InsertOneParams = {
			table: "users",
			data: { name: "John Doe", age: 30 },
			returning: [],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30)';
		expect(insertOne(params)).toBe(expectedQuery);
	});

	it("should throw an error if table name is missing", () => {
		const params: InsertOneParams = {
			table: "",
			data: { name: "John Doe", age: 30 },
			returning: [],
		};

		expect(() => insertOne(params)).toThrow("Table name is missing or invalid");
	});

	it("should throw an error if data object is empty", () => {
		const params: InsertOneParams = {
			table: "users",
			data: {},
			returning: [],
		};

		expect(() => insertOne(params)).toThrow(
			"Data object cannot be empty or invalid",
		);
	});

	it("should throw an error if data is not an object", () => {
		const params: InsertOneParams = {
			table: "users",
			data: "invalid-data" as never,
			returning: [],
		};

		expect(() => insertOne(params)).toThrow(
			"Data object cannot be empty or invalid",
		);
	});

	it("should throw an error if data is an array", () => {
		const params: InsertOneParams = {
			table: "users",
			data: [] as never,
			returning: [],
		};

		expect(() => insertOne(params)).toThrow(
			"Data object cannot be empty or invalid",
		);
	});

	it("should handle null and undefined values correctly", () => {
		const params: InsertOneParams = {
			table: "users",
			data: { name: null, age: undefined },
			returning: [],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (NULL, NULL)';
		expect(insertOne(params)).toBe(expectedQuery);
	});

	it("should escape single quotes in string values", () => {
		const params: InsertOneParams = {
			table: "users",
			data: { name: "Smith's" },
			returning: [],
		};

		const expectedQuery =
			"INSERT INTO \"users\" (\"name\") VALUES ('Smith''s')";
		expect(insertOne(params)).toBe(expectedQuery);
	});

	it("should generate a correct SQL query with ON CONFLICT for columns", () => {
		const params: InsertOneParams = {
			table: "users",
			data: { name: "John Doe", age: 30 },
			onConflict: {
				columns: ["id", "name"],
				action: { type: "DO NOTHING" },
			},
			returning: ["id", "name"],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30) ON CONFLICT ("id", "name") DO NOTHING RETURNING "id", "name"';
		expect(insertOne(params)).toBe(expectedQuery);
	});

	it("should generate a correct SQL query with ON CONFLICT for constraint", () => {
		const params: InsertOneParams = {
			table: "users",
			data: { name: "John Doe", age: 30 },
			onConflict: {
				constraint: "unique_users_name",
				action: { type: "DO NOTHING" },
			},
			returning: ["id", "name"],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30) ON CONFLICT ON CONSTRAINT "unique_users_name" DO NOTHING RETURNING "id", "name"';
		expect(insertOne(params)).toBe(expectedQuery);
	});

	it("should generate a correct SQL query with ON CONFLICT DO UPDATE clause", () => {
		const params: InsertOneParams = {
			table: "users",
			data: { name: "John Doe", age: 30 },
			onConflict: {
				columns: ["name"],
				action: { type: "DO UPDATE", data: { age: raw`EXCLUDED.age` } },
			},
			returning: ["id", "name"],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30) ON CONFLICT ("name") DO UPDATE SET "age" = EXCLUDED.age RETURNING "id", "name"';
		expect(insertOne(params)).toBe(expectedQuery);
	});

	it("should generate a correct SQL query with WHERE clause in ON CONFLICT clause", () => {
		const params: InsertOneParams = {
			table: "users",
			data: { name: "John Doe", age: 30 },
			onConflict: {
				columns: ["name"],
				action: {
					type: "DO UPDATE",
					data: { last_name: "Doe", age: 31 },
					where: { age: 40 },
				},
			},
			returning: ["id", "name"],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30) ON CONFLICT ("name") DO UPDATE SET "last_name" = \'Doe\', "age" = 31 WHERE "age" = 40 RETURNING "id", "name"';
		expect(insertOne(params)).toBe(expectedQuery);
	});
});

describe("insertMany", () => {
	it("should generate a correct SQL query with valid inputs", () => {
		const params: InsertManyParams = {
			table: "users",
			data: [
				{ name: "John Doe", age: 30 },
				{ name: "Jane Smith", age: 25 },
			],
			returning: ["id", "name"],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30), (\'Jane Smith\', 25) RETURNING "id", "name"';
		expect(insertMany(params)).toBe(expectedQuery);
	});

	it("should generate a correct SQL query without returning statement", () => {
		const params: InsertManyParams = {
			table: "users",
			data: [
				{ name: "John Doe", age: 30 },
				{ name: "Jane Smith", age: 25 },
			],
			returning: [],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30), (\'Jane Smith\', 25)';
		expect(insertMany(params)).toBe(expectedQuery);
	});

	it("should throw an error if table name is missing", () => {
		const params: InsertManyParams = {
			table: "",
			data: [{ name: "John Doe", age: 30 }],
			returning: [],
		};

		expect(() => insertMany(params)).toThrow(
			"Table name is missing or invalid",
		);
	});

	it("should throw an error if data is not an array", () => {
		const params: InsertManyParams = {
			table: "users",
			data: {} as never,
			returning: [],
		};

		expect(() => insertMany(params)).toThrow("Data must be a non-empty array");
	});

	it("should throw an error if data array is empty", () => {
		const params: InsertManyParams = {
			table: "users",
			data: [],
			returning: [],
		};

		expect(() => insertMany(params)).toThrow("Data must be a non-empty array");
	});

	it("should handle null and undefined values correctly", () => {
		const params: InsertManyParams = {
			table: "users",
			data: [
				{ name: null, age: undefined },
				{ name: "Jane Smith", age: 25 },
			],
			returning: [],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (NULL, NULL), (\'Jane Smith\', 25)';
		expect(insertMany(params)).toBe(expectedQuery);
	});

	it("should escape single quotes in string values", () => {
		const params: InsertManyParams = {
			table: "users",
			data: [
				{ name: "Smith's", age: 30 },
				{ name: "Jane Smith", age: 25 },
			],
			returning: [],
		};

		const expectedQuery =
			"INSERT INTO \"users\" (\"name\", \"age\") VALUES ('Smith''s', 30), ('Jane Smith', 25)";
		expect(insertMany(params)).toBe(expectedQuery);
	});

	it("should generate a correct SQL query with ON CONFLICT for columns", () => {
		const params: InsertManyParams = {
			table: "users",
			data: [
				{ name: "John Doe", age: 30 },
				{ name: "Jane Smith", age: 25 },
			],
			onConflict: {
				columns: ["id", "name"],
				action: { type: "DO NOTHING" },
			},
			returning: ["id", "name"],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30), (\'Jane Smith\', 25) ON CONFLICT ("id", "name") DO NOTHING RETURNING "id", "name"';
		expect(insertMany(params)).toBe(expectedQuery);
	});

	it("should generate a correct SQL query with ON CONFLICT for constraint", () => {
		const params: InsertManyParams = {
			table: "users",
			data: [
				{ name: "John Doe", age: 30 },
				{ name: "Jane Smith", age: 25 },
			],
			onConflict: {
				constraint: "unique_users_name",
				action: { type: "DO NOTHING" },
			},
			returning: ["id", "name"],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30), (\'Jane Smith\', 25) ON CONFLICT ON CONSTRAINT "unique_users_name" DO NOTHING RETURNING "id", "name"';
		expect(insertMany(params)).toBe(expectedQuery);
	});

	it("should generate a correct SQL query with WHERE clause in ON CONFLICT", () => {
		const params: InsertManyParams = {
			table: "users",
			data: [
				{ name: "Jane Austin", age: 50 },
				{ name: "James Doe", age: 30 },
			],
			onConflict: {
				columns: ["name"],
				action: {
					type: "DO UPDATE",
					data: { name: "Jane Doe" },
					where: { name: "Jane Austin" },
				},
			},
			returning: ["id", "name"],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'Jane Austin\', 50), (\'James Doe\', 30) ON CONFLICT ("name") DO UPDATE SET "name" = \'Jane Doe\' WHERE "name" = \'Jane Austin\' RETURNING "id", "name"';
		expect(insertMany(params)).toBe(expectedQuery);
	});
});
