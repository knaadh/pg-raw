import { buildColumns, buildValues } from "./build";
import type { InsertManyParams, InsertOneParams } from "./types";
import { quoteIdentifier } from "./util";

export function insertOne(params: InsertOneParams): string {
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
	const _returning =
		returning.length > 0 ? ` RETURNING ${buildColumns(returning)}` : "";
	return `INSERT INTO ${quoteIdentifier(
		table,
	)} (${columns}) VALUES (${values})${_returning}`;
}

export function insertMany(params: InsertManyParams): string {
	const { table, data, returning = [] } = params;

	if (!table || table.trim() === "") {
		throw new Error("Table name is missing or invalid");
	}

	if (!Array.isArray(data) || data.length === 0) {
		throw new Error("Data must be a non-empty array");
	}

	const columns = buildColumns(Object.keys(data[0]));
	const values = data
		.map((row) => `(${buildValues(Object.values(row))})`)
		.join(", ");
	const _returning =
		returning.length > 0 ? ` RETURNING ${buildColumns(returning)}` : "";
	return `INSERT INTO ${quoteIdentifier(
		table,
	)} (${columns}) VALUES ${values}${_returning}`;
}
