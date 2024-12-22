import { identifierRegex, valueRegex } from "./const";
import type { PgFunction } from "./types";

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

	if (typeof value === "string" && value.startsWith("RAW_FLAG:")) {
		return value.replace("RAW_FLAG:", "");
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

/**
 * Generates a PostgreSQL function call string.
 *
 * @param functionName - The name of the PostgreSQL function.
 * @param args - The arguments to pass to the PostgreSQL function, which can be strings (identifiers or literals) or numbers.
 * @returns The formatted PostgreSQL function call string.
 *
 * @example
 * // Returns: CONCAT("first_name", ' ', "last_name")
 * pgFn("CONCAT", "first_name", "' '", "last_name");
 */
export function pgFn(
	functionName: PgFunction | (string & {}),
	...args: (string | number)[]
): string {
	const formattedArgs = args
		.map((arg) => {
			if (typeof arg === "string") {
				// Check if arg is a column name or a string literal
				if (arg.match(/^[a-z0-9_]+$/i)) {
					return quoteIdentifier(arg);
				}
				return arg;
			}
			return arg.toString();
		})
		.join(", ");

	return `${functionName}(${formattedArgs})`;
}

/**
 * Constructs a raw SQL query string from template literals.
 *
 * This function takes a template literal and its values, and constructs a raw SQL query string.
 * It adds a `RAW_FLAG:` prefix to indicate that the resulting string is a raw SQL query.
 *
 * @param {TemplateStringsArray} strings - The template strings array.
 * @param {...unknown} values - The values to be interpolated into the template strings.
 * @returns {string} The constructed raw SQL query string prefixed with `RAW_FLAG:`.
 *
 * @example
 * const params: FindManyParams = {
 *  table: "employee",
 *  query: {
 *      select: {
 *          id: true,
 *          first_name: true,
 *          last_name: true,
 *      },
 *      where: {
 *          id: {
 *              IN: raw`(SELECT id from users WHERE type = 'employee')`,
 *          },
 *      },
 *      limit: 10,
 *  },
 * };
 */
export function raw(strings: TemplateStringsArray, ...values: unknown[]) {
	return `RAW_FLAG:${strings.reduce((acc, str, i) => acc + str + (values[i] || ""), "")}`;
}

/**
 * Binds named parameters to a SQL query, converting them to PostgreSQL's numbered placeholder format.
 *
 * This function transforms SQL queries that use `:paramName` style named placeholders
 * into PostgreSQL's numbered `$1, $2, ...` placeholder format, while collecting the
 * corresponding parameter values.
 *
 * @param sqlQuery - The original SQL query string containing named placeholders
 * @param paramValues - An object mapping placeholder names to their corresponding values
 * @returns An object with the modified query text and an ordered array of parameter values
 * @throws {Error} If the query is empty or a placeholder is missing a corresponding value
 *
 * @example
 * const result = bindParams(
 *   'SELECT * FROM users WHERE name = :userName AND age > :minAge',
 *   { userName: 'John', minAge: 25 }
 * );
 * // Returns: {
 * //   text: 'SELECT * FROM users WHERE name = $1 AND age > $2',
 * //   values: ['John', 25]
 * // }
 */
export function bindParams(
	sqlQuery: string,
	paramValues: Record<string, string | number | boolean | Date | null>,
): {
	text: string;
	values: (string | number | boolean | Date | null)[];
} {
	if (!sqlQuery) {
		throw new Error("Query text cannot be empty");
	}

	const values: (string | number | boolean | Date | null)[] = [];
	let parameterIndex = 0;

	// Replace named placeholders with PostgreSQL-style numbered placeholders
	const parametrizedQueryText = sqlQuery.replace(
		/:[a-zA-Z]\w*/g,
		(placeholder) => {
			const paramName = placeholder.slice(1);

			if (!(paramName in paramValues)) {
				throw new Error(`Missing value for placeholder: ${placeholder}`);
			}

			values.push(paramValues[paramName]);
			return `$${++parameterIndex}`;
		},
	);

	return { text: parametrizedQueryText, values };
}
