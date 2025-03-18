import { describe, expect, it } from "bun:test";
import type { QueryWhereCondition, Relations } from "../lib/types";
import { where } from "../lib/where";

const relations: Relations = {
	profile: {
		type: "ONE",
		table: "profiles",
		field: "profile_id",
		referenceTable: "users",
		referenceField: "id",
	},
	uploads: {
		type: "MANY",
		table: "uploads",
		field: "id",
		referenceTable: "users",
		referenceField: "id",
		junction: {
			table: "users_uploads",
			field: "upload_id",
			referenceField: "user_id",
		},
	},
};
describe("where", () => {
	it("should handle single condition", () => {
		const conditions: QueryWhereCondition = { id: 1 };
		const result = where(conditions);
		expect(result).toBe(`"id" = 1`);
	});

	it("should handle multiple AND conditions", () => {
		const conditions: QueryWhereCondition = { id: 1, name: "John" };
		const result = where(conditions);
		expect(result).toBe(`"id" = 1 AND "name" = 'John'`);
	});

	it("should handle multiple OR conditions", () => {
		const conditions: QueryWhereCondition = { OR: [{ id: 1, name: "John" }] };
		const result = where(conditions);
		expect(result).toBe(`("id" = 1 OR "name" = 'John')`);
	});

	it("should handle multiple NOT conditions", () => {
		const conditions = { NOT: { id: 1, name: "John" } };
		const result = where(conditions);
		expect(result).toBe(`NOT("id" = 1 AND "name" = 'John')`);
	});

	it("should ignore empty AND", () => {
		const conditions: QueryWhereCondition = { id: 1, AND: [] };
		const result = where(conditions);
		expect(result).toBe(`"id" = 1`);
	});

	it("should ignore empty OR", () => {
		const conditions: QueryWhereCondition = { id: 1, OR: [] };
		const result = where(conditions);
		expect(result).toBe(`"id" = 1`);
	});

	it("should ignore empty NOT", () => {
		const conditions = { id: 1, NOT: {} };
		const result = where(conditions);
		expect(result).toBe(`"id" = 1`);
	});

	it("should ignore nested empty operators", () => {
		const conditions = { id: 1, AND: [{ OR: [{ AND: [] }] }] };
		const result = where(conditions);
		expect(result).toBe(`"id" = 1`);
	});

	it("should handle different types of operators", () => {
		// Test for greaterThan and lessThan
		expect(where({ id: { greaterThan: 1, lessThan: 10 } })).toBe(
			`"id" > 1 AND "id" < 10`,
		);

		// Test for greaterThanOrEqual and lessThanOrEqual
		expect(where({ id: { greaterThanOrEqual: 1, lessThanOrEqual: 10 } })).toBe(
			`"id" >= 1 AND "id" <= 10`,
		);

		// Test for greaterThanOrEqual and lessThanOrEqual with age
		expect(
			where({ age: { greaterThanOrEqual: 18, lessThanOrEqual: 65 } }),
		).toBe(`"age" >= 18 AND "age" <= 65`);

		// Test for equality
		expect(where({ name: "John" })).toBe(`"name" = 'John'`);

		// Test for inequality
		expect(where({ status: { notEquals: "inactive" } })).toBe(
			`"status" <> 'inactive'`,
		);

		// Test for IN operator
		expect(where({ category: { in: ["A", "B", "C"] } })).toBe(
			`"category" IN ('A', 'B', 'C')`,
		);

		// Test for NOT IN operator
		expect(where({ category: { notIn: ["D", "E"] } })).toBe(
			`"category" NOT IN ('D', 'E')`,
		);

		// Test for LIKE operator
		expect(where({ description: { like: "%example%" } })).toBe(
			`"description" LIKE '%example%'`,
		);

		// Test for BETWEEN operator
		expect(where({ score: { between: [0, 30] } })).toBe(
			`"score" BETWEEN 0 AND 30`,
		);

		// Test for NOT BETWEEN operator
		expect(where({ score: { notBetween: [30, 60] } })).toBe(
			`"score" NOT BETWEEN 30 AND 60`,
		);

		// Test for IS NULL operator
		expect(where({ score: { is: "NULL" } })).toBe(`"score" IS NULL`);

		// Test for IS NOT NULL operator
		expect(where({ score: { is: "NOT NULL" } })).toBe(`"score" IS NOT NULL`);
	});

	it("should handle EXISTS subquery expression", () => {
		const conditions = { exists: { uploads: {} } };
		const result = where(conditions, "AND", relations);
		expect(result).toBe(
			`EXISTS(SELECT 1 FROM "users_uploads" LEFT JOIN "uploads" ON "users_uploads"."upload_id" = "uploads"."id" WHERE "users_uploads"."user_id" = "users"."id" )`,
		);
	});

	it("should handle IN subquery expression", () => {
		const conditions: QueryWhereCondition = {
			id: {
				in: {
					profile: {
						select: { id: true },
					},
				},
			},
		};
		const result = where(conditions, "AND", relations);
		expect(result).toBe(
			`"id" IN(SELECT "id" FROM "profiles" WHERE "profiles"."profile_id" = "users"."id")`,
		);
	});

	it("should handle SOME subquery expression", () => {
		const conditions: QueryWhereCondition = {
			id: {
				greaterThan: {
					some: {
						profile: {
							select: {
								score: true,
							},
						},
					},
				},
			},
		};
		const result = where(conditions, "AND", relations);
		expect(result).toBe(
			`"id" > SOME(SELECT "score" FROM "profiles" WHERE "profiles"."profile_id" = "users"."id")`,
		);
	});
	it("should handle ALL subquery expression", () => {
		const conditions: QueryWhereCondition = {
			id: {
				lessThanOrEqual: {
					all: {
						profile: {
							select: {
								score: true,
							},
						},
					},
				},
			},
		};
		const result = where(conditions, "AND", relations);
		expect(result).toBe(
			`"id" <= ALL(SELECT "score" FROM "profiles" WHERE "profiles"."profile_id" = "users"."id")`,
		);
	});

	it("should handle subquery expression with table instead of relation", () => {
		const conditions = {
			exists: {
				avatar: {
					table: "avatar",
					where: {
						id: 1,
					},
				},
			},
		};
		const result = where(conditions, "AND", relations);
		expect(result).toBe(`EXISTS(SELECT 1 FROM "avatar" WHERE "id" = 1)`);
	});

	it("should throw error if relationship is not defined", () => {
		const conditions = { exists: { books: {} } };
		expect(() => {
			where(conditions, "AND", relations);
		}).toThrowError("Relationship books is not defined");
	});
});
