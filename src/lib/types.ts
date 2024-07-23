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

export enum RelationType {
	ONE = "ONE",
	MANY = "MANY",
}

export enum Order {
	ASC = "ASC",
	DESC = "DESC",
}

export type SqlParams = {
	select?: string;
	delete?: string;
	update?: string;
	join?: string | null;
	where?: QueryWhereCondition;
	limit?: number | string;
	offset?: number | string;
	groupBy?: GroupBy;
	having?: QueryHavingCondition;
	orderBy?: OrderBy;
	relations?: Relations;
	returning?: Array<string>;
};

export type SelectType = "simple" | "aggregated" | "object";

export type IncludesNone<R extends string> = "none" extends R ? true : false;

export type ElementType<T> = T extends (infer U)[] ? U : T;

export type FindManyParams<T = unknown, R extends string = "none"> = {
	table: string;
	query: SelectQuery<T, Exclude<R, "none">>;
} & (IncludesNone<R> extends true
	? { relations?: Relations<Exclude<R, "none">> }
	: { relations: Relations<R> });

export type SelectQuery<T = unknown, R extends string = "none"> = {
	select: Select<T, R>;
	where?: QueryWhereCondition<T, R>;
	include?: Include<T, R>;
	groupBy?: GroupBy<T>;
	having?: QueryHavingCondition;
	orderBy?: OrderBy<T, R>;
	limit?: number;
	offset?: number;
	leftJoin?: Join<T, R>;
	rightJoin?: Join<T, R>;
	innerJoin?: Join<T, R>;
	fullJoin?: Join<T, R>;
};

export type Select<T = unknown, R extends string = "none"> = {
	[K in keyof T as Exclude<K, R>]?: boolean;
} & {
	[key: string]: string | boolean;
};

export type QueryWhereCondition<T = unknown, R extends string = "none"> =
	| WhereCondition<T, R>
	| NestedWhereCondition<T, R>;

export type WhereCondition<T = unknown, R extends string = "none"> = {
	[K in keyof T as Exclude<K, R>]?:
		| QueryFilter
		| string
		| boolean
		| number
		| Record<string, string | boolean | number>;
} & {
	[key: string]:
		| QueryFilter
		| string
		| boolean
		| number
		| Record<string, string | boolean | number>;
};

export type NestedWhereCondition<T = unknown, R extends string = "none"> = {
	OR?: QueryWhereCondition<T, R>[];
	NOT?: QueryWhereCondition<T, R>;
	AND?: QueryWhereCondition<T, R>[];
	exists?: Record<string, Omit<SubQuery, "select"> | true>;
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

export type SubQueryExpression =
	| {
			all: {
				[key: string]: SubQuery;
			};
			some?: {
				[key: string]: SubQuery;
			};
	  }
	| {
			some: {
				[key: string]: SubQuery;
			};
			all?: {
				[key: string]: SubQuery;
			};
	  };

export type SubQuery<T = unknown, R extends string = "none"> = Omit<
	SelectQuery<T, R>,
	"include"
> & { table?: string };

export type Include<T = unknown, R extends string = "none"> = {
	[K in keyof T as K extends R ? K : never]?: IncludeQuery<
		ElementType<T[K]>,
		R
	>;
} & {
	[key: string]: IncludeQuery;
};

export type IncludeQuery<T = unknown, R extends string = "none"> = {
	select: Select<T, R>;
	where?: QueryWhereCondition<T, R>;
	include?: Include<T, R>;
	groupBy?: GroupBy<T>;
	having?: QueryHavingCondition;
	orderBy?: OrderBy<T, R>;
	limit?: number | string;
	offset?: number | string;
	leftJoin?: Join<T, R>;
	rightJoin?: Join<T, R>;
	innerJoin?: Join<T, R>;
	fullJoin?: Join<T, R>;
};

export type GroupBy<T = unknown> = (keyof T)[] | string[];

export type QueryHavingCondition =
	| WhereCondition
	| Omit<NestedWhereCondition, "exists">;

export type OrderDirection = "ASC" | "DESC";

export type OrderBy<T = unknown, R extends string = "none"> = {
	[K in keyof T as Exclude<K, R>]?: OrderDirection;
} & {
	[key: string]: OrderDirection;
};

export type Join<T, R extends string> = {
	[K in keyof T as K extends R ? K : never]?: Omit<
		SelectQuery<ElementType<T[K]>, R>,
		"include" | "leftJoin" | "rightJoin" | "innerJoin" | "fullJoin"
	>;
} & {
	[key: string]: Omit<
		SelectQuery,
		"include" | "leftJoin" | "rightJoin" | "innerJoin" | "fullJoin"
	>;
};

export type Relations<R extends string = never> = {
	[P in R]: Relation;
} & {
	[key: string]: Relation;
};

export type Relation = {
	type?: "ONE" | "MANY";
	table: string;
	field: string;
	referenceTable: string;
	referenceField: string;
	junction?: Junction;
};

export type Junction = {
	table: string;
	field: string;
	referenceField: string;
};

export type InsertOneParams<T = unknown> = {
	table: string;
	data: T &
		Record<string, string | number | boolean | object | null | undefined>;
	returning?: (keyof T)[] | string[];
};

export type InsertManyParams<T = unknown> = {
	table: string;
	data: Array<T>;
	returning?: (keyof T)[] | string[];
};

export type UpdateManyParams<T = unknown, R extends string = "none"> = {
	table: string;
	query: UpdateQuery<T, R>;
} & (IncludesNone<R> extends true
	? { relations?: Relations<Exclude<R, "none">> }
	: { relations: Relations<R> });

export type UpdateQuery<T = unknown, R extends string = "none"> = {
	data: Partial<T> &
		Record<string, string | number | boolean | object | null | undefined>;
	where?: QueryWhereCondition<T, R>;
	returning?: (keyof T)[] | string[];
};

export type DeleteManyParams<T = unknown, R extends string = "none"> = {
	table: string;
	query?: DeleteQuery<T, R>;
} & (IncludesNone<R> extends true
	? { relations?: Relations<Exclude<R, "none">> }
	: { relations: Relations<R> });

export type DeleteQuery<T = unknown, R extends string = "none"> = {
	where?: QueryWhereCondition<T, R>;
	returning?: (keyof T)[] | string[];
};

export type PgFunction =
	// Mathematical Functions

	| "ABS"
	| "CEIL"
	| "FLOOR"
	| "ROUND"
	| "SQRT"
	| "EXP"
	| "LN"
	| "LOG"
	| "POWER"
	| "SIGN"
	| "CBRT"
	| "RANDOM"

	// String Functions
	| "LENGTH"
	| "SUBSTRING"
	| "TRIM"
	| "LOWER"
	| "UPPER"
	| "CONCAT"
	| "REPLACE"
	| "POSITION"
	| "CHAR_LENGTH"
	| "REVERSE"
	| "SPLIT_PART"
	| "INITCAP"
	| "LTRIM"
	| "RTRIM"

	// Date and Time Functions
	| "CURRENT_DATE"
	| "CURRENT_TIME"
	| "EXTRACT"
	| "DATE_PART"
	| "AGE"
	| "NOW"
	| "DATE_TRUNC"
	| "INTERVAL"

	// Aggregate Functions
	| "COUNT"
	| "SUM"
	| "AVG"
	| "MIN"
	| "MAX"
	| "ARRAY_AGG"
	| "STRING_AGG"
	| "BOOL_AND"
	| "BOOL_OR"
	| "STDDEV"
	| "VARIANCE"

	// JSON Functions
	| "JSON_AGG"
	| "JSON_BUILD_ARRAY"
	| "JSON_BUILD_OBJECT"
	| "JSON_OBJECT_AGG"
	| "JSONB_SET"
	| "JSONB_INSERT"
	| "JSONB_PRETTY"
	| "JSONB_ARRAY_LENGTH"
	| "JSONB_EACH"
	| "JSONB_EXISTS"

	// Formatting Functions
	| "TO_CHAR"
	| "TO_DATE"
	| "TO_NUMBER"
	| "TO_TIMESTAMP";
