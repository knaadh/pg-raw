import { buildSelectQuery } from "./build";
import type { FindManyParams } from "./types";

export function findMany(params: FindManyParams): string;
export function findMany<T, R extends string = "none">(
	params: FindManyParams<T, R>,
): string;
export function findMany<T = unknown, R extends string = "none">(
	params: FindManyParams<T, R>,
): string {
	const { table, tableAlias, query, relations = {} } = params;
	return buildSelectQuery<T, R>(
		table,
		query,
		relations,
		false,
		undefined,
		tableAlias,
	);
}
