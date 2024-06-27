import { describe, expect, it } from "bun:test";
import {
	concat,
	connect,
	escapeStringLiteral,
	formatValue,
	quoteIdentifier,
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
