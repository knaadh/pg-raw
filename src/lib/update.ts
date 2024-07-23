import { buildUpdateQuery } from "./build";
import type { UpdateManyParams } from "./types";

export function updateMany(params: UpdateManyParams): string;
export function updateMany<T, R extends string = "none">(
	params: UpdateManyParams<T, R>,
): string;
export function updateMany<T = unknown, R extends string = "none">(
	params: UpdateManyParams<T, R>,
): string {
	const { table, query, relations = {} } = params;

	if (!table || typeof table !== "string" || !table.trim()) {
		throw new Error("Table name is missing or invalid.");
	}

	if (
		!query?.data ||
		typeof query.data !== "object" ||
		Array.isArray(query.data) ||
		!Object.keys(query.data).length
	) {
		throw new Error(
			"Data object cannot be empty, an array, or otherwise invalid.",
		);
	}

	return buildUpdateQuery(table, query, relations);
}
