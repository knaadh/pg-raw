import { buildDeleteQuery } from "./build";
import type { DeleteManyParams } from "./types";

export function deleteMany(params: DeleteManyParams): string {
	const { table, query = {}, relations = {} } = params;
	return buildDeleteQuery(table, query, relations);
}
