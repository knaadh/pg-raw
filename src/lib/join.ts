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
	if (relation.junction) {
		return ` ${type} JOIN ${quoteIdentifier(
			relation.junction.table,
		)} ON ${connect(
			relation.junction.table,
			relation.junction.referenceField,
			relation.referenceTable,
			relation.referenceField,
		)} ${type} JOIN ${quoteIdentifier(relation.table)} ON ${connect(
			relation.junction.table,
			relation.junction.field,
			relation.table,
			relation.field,
		)}`;
	}
	return ` ${type} JOIN ${quoteIdentifier(relation.table)} ON ${connect(
		relation.table,
		relation.field,
		relation.referenceTable,
		relation.referenceField,
	)}`;
}
