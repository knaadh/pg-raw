import { buildSelectQuery } from "./build";

import {
	Operators,
	type QueryWhereCondition,
	type Relations,
	type SelectQuery,
	type SubQuery,
	type SubQueryExpression,
} from "./types.ts";
import { connect, formatValue, quoteIdentifier } from "./util";

export function where(
	conditions: QueryWhereCondition,
	logic: "OR" | "AND" | "NOT" = "AND",
	relations: Relations = {},
): string {
	const whereClauses: string[] = [];
	for (const [field, value] of Object.entries(conditions)) {
		if (field === "OR" || field === "AND" || field === "NOT") {
			handleLogicalOperator(field, value, relations, whereClauses);
			continue;
		}

		if (field === "exists") {
			handleExistOperator(value, relations, whereClauses);
			continue;
		}

		if (isFieldValueAnObject(value)) {
			handleFieldValueObject(field, value, relations, whereClauses);
		} else {
			whereClauses.push(`${quoteIdentifier(field)} = ${formatValue(value)}`);
		}
	}
	return whereClauses.join(` ${logic} `);
}

function isFieldValueAnObject(value: unknown): boolean {
	return typeof value === "object" && value !== null;
}

function handleFieldValueObject(
	field: string,
	value: object,
	relations: Relations,
	whereClauses: string[],
) {
	for (const [operator, fieldValue] of Object.entries(value)) {
		switch (operator) {
			case "in":
			case "notIn":
				if (!Array.isArray(fieldValue)) {
					handleInSubquery(
						field,
						operator,
						fieldValue as Record<string, SubQuery>,
						relations,
						whereClauses,
					);
				} else {
					whereClauses.push(
						`${quoteIdentifier(field)} ${
							Operators[operator as keyof typeof Operators]
						} (${fieldValue.map(formatValue).join(", ")})`,
					);
				}
				break;
			case "between":
			case "notBetween":
				if (Array.isArray(fieldValue)) {
					handleBetweenOperator(operator, field, fieldValue, whereClauses);
				} else {
					throw new Error(`Expected an array for '${operator}' operator`);
				}
				break;
			default:
				if (isFieldValueAnObject(fieldValue)) {
					handleSomeAnySubQuery(
						field,
						operator,
						fieldValue as SubQueryExpression,
						relations,
						whereClauses,
					);
				} else {
					whereClauses.push(
						`${quoteIdentifier(field)} ${
							Operators[operator as keyof typeof Operators]
						} ${formatValue(fieldValue)}`,
					);
				}
		}
	}
}

function handleBetweenOperator(
	operator: string,
	field: string,
	value: Array<unknown>,
	whereClauses: string[],
) {
	whereClauses.push(
		`${quoteIdentifier(field)} ${
			Operators[operator as keyof typeof Operators]
		} ${value.map((item: unknown) => formatValue(item)).join(" AND ")}`,
	);
	return;
}

function handleLogicalOperator(
	operator: "OR" | "AND" | "NOT",
	value: QueryWhereCondition | QueryWhereCondition[],
	relations: Relations,
	whereClauses: string[],
) {
	if (operator === "NOT") {
		whereClauses.push(
			`NOT(${where(value as QueryWhereCondition, "AND", relations)})`,
		);
		return;
	}
	const subWhereClauses: string[] = [];
	for (const condition of value as QueryWhereCondition[]) {
		subWhereClauses.push(`${where(condition, operator, relations)}`);
	}
	whereClauses.push(`(${subWhereClauses.join(` ${operator} `)})`);
	return;
}

function handleExistOperator(
	value: Record<string, SubQuery>,
	relations: Relations,
	whereClauses: string[],
) {
	const existClauses: string[] = [];
	for (const [key, subquery] of Object.entries(value)) {
		existClauses.push(`${whereSubQuery("EXISTS", subquery, key, relations)}`);
	}
	whereClauses.push(existClauses.join(" AND "));
	return;
}

function handleSomeAnySubQuery(
	field: string,
	operator: string,
	value: SubQueryExpression,
	relations: Relations,
	conditions: string[],
) {
	for (const [expression, queries] of Object.entries(value)) {
		for (const [key, subquery] of Object.entries(queries)) {
			conditions.push(
				`${quoteIdentifier(field)} ${
					Operators[operator as keyof typeof Operators]
				} ${whereSubQuery(
					expression === "some" ? "SOME" : "ALL",
					subquery as SubQuery,
					key,
					relations,
				)}`,
			);
		}
	}
	return;
}

function handleInSubquery(
	field: string,
	operator: string,
	value: Record<string, SubQuery>,
	relations: Relations,
	whereClauses: string[],
) {
	for (const [key, subquery] of Object.entries(value)) {
		whereClauses.push(
			`${quoteIdentifier(field)} ${whereSubQuery(
				Operators[operator as keyof typeof Operators],
				subquery as SubQuery,
				key,
				relations,
			)}`,
		);
	}
	return;
}

function whereSubQuery(
	type: "EXISTS" | "SOME" | "ALL" | Operators,
	query: SubQuery,
	relationKey: string,
	relations: Relations,
) {
	if (!query.table && !relations[relationKey]) {
		throw new Error(`Relationship ${relationKey} is not defined`);
	}

	const subquery: SelectQuery =
		type === "EXISTS" ? { ...query, select: { 1: true } } : { ...query };
	if (query.table) {
		return `${type}(${buildSelectQuery(
			query.table,
			subquery,
			relations,
			false,
		)})`;
	}

	const relation = relations[relationKey];

	if (relation.type === "MANY-MANY") {
		return `${type}(${buildSelectQuery(
			relation.junction.table,
			subquery,
			relations,
			false,
			{
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
			},
		)} )`;
	}
	return `${type}(${buildSelectQuery(
		relation.table,
		subquery,
		relations,
		false,
		{
			where: `${connect(
				relation.table,
				relation.field,
				relation.referenceTable,
				relation.referenceField,
			)}`,
		},
	)})`;
}
