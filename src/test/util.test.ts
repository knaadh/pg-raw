import { describe, expect, it } from "bun:test";
import { findMany } from "../lib/find";
import { insertOne } from "../lib/insert";
import { updateMany } from "../lib/update";
import {
	bindParams,
	concat,
	connect,
	escapeStringLiteral,
	formatValue,
	pgFn,
	quoteIdentifier,
	raw,
} from "../lib/util";

describe("formatValue", () => {
	it("should add single quotes to the value if it is not already formatted", () => {
		const value = "it";
		const result = formatValue(value);
		expect(result).toBe("'it'");
	});

	it("should not add quotes to $1 as it is a parameter ", () => {
		const value = "$1";
		const result = formatValue(value);
		expect(result).toBe("$1");
	});

	it("should not add quotes to ${it} as it is a parameter ", () => {
		const value = "${it}";
		const result = formatValue(value);
		expect(result).toBe("${it}");
	});

	it("should not add quotes to :name as it is a parameter ", () => {
		const value = ":name";
		const result = formatValue(value);
		expect(result).toBe(":name");
	});

	it("should not add quotes to ? as it is a parameter ", () => {
		const value = "?";
		const result = formatValue(value);
		expect(result).toBe("?");
	});

	it("should escape string literals", () => {
		const input = "value's";
		const result = formatValue(input);
		expect(result).toEqual("'value''s'");
	});

	it("should return value as it is for a non-string value", () => {
		const input = 123;
		const result = formatValue(input);
		expect(result).toEqual(input);
	});

	it("should return formatted string for an array of strings", () => {
		const input = ["value1", "value2"];
		const result = formatValue(input);
		expect(result).toEqual("('value1', 'value2')");
	});

	it("should return formatted string for an array of numbers", () => {
		const input = [1, 2];
		const result = formatValue(input);
		expect(result).toEqual("(1, 2)");
	});

	it("should return formatted string for an array of mixed types", () => {
		const input = [1, null, "it", true];
		const result = formatValue(input);
		expect(result).toEqual("(1, NULL, 'it', true)");
	});

	it("should return NULL as it is", () => {
		const input = "NULL";
		const result = formatValue(input);
		expect(result).toEqual("NULL");
	});

	it("should return NOT NULL as it is", () => {
		const input = "NOT NULL";
		const result = formatValue(input);
		expect(result).toEqual("NOT NULL");
	});
});

describe("quoteIdentifier", () => {
	it('should add double quotes to column - "id"', () => {
		const value = "id";
		const result = quoteIdentifier(value);
		expect(result).toBe('"id"');
	});

	it('should add double quotes to table and column in "artist.name"', () => {
		const value = "artist.name";
		const result = quoteIdentifier(value);
		expect(result).toBe('"artist"."name"');
	});

	it('should add double quotes to schema, table and column in "public.artist.name"', () => {
		const value = "public.artist.name";
		const result = quoteIdentifier(value);
		expect(result).toBe('"public"."artist"."name"');
	});

	it("should add double quotes to *", () => {
		const value = "*";
		const result = quoteIdentifier(value);
		expect(result).toBe("*");
	});

	it("should not add quotes to the numeric string", () => {
		const value = "1";
		const result = quoteIdentifier(value);
		expect(result).toBe("1");
	});

	it("should not add quotes if there are parenthesis", () => {
		const value = "COUNT(price)";
		const result = quoteIdentifier(value);
		expect(result).toBe("COUNT(price)");
	});

	it('should not add quotes if string contains "("', () => {
		const value = "(price";
		const result = quoteIdentifier(value);
		expect(result).toBe("(price");
	});

	it('should not add quotes if string contains ")"', () => {
		const value = "price)";
		const result = quoteIdentifier(value);
		expect(result).toBe("price)");
	});

	it('should not add quotes to the named binding - ":var:"', () => {
		const value = ":name:";
		const result = quoteIdentifier(value);
		expect(result).toBe(":name:");
	});

	it('should not add quotes to the positional binding - "??"', () => {
		const value = "??";
		const result = quoteIdentifier(value);
		expect(result).toBe("??");
	});

	it('should not add quotes to the variable string - "${user}"', () => {
		const value = "${user}";
		const result = quoteIdentifier(value);
		expect(result).toBe("${user}");
	});

	it('should not add quotes to the variable containing dot - "${user.name}"', () => {
		const value = "${user.name}";
		const result = quoteIdentifier(value);
		expect(result).toBe("${user.name}");
	});

	it('should not add quotes to the word starting with "$"', () => {
		const value = "$user";
		const result = quoteIdentifier(value);
		expect(result).toBe("$user");
	});

	it('should not add quotes to the binding parameter - "$1"', () => {
		const value = "$1";
		const result = quoteIdentifier(value);
		expect(result).toBe("$1");
	});

	it("should not add quotes to the boolean", () => {
		const value = true;
		const result = quoteIdentifier(value);
		expect(result).toBe(true);
	});

	it("should not add quotes to the number", () => {
		const value = 1;
		const result = quoteIdentifier(value);
		expect(result).toBe(1);
	});

	it("should not add quotes when there is a raw flag", () => {
		const value = "RAW_FLAG:config->'allowed_regions'";
		const result = quoteIdentifier(value);
		expect(result).toBe("config->'allowed_regions'");
	});
});

describe("concat", () => {
	it("should concatenate table and column with a dot", () => {
		const table = "users";
		const column = "id";
		const result = concat(table, column);
		expect(result).toBe('"users"."id"');
	});

	it("should throw an error if the table name is empty", () => {
		const table = "";
		const column = "id";
		expect(() => concat(table, column)).toThrow(
			"Table and column names should not be empty",
		);
	});

	it("should throw an error if the column name is empty", () => {
		const table = "users";
		const column = "";
		expect(() => concat(table, column)).toThrow(
			"Table and column names should not be empty",
		);
	});

	it("should throw an error if both table and column names are empty", () => {
		const table = "";
		const column = "";
		expect(() => concat(table, column)).toThrow(
			"Table and column names should not be empty",
		);
	});

	it("should trim whitespace from table and column names", () => {
		const table = " users ";
		const column = " id ";
		const result = concat(table, column);
		expect(result).toBe('"users"."id"');
	});
});

describe("connect", () => {
	it("should concatenate and quote table.field and referenceTable.referenceField", () => {
		const table = "users";
		const field = "id";
		const referenceTable = "orders";
		const referenceField = "user_id";
		const result = connect(table, field, referenceTable, referenceField);
		expect(result).toBe('"users"."id" = "orders"."user_id"');
	});

	it("should handle table and field with underscores", () => {
		const table = "user_table";
		const field = "field_name";
		const referenceTable = "ref_table";
		const referenceField = "ref_field";
		const result = connect(table, field, referenceTable, referenceField);
		expect(result).toBe('"user_table"."field_name" = "ref_table"."ref_field"');
	});
});

describe("escapeStringLiteral", () => {
	// it for escaping backslashes
	it("escapes backslashes correctly", () => {
		expect(escapeStringLiteral("\\")).toBe("\\\\"); // Single backslash
		expect(escapeStringLiteral("a\\b")).toBe("a\\\\b"); // Backslash within text
	});

	// it for escaping single quotes
	it("escapes single quotes correctly", () => {
		expect(escapeStringLiteral("'")).toBe("''"); // Single quote
		expect(escapeStringLiteral("a'b")).toBe("a''b"); // Single quote within text
	});

	// it for escaping both backslashes and single quotes
	it("escapes both backslashes and single quotes correctly", () => {
		expect(escapeStringLiteral("\\'")).toBe("\\\\''"); // Backslash followed by single quote
		expect(escapeStringLiteral("a\\'b")).toBe("a\\\\''b"); // Backslash and single quote within text
	});

	// it for strings without any escapable characters
	it("returns the same string if there are no backslashes or single quotes", () => {
		expect(escapeStringLiteral("abc")).toBe("abc"); // Plain text
		expect(escapeStringLiteral("")).toBe(""); // Empty string
	});

	// it for complex strings containing multiple escapable characters
	it("handles complex strings correctly", () => {
		const input = "This is a it string with \\ and ' characters.";
		const expected = "This is a it string with \\\\ and '' characters.";
		expect(escapeStringLiteral(input)).toBe(expected); // Mixed text with backslash and single quote
	});
});

describe("pgFn", () => {
	it("formats the COUNT function correctly", () => {
		const result = pgFn("COUNT", "NULL");
		expect(result).toBe("COUNT(NULL)");
	});

	it("handles string literals and concatenation in CONCAT function", () => {
		const result = pgFn("CONCAT", "'John'", "' ' ||", "'Doe'");
		expect(result).toBe("CONCAT('John', ' ' ||, 'Doe')");
	});

	it("formats the SUM function with a column name", () => {
		const result = pgFn("SUM", "revenue");
		expect(result).toBe("SUM(revenue)");
	});

	it("handles numerical arguments correctly", () => {
		const result = pgFn("ADD", 5, 10);
		expect(result).toBe("ADD(5, 10)");
	});

	it("correctly identifies and formats multiple column names", () => {
		const result = pgFn("MAX", "age", "salary");
		expect(result).toBe("MAX(age, salary)");
	});

	it("handles mixed arguments (column names and literals)", () => {
		const result = pgFn("CONCAT", "firstName", "' '", "lastName");
		expect(result).toBe("CONCAT(firstName, ' ', lastName)");
	});

	it("should handle boolean arguments", () => {
		const result = pgFn("IS_BOOLEAN", true);
		expect(result).toBe("IS_BOOLEAN(true)");
	});
});

describe("raw", () => {
	it("should return a raw SQL string with interpolated values", () => {
		const type = "admin";
		const result = raw`SELECT * FROM users WHERE type = ${type}`;
		expect(result).toBe("RAW_FLAG:SELECT * FROM users WHERE type = admin");
	});

	it("should handle multiple values", () => {
		const result = raw`SELECT * FROM users WHERE id IN (${1}, ${2}, ${3})`;
		expect(result).toBe("RAW_FLAG:SELECT * FROM users WHERE id IN (1, 2, 3)");
	});

	it("should handle empty values", () => {
		const result = raw`SELECT * FROM users WHERE id = ${undefined}`;
		expect(result).toBe("RAW_FLAG:SELECT * FROM users WHERE id = ");
	});

	it("should handle no values", () => {
		const result = raw`SELECT * FROM users`;
		expect(result).toBe("RAW_FLAG:SELECT * FROM users");
	});
});

describe("bindParams", () => {
	it("should convert simple named parameters to numbered placeholders", () => {
		const result = bindParams(
			"SELECT * FROM users WHERE name = @userName AND age = @userAge LIMIT 1",
			{ userName: "John", userAge: 30 },
		);

		expect(result).toEqual({
			text: "SELECT * FROM users WHERE name = $1 AND age = $2 LIMIT 1",
			values: ["John", 30],
		});
	});

	it("should handle multiple occurrences of the same parameter", () => {
		const result = bindParams(
			"SELECT * FROM users WHERE name = @userName OR nickname = @userName",
			{ userName: "John" },
		);

		expect(result).toEqual({
			text: "SELECT * FROM users WHERE name = $1 OR nickname = $2",
			values: ["John", "John"],
		});
	});

	it("should support different value types", () => {
		const date = new Date("2023-01-01");
		const result = bindParams(
			"INSERT INTO logs (message, timestamp, is_error) VALUES (@message, @timestamp, @isError)",
			{
				message: "Test log",
				timestamp: date,
				isError: true,
			},
		);

		expect(result).toEqual({
			text: "INSERT INTO logs (message, timestamp, is_error) VALUES ($1, $2, $3)",
			values: ["Test log", date, true],
		});
	});

	it("should handle null values", () => {
		const result = bindParams(
			"SELECT * FROM users WHERE name = @userName AND email = @email",
			{ userName: "John", email: null },
		);

		expect(result).toEqual({
			text: "SELECT * FROM users WHERE name = $1 AND email = $2",
			values: ["John", null],
		});
	});

	it("should throw an error for missing parameters", () => {
		expect(() => {
			bindParams(
				"SELECT * FROM users WHERE name = '@userName' AND age = @userAge",
				{
					userName: "John",
				},
			);
		}).toThrow("Missing value for placeholder: @userAge");
	});

	it("should throw an error for empty query", () => {
		expect(() => {
			bindParams("", { userName: "John" });
		}).toThrow("Query text cannot be empty");
	});

	it("should handle complex queries with multiple parameter types", () => {
		const result = bindParams(
			"SELECT * FROM products WHERE price > @minPrice AND category = @category AND active = @isActive",
			{ minPrice: 10.99, category: "electronics", isActive: true },
		);

		expect(result).toEqual({
			text: "SELECT * FROM products WHERE price > $1 AND category = $2 AND active = $3",
			values: [10.99, "electronics", true],
		});
	});

	it("should return the same query and values if no parameters are found", () => {
		const result = bindParams("SELECT * FROM users", {});

		expect(result).toEqual({
			text: "SELECT * FROM users",
			values: [],
		});
	});

	it("should work with findMany query", () => {
		const query = findMany({
			table: "users",
			query: {
				select: {
					id: true,
					first_name: true,
					last_name: true,
				},
				where: {
					gender: "@gender::text",
				},
				limit: 10,
			},
		});
		const result = bindParams(query, { gender: "male", limit: 10 });

		expect(result).toEqual({
			text: 'SELECT "id", "first_name", "last_name" FROM "users" WHERE "gender" = $1::text LIMIT 10',
			values: ["male"],
		});
	});

	it("should work with InsertOne query", () => {
		const query = insertOne({
			table: "users",
			data: {
				first_name: "@first_name",
				last_name: "@last_name",
			},
		});
		const result = bindParams(query, { first_name: "John", last_name: "Snow" });

		expect(result).toEqual({
			text: 'INSERT INTO "users" ("first_name", "last_name") VALUES ($1, $2)',
			values: ["John", "Snow"],
		});
	});

	it("should work with updateMany query", () => {
		const query = updateMany({
			table: "users",
			query: {
				data: {
					first_name: "@first_name",
					last_name: "@last_name",
				},
				where: {
					id: "@id",
				},
			},
		});
		const result = bindParams(query, {
			first_name: "John",
			last_name: "Snow",
			id: 1,
		});

		expect(result).toEqual({
			text: 'UPDATE "users" SET "first_name" = $1, "last_name" = $2 WHERE "id" = $3',
			values: ["John", "Snow", 1],
		});
	});

	it("should bind identifiers correctly", () => {
		const result = bindParams(
			"SELECT @@id FROM products WHERE category = @category AND active = @isActive",
			{ id: "id", category: "electronics", isActive: true },
		);

		expect(result).toEqual({
			text: 'SELECT "id" FROM products WHERE category = $1 AND active = $2',
			values: ["electronics", true],
		});
	});

	it("should bind identifiers correctly for generated query", () => {
		const query = findMany({
			table: "users",
			query: {
				select: {
					id: true,
					first_name: true,
					last_name: true,
				},
				where: {
					"@@id": 1,
					age: "@age",
				},
			},
		});
		const result = bindParams(query, { id: "users.uid", age: 18 });

		expect(result).toEqual({
			text: 'SELECT "id", "first_name", "last_name" FROM "users" WHERE "users"."uid" = 1 AND "age" = $1',
			values: [18],
		});
	});

	it("should ignore invalid placeholders", () => {
		const query = findMany({
			table: "users",
			query: {
				select: {
					id: true,
					first_name: true,
					last_name: true,
				},
				where: {
					name: "@name",
					email: "user@email",
					type: "@type@rt",
				},
			},
		});
		const result = bindParams(query, { name: "John" });

		expect(result).toEqual({
			text: `SELECT "id", "first_name", "last_name" FROM "users" WHERE "name" = $1 AND "email" = 'user@email' AND "type" = '@type@rt'`,
			values: ["John"],
		});
	});

	it("should bind all three types of placeholders", () => {
		const query = findMany({
			table: "users",
			query: {
				select: {
					id: true,
					first_name: true,
					last_name: true,
				},
				where: {
					id: 1,
					"@@column": {
						"@@@operator": "@age",
					},
				},
			},
		});
		const result = bindParams(query, {
			column: "age",
			operator: ">",
			age: 18,
		});

		expect(result).toEqual({
			text: 'SELECT "id", "first_name", "last_name" FROM "users" WHERE "id" = 1 AND "age" > $1',
			values: [18],
		});
	});

	it("should bind raw value placeholder", () => {
		const result = bindParams(
			"SELECT id FROM products WHERE category @@@operator 'tech' AND active = true",
			{ operator: "=" },
		);

		expect(result).toEqual({
			text: `SELECT id FROM products WHERE category = 'tech' AND active = true`,
			values: [],
		});
	});
});
