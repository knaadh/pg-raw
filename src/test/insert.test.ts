import { describe, expect, it } from "bun:test";
import { insertMany, insertOne } from "../lib/insert";
import type { InsertManyParams, InsertOneParams } from "../lib/types";

describe("insertOne", () => {
	it("should generate a correct SQL query with valid inputs", () => {
		const params = {
			table: "users",
			data: { name: "John Doe", age: 30 },
			select: ["id", "name"],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30) RETURNING "id", "name"';
		expect(insertOne(params)).toBe(expectedQuery);
	});

	it("should generate a correct SQL query without select statement", () => {
		const params = {
			table: "users",
			data: { name: "John Doe", age: 30 },
			select: [],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30)';
		expect(insertOne(params)).toBe(expectedQuery);
	});

	it("should throw an error if table name is missing", () => {
		const params = {
			table: "",
			data: { name: "John Doe", age: 30 },
			select: [],
		};

		expect(() => insertOne(params)).toThrow("Table name is missing or invalid");
	});

	it("should throw an error if data object is empty", () => {
		const params = {
			table: "users",
			data: {},
			select: [],
		};

		expect(() => insertOne(params)).toThrow(
			"Data object cannot be empty or invalid",
		);
	});

	it("should throw an error if data is not an object", () => {
		const params = {
			table: "users",
			data: "invalid-data" as never,
			select: [],
		};

		expect(() => insertOne(params)).toThrow(
			"Data object cannot be empty or invalid",
		);
	});

	it("should throw an error if data is an array", () => {
		const params = {
			table: "users",
			data: [] as never,
			select: [],
		};

		expect(() => insertOne(params)).toThrow(
			"Data object cannot be empty or invalid",
		);
	});

	it("should handle null and undefined values correctly", () => {
		const params: InsertOneParams = {
			table: "users",
			data: { name: null, age: undefined },
			select: [],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (NULL, NULL)';
		expect(insertOne(params)).toBe(expectedQuery);
	});

	it("should escape single quotes in string values", () => {
		const params = {
			table: "users",
			data: { name: "Smith's" },
			select: [],
		};

		const expectedQuery =
			"INSERT INTO \"users\" (\"name\") VALUES ('Smith''s')";
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
			select: ["id", "name"],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30), (\'Jane Smith\', 25) RETURNING "id", "name"';
		expect(insertMany(params)).toBe(expectedQuery);
	});

	it("should generate a correct SQL query without select statement", () => {
		const params: InsertManyParams = {
			table: "users",
			data: [
				{ name: "John Doe", age: 30 },
				{ name: "Jane Smith", age: 25 },
			],
			select: [],
		};

		const expectedQuery =
			'INSERT INTO "users" ("name", "age") VALUES (\'John Doe\', 30), (\'Jane Smith\', 25)';
		expect(insertMany(params)).toBe(expectedQuery);
	});

	it("should throw an error if table name is missing", () => {
		const params: InsertManyParams = {
			table: "",
			data: [{ name: "John Doe", age: 30 }],
			select: [],
		};

		expect(() => insertMany(params)).toThrow(
			"Table name is missing or invalid",
		);
	});

	it("should throw an error if data is not an array", () => {
		const params: InsertManyParams = {
			table: "users",
			data: {} as never,
			select: [],
		};

		expect(() => insertMany(params)).toThrow("Data must be a non-empty array");
	});

	it("should throw an error if data array is empty", () => {
		const params: InsertManyParams = {
			table: "users",
			data: [],
			select: [],
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
			select: [],
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
			select: [],
		};

		const expectedQuery =
			"INSERT INTO \"users\" (\"name\", \"age\") VALUES ('Smith''s', 30), ('Jane Smith', 25)";
		expect(insertMany(params)).toBe(expectedQuery);
	});
});
