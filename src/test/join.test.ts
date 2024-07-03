import { describe, expect, it } from "bun:test";
import { join } from "../lib/join";
import type { Relation } from "../lib/types";

const directRelation: Relation = {
	type: "ONE",
	table: "book",
	field: "author_id",
	referenceTable: "author",
	referenceField: "id",
};

const junctionRelation: Relation = {
	type: "MANY",
	table: "book",
	field: "id",
	referenceTable: "author",
	referenceField: "id",
	junction: {
		table: "book_author",
		field: "book_id",
		referenceField: "author_id",
	},
};

describe("join", () => {
	it("should generate correct LEFT LATERAL join when type is LEFT LATERAL and query is provided", () => {
		const type = "LEFT LATERAL";
		const query = "SELECT * FROM users";
		const expected = ` LEFT JOIN LATERAL (${query}) ON TRUE`;
		const result = join(type, directRelation, query);
		expect(result).toBe(expected);
	});

	it("should return empty string when type is LEFT LATERAL but query is not provided", () => {
		const type = "LEFT LATERAL";
		const expected = "";
		const result = join(type, directRelation);
		expect(result).toBe(expected);
	});

	it("should generate correct join for ONE-TO-ONE relation", () => {
		const type = "LEFT";
		const expected = ` LEFT JOIN "book" ON "book"."author_id" = "author"."id"`;
		const result = join(type, directRelation);
		expect(result).toBe(expected);
	});

	it("should generate correct join for ONE-MANY relation", () => {
		const type = "LEFT";
		const expected = ` LEFT JOIN "book" ON "book"."author_id" = "author"."id"`;
		const result = join(type, directRelation);
		expect(result).toBe(expected);
	});

	it("should generate correct join for MANY-MANY relation", () => {
		const type = "LEFT";
		const expected = ` LEFT JOIN "book_author" ON "book_author"."author_id" = "author"."id" LEFT JOIN "book" ON "book_author"."book_id" = "book"."id"`;
		const result = join(type, junctionRelation);
		expect(result).toBe(expected);
	});

	it("should generate correct direct join for other types (INNER, RIGHT, FULL)", () => {
		const types = ["INNER", "RIGHT", "FULL"] as const;
		const expected = {
			INNER: ` INNER JOIN "book" ON "book"."author_id" = "author"."id"`,
			RIGHT: ` RIGHT JOIN "book" ON "book"."author_id" = "author"."id"`,
			FULL: ` FULL JOIN "book" ON "book"."author_id" = "author"."id"`,
		};

		for (const type of types) {
			const result = join(type, directRelation);
			expect(result).toBe(expected[type]);
		}
	});

	it("should generate correct junction join for other types (INNER, RIGHT, FULL)", () => {
		const types = ["INNER", "RIGHT", "FULL"] as const;
		const expected = {
			INNER: ` INNER JOIN "book_author" ON "book_author"."author_id" = "author"."id" INNER JOIN "book" ON "book_author"."book_id" = "book"."id"`,
			RIGHT: ` RIGHT JOIN "book_author" ON "book_author"."author_id" = "author"."id" RIGHT JOIN "book" ON "book_author"."book_id" = "book"."id"`,
			FULL: ` FULL JOIN "book_author" ON "book_author"."author_id" = "author"."id" FULL JOIN "book" ON "book_author"."book_id" = "book"."id"`,
		};

		for (const type of types) {
			const result = join(type, junctionRelation);
			expect(result).toBe(expected[type]);
		}
	});
});
