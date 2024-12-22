import { buildColumns, buildConflictUpdateQuery, buildValues } from "./build";
import type { InsertManyParams, InsertOneParams } from "./types";
import { quoteIdentifier } from "./util";

export function insertOne(params: InsertOneParams): string;
export function insertOne<T, R extends string = "none">(
	params: InsertOneParams<T, R>,
): string;
export function insertOne<T = unknown, R extends string = "none">(
	params: InsertOneParams<T, R>,
): string {
	const { table, data, returning = [] } = params;

	if (!table || table.trim() === "") {
		throw new Error("Table name is missing or invalid");
	}

	if (
		!data ||
		typeof data !== "object" ||
		Array.isArray(data) ||
		Object.keys(data).length === 0
	) {
		throw new Error("Data object cannot be empty or invalid");
	}

	const columns = buildColumns(Object.keys(data));
	const values = buildValues(Object.values(data));
	const conflicts = params.onConflict
		? (() => {
				if ("columns" in params.onConflict) {
					return ` ON CONFLICT (${buildColumns(params.onConflict.columns)}) ${
						params.onConflict.action.type === "DO NOTHING"
							? "DO NOTHING"
							: `${buildConflictUpdateQuery(params.onConflict.action, params.relations)}`
					}`;
				}
				return ` ON CONFLICT ON CONSTRAINT ${quoteIdentifier(params.onConflict.constraint)} ${
					params.onConflict.action.type === "DO NOTHING"
						? "DO NOTHING"
						: `${buildConflictUpdateQuery(params.onConflict.action, params.relations)}`
				}`;
			})()
		: "";
	const _returning =
		returning.length > 0 ? ` RETURNING ${buildColumns(returning)}` : "";
	return `INSERT INTO ${quoteIdentifier(
		table,
	)} (${columns}) VALUES (${values})${conflicts}${_returning}`;
}

export function insertMany(params: InsertManyParams): string;
export function insertMany<T, R extends string = "none">(
	params: InsertManyParams<T, R>,
): string;
export function insertMany<T = unknown, R extends string = "none">(
	params: InsertManyParams<T, R>,
): string {
	const { table, data, returning = [] } = params;

	if (!table || table.trim() === "") {
		throw new Error("Table name is missing or invalid");
	}

	if (!Array.isArray(data) || data.length === 0) {
		throw new Error("Data must be a non-empty array");
	}

	const columns = buildColumns(Object.keys(data[0] as never));
	const values = data
		.map((row) => `(${buildValues(Object.values(row as never))})`)
		.join(", ");
	const conflicts = params.onConflict
		? (() => {
				if ("columns" in params.onConflict) {
					return ` ON CONFLICT (${buildColumns(params.onConflict.columns)}) ${
						params.onConflict.action.type === "DO NOTHING"
							? "DO NOTHING"
							: `${buildConflictUpdateQuery(params.onConflict.action, params.relations)}`
					}`;
				}
				return ` ON CONFLICT ON CONSTRAINT ${quoteIdentifier(params.onConflict.constraint)} ${
					params.onConflict.action.type === "DO NOTHING"
						? "DO NOTHING"
						: `${buildConflictUpdateQuery(params.onConflict.action, params.relations)}`
				}`;
			})()
		: "";
	const _returning =
		returning.length > 0 ? ` RETURNING ${buildColumns(returning)}` : "";
	return `INSERT INTO ${quoteIdentifier(
		table,
	)} (${columns}) VALUES ${values}${conflicts}${_returning}`;
}
