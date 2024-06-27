import { buildSelectQuery } from "./build";
import type { FindManyParams } from "./types";

export function findMany(params: FindManyParams): string {
	const { table, query, relations = {} } = params;
	return buildSelectQuery(table, query, relations, false);
}
