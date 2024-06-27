import { identifierRegex, valueRegex } from "./const";

/**
 * Formats a value for use in a SQL query.
 *
 * @param value - The value to format.
 * @returns The formatted value.
 */
export function formatValue(value: unknown): unknown {
	if (value === null || value === undefined) {
		return "NULL";
	}

	if (Array.isArray(value)) {
		return `(${value
			.map((item) =>
				item === null || item === undefined
					? "NULL"
					: typeof item === "string"
						? `'${escapeStringLiteral(item)}'`
						: item,
			)
			.join(", ")})`;
	}
	return typeof value === "string" && !valueRegex.test(value)
		? `'${escapeStringLiteral(value)}'`
		: value;
}

/**
 * Quotes an identifier by wrapping it in double quotes.
 *
 * @param identifier - The identifier to be quoted.
 * @returns The quoted identifier.
 */
export function quoteIdentifier(identifier: unknown): unknown {
	if (typeof identifier === "string" && !Number.isNaN(Number(identifier))) {
		// If the input is a string representation of a number, return it as is
		return identifier;
	}
	if (
		typeof identifier === "string" &&
		!identifierRegex.test(identifier) &&
		identifier !== "*"
	) {
		// If the input is a single word string, process it as before
		const parts = identifier
			.split(".")
			.map((part: string) => (part !== "*" ? `"${part}"` : part));
		return parts.join(".");
	}
	// Otherwise, return the input as is
	return identifier;
}

/**
 * Escapes backslashes and single quotes in a string for SQL queries.
 *
 * @param {string} str - The input string to be escaped.
 * @returns {string} - The escaped string.
 */
export function escapeStringLiteral(str: string): string {
	return str.replace(/\\/g, "\\\\").replace(/'/g, "''");
}

/**
 * Concatenates and quotes the identifiers for table, field, referenceTable, and referenceField.
 *
 * @param table - The name of the table.
 * @param field - The name of the field in the table.
 * @param referenceTable - The name of the reference table.
 * @param referenceField - The name of the field in the reference table.
 * @returns A string representing the concatenated and quoted identifiers for comparison.
 */
export function connect(
	table: string,
	field: string,
	referenceTable: string,
	referenceField: string,
) {
	return `${quoteIdentifier(`${table}.${field}`)} = ${quoteIdentifier(
		`${referenceTable}.${referenceField}`,
	)}`;
}

/**
 * Concatenates the provided table and column names with a dot in between.
 *
 * @param table - The name of the table to concatenate.
 * @param column - The name of the column to concatenate.
 * @returns A string representing the concatenated table and column in the format: "table"."column".
 * @throws Throws an error if either the table or column name is empty.
 */
export function concat(table: string, column: string): string {
	// Trim whitespace from table and column
	const trimmedTable = table.trim();
	const trimmedColumn = column.trim();

	// Check if both table and column are non-empty
	if (trimmedTable === "" || trimmedColumn === "") {
		throw new Error("Table and column names should not be empty");
	}

	return `"${trimmedTable}"."${trimmedColumn}"`;
}
