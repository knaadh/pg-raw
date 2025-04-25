import type { Relation } from "./types";
import { connect, quoteIdentifier } from "./util";

export function join(
	type: "LEFT" | "RIGHT" | "INNER" | "FULL" | "LEFT LATERAL",
	relation: Relation,
	query?: string,
): string {
	if (type === "LEFT LATERAL") {
		if (!query) {
			return "";
		}
		return ` LEFT JOIN LATERAL (${query}) ON TRUE`;
	}
	const table = relation.tableAlias
		? `${quoteIdentifier(relation.table)} AS ${quoteIdentifier(relation.tableAlias)}`
		: quoteIdentifier(relation.table);

	if (relation.junction) {
		return ` ${type} JOIN ${quoteIdentifier(
			relation.junction.table,
		)} ON ${connect(
			relation.junction.table,
			relation.junction.referenceField,
			relation.referenceTable,
			relation.referenceField,
		)} ${type} JOIN ${table} ON ${connect(
			relation.junction.table,
			relation.junction.field,
			relation.tableAlias || relation.table,
			relation.field,
		)}`;
	}
	return ` ${type} JOIN ${table} ON ${connect(
		relation.tableAlias || relation.table,
		relation.field,
		relation.referenceTable,
		relation.referenceField,
	)}`;
}
