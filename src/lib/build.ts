import { group } from "./group";
import { join } from "./join";
import { order } from "./order";
import { select } from "./select";
import type {
	DeleteQuery,
	IncludeQuery,
	Relation,
	Relations,
	Select,
	SelectQuery,
	SqlParams,
	UpdateQuery,
} from "./types.ts";
import { connect, formatValue, quoteIdentifier } from "./util";
import { where } from "./where";

export function buildSelectQuery<T = unknown, R extends string = "none">(
	key: string,
	query: SelectQuery<T, R> | IncludeQuery<T, R>,
	relations: Relations,
	isNested = false,
	append?: {
		where?: string;
		join?: string;
	},
	tableAlias?: string,
): string {
	const columns: Select = {
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
		groupBy: query.groupBy as never,
		having: query.having,
		orderBy: query.orderBy,
		limit: query.limit,
		offset: query.offset,
		join: "",
		relations: relations,
	};

	// Handle include
	if (query.include) {
		for (const [relationName, relationQuery] of Object.entries(query.include)) {
			const relation = relations[relationName];
			if (!relation) {
				throw new Error(`Relation ${relationName} is not defined`);
			}
			const innerQuery = buildSelectQuery(
				relationName,
				relationQuery,
				relations,
				true,
				undefined,
				relation.tableAlias,
			);
			args.join += join("LEFT LATERAL", relation, innerQuery);
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
		args.select = `${select(columns, tableAlias ? `${quoteIdentifier(table)} AS ${quoteIdentifier(tableAlias)}` : table, "object", key)}`;
		let innerSql: string;

		if (relation.junction) {
			args.select = `${select(
				columns,
				relation.junction.table,
				"object",
				key,
			)}`;
			innerSql = sql(args, {
				join: ` LEFT JOIN ${quoteIdentifier(relation.tableAlias ? `${quoteIdentifier(relation.table)} AS ${quoteIdentifier(relation.tableAlias)}` : relation.table)} ON ${connect(
					relation.junction.table,
					relation.junction.field,
					relation.tableAlias || relation.table,
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
					relation.tableAlias || relation.table,
					relation.field,
					relation.referenceTable,
					relation.referenceField,
				)}`,
			});
		}

		if (relation.type === "MANY") {
			return `${select(columns, `(${innerSql})`, "aggregated", key)} `;
		}
		return `${select({ [key]: true }, `(${innerSql})`, "simple", key)} `;
	}

	// Build final select query for non-nested
	args.select = `${select(columns, tableAlias ? `${quoteIdentifier(key)} AS ${quoteIdentifier(tableAlias)}` : key)}`;

	// Return the SQL string with any additional append clauses
	return sql(args, append);
}

export function buildDeleteQuery<T = unknown, R extends string = "none">(
	table: string,
	query?: DeleteQuery<T, R>,
	relations?: Relations,
) {
	const args: SqlParams = {
		delete: `DELETE FROM ${quoteIdentifier(table)}`,
		where: query?.where || {},
		returning: (query?.returning || []) as never,
		relations: relations,
		join: "",
	};

	return sql(args);
}

export function buildUpdateQuery<T = unknown, R extends string = "none">(
	table: string,
	query: UpdateQuery<T, R>,
	relations?: Relations,
) {
	const args: SqlParams = {
		update: `UPDATE ${quoteIdentifier(table)} SET ${buildUpdateValues(query.data as never)}`,
		where: query?.where || {},
		returning: (query?.returning || []) as never,
		relations: relations,
	};

	return sql(args);
}

export function buildConflictUpdateQuery<
	T = unknown,
	R extends string = "none",
>(query: UpdateQuery<T, R>, relations?: Relations) {
	const args: SqlParams = {
		update: `DO UPDATE SET ${buildUpdateValues(query.data as never)}`,
		where: query?.where || {},
		returning: (query?.returning || []) as never,
		relations: relations,
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
	let sql = `${params?.select || params?.delete || params?.update || ""}`;
	if (append?.join) {
		sql += `${append?.join}`;
	}
	if (params.join) {
		sql += `${params.join}`;
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
	if (params.having && Object.keys(params.having).length > 0) {
		sql += ` HAVING ${where(params.having, "AND", params.relations || {})}`;
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

export function buildUpdateValues(data: Record<string, unknown>): string {
	return Object.entries(data)
		.map(([key, value]) => `${quoteIdentifier(key)} = ${formatValue(value)}`)
		.join(", ");
}
