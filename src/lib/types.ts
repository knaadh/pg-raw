export type SingleKey<K extends string, V = unknown> = {
	[P in K]: Record<P, V> & Partial<Record<Exclude<K, P>, never>> extends infer O
		? { [Q in keyof O]: O[Q] }
		: never;
}[K];

export enum Operators {
	equals = "=",
	notEquals = "<>",
	lessThan = "<",
	greaterThan = ">",
	lessThanOrEqual = "<=",
	greaterThanOrEqual = ">=",
	like = "LIKE",
	notLike = "NOT LIKE",
	iLike = "ILIKE",
	notILike = "NOT ILIKE",
	between = "BETWEEN",
	notBetween = "NOT BETWEEN",
	in = "IN",
	notIn = "NOT IN",
}

export type SubQueryExpression = {
	[key in "all" | "some"]?: Record<string, SubQuery>;
};

export type QueryFilter = {
	equals?: string | number | boolean | null | SubQueryExpression;
	notEquals?: string | number | boolean | null | SubQueryExpression;
	lessThan?: string | number | Date | null | SubQueryExpression;
	greaterThan?: string | number | Date | null | SubQueryExpression;
	lessThanOrEqual?: string | number | Date | null | SubQueryExpression;
	greaterThanOrEqual?: string | number | Date | null | SubQueryExpression;
	like?: string;
	iLike?: string;
	in?: (string | number | boolean | null)[] | Record<string, SubQuery>;
	notIn?: (string | number | boolean | null)[] | Record<string, SubQuery>;
	between?: [string | number | Date | null, string | number | Date | null];
	notBetween?: [string | number | Date | null, string | number | Date | null];
	is?: "NOT NULL" | "NULL";
};

export type Relations = {
	[key: string]: Relation;
};

export type Relation = DirectRelation | JunctionRelation;

export type DirectRelation = {
	type: "ONE" | "MANY";
	table: string;
	field: string;
	referenceTable: string;
	referenceField: string;
};

export type JunctionRelation = {
	type: "MANY-MANY";
	table: string;
	field: string;
	referenceTable: string;
	referenceField: string;
	junction: {
		table: string;
		field: string;
		referenceField: string;
	};
};

export type Include = {
	[key: string]: IncludeQuery;
};

export type IncludeQuery = {
	select: Select;
	where?: QueryWhereCondition;
	limit?: number;
	offset?: number;
	include?: Include;
	groupBy?: string[];
	orderBy?: OrderBy;
	leftJoin?: Join;
	rightJoin?: Join;
	innerJoin?: Join;
	fullJoin?: Join;
};

export type FindManyParams = {
	table: string;
	query: SelectQuery;
	relations?: Relations;
};

export type Select = {
	[key: string]: string | boolean;
};

export type SelectQuery = {
	select: Select;
	where?: QueryWhereCondition;
	limit?: number;
	offset?: number;
	include?: Include;
	groupBy?: string[];
	orderBy?: OrderBy;
	leftJoin?: Join;
	rightJoin?: Join;
	innerJoin?: Join;
	fullJoin?: Join;
};

export type Join<T = never> = {
	[key: string]: Omit<
		SelectQuery,
		| "include"
		| "leftJoin"
		| "rightJoin"
		| "innerJoin"
		| "fullJoin"
		| (T extends string ? T : never)
	>;
};

export type SubQuery = Omit<SelectQuery, "include"> & { table?: string };

export type OrderBy = {
	[key: string]: "ASC" | "DESC";
};

export type GroupBy = Array<string>;

// export type WhereCondition = {
//   [key: string]:
//     | SingleKey<keyof QueryFilter, string | boolean | number>
//     | string
//     | boolean
//     | number;
// };
export type WhereCondition = {
	[key: string]: QueryFilter | string | boolean | number;
};

export type NestedWhereCondition = {
	OR?: QueryWhereCondition[];
	NOT?: QueryWhereCondition;
	AND?: QueryWhereCondition[];
	exists?: Record<string, Omit<SubQuery, "select"> | true>;
};

export type QueryWhereCondition = WhereCondition | NestedWhereCondition;
// | { exists: Record<string, Omit<SubQuery, 'select'>> }
// | { notExists: Record<string, Omit<SubQuery, 'select'>> };

export type SelectType = "simple" | "aggregated" | "object";

export type SqlParams = {
	select?: string;
	delete?: string;
	join?: string | null;
	where?: QueryWhereCondition;
	limit?: number;
	offset?: number;
	groupBy?: GroupBy;
	orderBy?: OrderBy;
	relations?: Relations;
	returning?: Array<string>;
};

export type InsertOneParams = {
	table: string;
	data: Record<string, string | number | boolean | object | null | undefined>;
	select?: string[];
};

export type InsertManyParams = {
	table: string;
	data: Array<string | number | boolean | object>;
	select?: string[];
};

export type DeleteManyParams = {
	table: string;
	query: DeleteQuery;
	relations?: Relations;
};

export type DeleteQuery = {
	returning?: Array<string>;
	where?: QueryWhereCondition;
};
