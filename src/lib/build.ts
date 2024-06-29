import { group } from "./group";
import { join } from "./join";
import { order } from "./order";
import { select } from "./select";
import type {
	DeleteQuery,
	IncludeQuery,
	Relation,
	Relations,
	SelectQuery,
	SqlParams,
} from "./types.ts";
import { connect, formatValue, quoteIdentifier } from "./util";
import { where } from "./where";

export function buildSelectQuery(
	key: string,
	query: SelectQuery | IncludeQuery,
	relations: Relations,
	isNested = false,
	append?: {
		where?: string;
		join?: string;
	},
): string {
	const columns = {
		...(query.select || {}),
	};
	// Directly mutate columns to include all keys from query.include
	for (const key of Object.keys(query.include || {})) {
		columns[key] = true;
	}

	const table = isNested ? relations[key].table : key;
	const args: SqlParams = {
		select: "",
		where: query.where,
		groupBy: query.groupBy,
		orderBy: query.orderBy,
		limit: query.limit,
		offset: query.offset,
		join: "",
		relations: relations,
	};

	// Handle include
	if (query.include) {
		for (const [relation, relationQuery] of Object.entries(query.include)) {
			if (!relations[relation]) {
				throw new Error(`Relation ${relation} is not defined`);
			}
			const innerQuery = buildSelectQuery(
				relation,
				relationQuery,
				relations,
				true,
			);
			args.join += join("LEFT LATERAL", relations[relation], innerQuery);
		}
	}

	// Handle left joins
	if (query.leftJoin) {
		for (const [relation, relationQuery] of Object.entries(query.leftJoin)) {
			if (!relations[relation]) {
				throw new Error(`Relation ${relation} is not defined`);
			}
			args.where = { ...args.where, ...(relationQuery?.where || {}) };
			args.join += join("LEFT", relations[relation]);
			Object.assign(columns, relationQuery.select || {});
		}
	}

	// Handle right joins
	if (query.rightJoin) {
		for (const [relation, relationQuery] of Object.entries(query.rightJoin)) {
			if (!relations[relation]) {
				throw new Error(`Relation ${relation} is not defined`);
			}
			args.where = { ...args.where, ...(relationQuery?.where || {}) };
			args.join += join("RIGHT", relations[relation]);
			Object.assign(columns, relationQuery.select || {});
		}
	}

	// Handle inner joins
	if (query.innerJoin) {
		for (const [relation, relationQuery] of Object.entries(query.innerJoin)) {
			if (!relations[relation]) {
				throw new Error(`Relation ${relation} is not defined`);
			}
			args.where = { ...args.where, ...(relationQuery?.where || {}) };
			args.join += join("INNER", relations[relation]);
			Object.assign(columns, relationQuery.select || {});
		}
	}

	// Handle full joins
	if (query.fullJoin) {
		for (const [relation, relationQuery] of Object.entries(query.fullJoin)) {
			if (!relations[relation]) {
				throw new Error(`Relation ${relation} is not defined`);
			}
			args.where = { ...args.where, ...(relationQuery?.where || {}) };
			args.join += join("FULL", relations[relation]);
			Object.assign(columns, relationQuery.select || {});
		}
	}

	// Handle nested queries
	if (isNested) {
		const relation: Relation = relations[key];
		args.select = `${select(columns, table, "object", key)}`;
		let innerSql: string;

		if (relation.junction) {
			args.select = `${select(
				columns,
				relation.junction.table,
				"object",
				key,
			)}`;
			innerSql = sql(args, {
				join: ` LEFT JOIN ${quoteIdentifier(relation.table)} ON ${connect(
					relation.junction.table,
					relation.junction.field,
					relation.table,
					relation.field,
				)}`,
				where: `${connect(
					relation.junction.table,
					relation.junction.referenceField,
					relation.referenceTable,
					relation.referenceField,
				)}`,
			});
		} else {
			innerSql = sql(args, {
				where: `${connect(
					relation.table,
					relation.field,
					relation.referenceTable,
					relation.referenceField,
				)}`,
			});
		}

		if (relation.type === "ONE") {
			return `${select({ [key]: true }, `(${innerSql})`, "simple", key)} `;
		}
		//if (relation.type === 'MANY' || relation.type === 'MANY-MANY') {
		return `${select(columns, `(${innerSql})`, "aggregated", key)} `;
		//}
		//return innerSql;
	}

	// Build final select query for non-nested
	args.select = `${select(columns, key)}`;

	// Return the SQL string with any additional append clauses
	return sql(args, append);
}

export function buildDeleteQuery(
	table: string,
	query: DeleteQuery,
	relations?: Relations,
) {
	const args: SqlParams = {
		delete: `DELETE FROM ${quoteIdentifier(table)}`,
		where: query.where,
		returning: query?.returning || [],
		relations: relations,
		join: "",
	};

	return sql(args);
}

export function sql(
	params: SqlParams,
	append?: {
		where?: string;
		join?: string;
	},
): string {
	let sql = `${params?.select || params?.delete || ""}`;
	if (params.join) {
		sql += `${params.join}`;
	}
	if (append?.join) {
		sql += `${append?.join}`;
	}
	if (params.where && Object.keys(params.where).length > 0) {
		sql += ` WHERE ${where(params.where, "AND", params.relations || {})}`;
	}
	if (append?.where) {
		sql += params.where ? ` AND ${append.where}` : ` WHERE ${append.where}`;
	}
	if (params.groupBy && params.groupBy.length > 0) {
		sql += ` GROUP BY ${group(params.groupBy)}`;
	}
	if (params.orderBy && Object.keys(params.orderBy).length > 0) {
		sql += ` ORDER BY ${order(params.orderBy)}`;
	}
	if (params.limit) {
		sql += ` LIMIT ${params.limit}`;
	}
	if (params.offset) {
		sql += ` OFFSET ${params.offset}`;
	}
	if (params.returning && params.returning.length > 0) {
		sql += ` RETURNING ${buildColumns(params.returning)}`;
	}
	return sql.trim();
}

/**
 * Quotes SQL identifiers in an array and joins them into a single comma-separated string.
 *
 * @param {Array<unknown>} columns - An array of column identifiers to be quoted.
 * @returns {string} - A comma-separated string of quoted column identifiers.
 */
export function buildColumns(columns: Array<unknown>): string {
	return columns.map((value) => quoteIdentifier(value)).join(", ");
}

/**
 * Quotes SQL values in an array and joins them into a single comma-separated string.
 *
 * @param {Array<unknown>} values - An array of values to be quoted.
 * @returns {string} - A comma-separated string of quoted values.
 */
export function buildValues(values: Array<unknown>): string {
	return values.map((value) => formatValue(value)).join(", ");
}
