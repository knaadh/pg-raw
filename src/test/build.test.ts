import { describe, expect, it } from "bun:test";

import {
	buildColumns,
	buildDeleteQuery,
	buildUpdateValues,
	buildValues,
	sql,
} from "../lib/build.ts";
import type {
	DeleteQuery,
	OrderBy,
	Relations,
	SqlParams,
} from "../lib/types.ts";

describe("sql", () => {
	it("should generate a basic select statement", () => {
		const params = { select: "SELECT * FROM table" };
		const result = sql(params);
		expect(result).toBe("SELECT * FROM table");
	});

	it("should generate a basic delete statement", () => {
		const params = { delete: "DELETE FROM table" };
		const result = sql(params);
		expect(result).toBe("DELETE FROM table");
	});

	it("should append join clauses", () => {
		const params = {
			select: "SELECT * FROM table",
			join: " JOIN other_table ON table.id = other_table.table_id",
		};
		const append = {
			join: " JOIN another_table ON table.id = another_table.table_id",
		};
		const result = sql(params, append);
		expect(result).toBe(
			"SELECT * FROM table JOIN another_table ON table.id = another_table.table_id JOIN other_table ON table.id = other_table.table_id",
		);
	});

	it("should append where conditions", () => {
		const params = { select: "SELECT * FROM table", where: { id: 1 } };
		const append = { where: 'name = "test"' };
		const result = sql(params, append);
		expect(result).toBe('SELECT * FROM table WHERE "id" = 1 AND name = "test"');
	});

	it("should add group by clause", () => {
		const params = { select: "SELECT * FROM table", groupBy: ["name"] };
		const result = sql(params);
		expect(result).toBe('SELECT * FROM table GROUP BY "name"');
	});

	it("should add order by clause", () => {
		const params = {
			select: "SELECT * FROM table",
			orderBy: { name: "ASC" } as OrderBy,
		};
		const result = sql(params);
		expect(result).toBe('SELECT * FROM table ORDER BY "name" ASC');
	});

	it("should add limit and offset", () => {
		const params = { select: "SELECT * FROM table", limit: 10, offset: 5 };
		const result = sql(params);
		expect(result).toBe("SELECT * FROM table LIMIT 10 OFFSET 5");
	});

	it("should handle placeholders in limit and offset", () => {
		const params = { select: "SELECT * FROM table", limit: "$1", offset: "$2" };
		const result = sql(params);
		expect(result).toBe("SELECT * FROM table LIMIT $1 OFFSET $2");
	});

	it("should add returning clause", () => {
		const params = { select: "SELECT * FROM table", returning: ["id", "name"] };
		const result = sql(params);
		expect(result).toBe('SELECT * FROM table RETURNING "id", "name"');
	});

	it("should handle a complex query", () => {
		const params: SqlParams = {
			select: "SELECT * FROM table",
			join: " JOIN other_table ON table.id = other_table.table_id",
			where: { id: 1 },
			groupBy: ["name"],
			having: {
				'COUNT("name")': 1,
			},
			orderBy: { name: "ASC" },
			limit: 10,
			offset: 5,
			returning: ["id", "name"],
		};
		const append = {
			join: " JOIN another_table ON table.id = another_table.table_id",
			where: 'other_table.name = "test"',
		};
		const result = sql(params, append);
		expect(result).toBe(
			`SELECT * FROM table JOIN another_table ON table.id = another_table.table_id JOIN other_table ON table.id = other_table.table_id WHERE "id" = 1 AND other_table.name = "test" GROUP BY "name" HAVING COUNT("name") = 1 ORDER BY "name" ASC LIMIT 10 OFFSET 5 RETURNING "id", "name"`,
		);
	});
});

describe("buildDeleteQuery", () => {
	it("should generate a basic delete query", () => {
		const table = "users";
		const result = buildDeleteQuery(table, {});
		const expected = 'DELETE FROM "users"';
		expect(result).toEqual(expected);
	});

	it("should generate a delete query with where clause", () => {
		const table = "users";
		const query: DeleteQuery = {
			where: {
				id: 1,
			},
		};
		const result = buildDeleteQuery(table, query);
		const expected = 'DELETE FROM "users" WHERE "id" = 1';
		expect(result).toEqual(expected);
	});

	it("should generate a complex delete query with relations", () => {
		const table = "users";
		const query: DeleteQuery = {
			where: {
				exists: {
					profile: {},
				},
			},
		};
		const relations: Relations = {
			profile: {
				type: "ONE",
				table: "profile",
				field: "user_id",
				referenceTable: "users",
				referenceField: "id",
			},
		};
		const result = buildDeleteQuery(table, query, relations);
		const expected =
			'DELETE FROM "users" WHERE EXISTS(SELECT 1 FROM "profile" WHERE "profile"."user_id" = "users"."id")';
		expect(result).toEqual(expected);
	});
});

describe("buildColumns", () => {
	it("should return a comma-separated string of quoted identifiers", () => {
		const columns = ["id", "name", "age"];
		const result = buildColumns(columns);
		expect(result).toBe('"id", "name", "age"');
	});

	it("should handle an empty array", () => {
		const columns: Array<unknown> = [];
		const result = buildColumns(columns);
		expect(result).toBe("");
	});

	it("should handle non-string values", () => {
		const columns = [123, "name", true];
		const result = buildColumns(columns);
		expect(result).toBe('123, "name", true');
	});
});

describe("buildValues", () => {
	it("should return a comma-separated string of formatted values", () => {
		const values = ["John", 25, true];
		const result = buildValues(values);
		expect(result).toBe("'John', 25, true");
	});

	it("should handle an empty array", () => {
		const values: Array<unknown> = [];
		const result = buildValues(values);
		expect(result).toBe("");
	});

	it("should handle different types of values", () => {
		const values = ["apple", 3.14, false];
		const result = buildValues(values);
		expect(result).toBe("'apple', 3.14, false");
	});
});

describe("buildUpdateValues", () => {
	it("should correctly format a simple object with string values", () => {
		const data = { name: "Alice", age: "30" };
		expect(buildUpdateValues(data)).toBe(`"name" = 'Alice', "age" = '30'`);
	});

	it("should correctly handle numeric and null values", () => {
		const data = { age: 25, status: null };
		expect(buildUpdateValues(data)).toBe(`"age" = 25, "status" = NULL`);
	});

	it("should handle special characters in strings", () => {
		const data = { bio: "O'Reilly" };
		expect(buildUpdateValues(data)).toBe(`"bio" = 'O''Reilly'`);
	});

	it("should return an empty string when data is an empty object", () => {
		const data = {};
		expect(buildUpdateValues(data)).toBe("");
	});

	it("should handle boolean values", () => {
		const data = { active: true, retired: false };
		expect(buildUpdateValues(data)).toBe(`"active" = true, "retired" = false`);
	});
});
