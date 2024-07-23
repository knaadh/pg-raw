import { buildDeleteQuery } from "./build";
import type { DeleteManyParams } from "./types";

export function deleteMany(params: DeleteManyParams): string;
export function deleteMany<T, R extends string = "none">(
	params: DeleteManyParams<T, R>,
): string;
export function deleteMany<T = unknown, R extends string = "none">(
	params: DeleteManyParams<T, R>,
): string {
	const { table, query = {}, relations = {} } = params;
	return buildDeleteQuery<T, R>(table, query, relations);
}
