import { describe, expect, it } from "bun:test";
import { findMany } from "../lib/find";
import type { FindManyParams, Relations } from "../lib/types";
import { raw } from "../lib/util";

const relations: Relations = {
	albums: {
		type: "MANY",
		table: "albums",
		field: "artist_id",
		referenceTable: "artist",
		referenceField: "id",
	},
	artist: {
		type: "ONE",
		table: "artist",
		field: "id",
		referenceTable: "albums",
		referenceField: "artist_id",
	},
	producer: {
		type: "ONE",
		table: "producer",
		field: "id",
		referenceTable: "albums",
		referenceField: "producer_id",
	},
	genre: {
		type: "MANY",
		table: "genre",
		field: "id",
		referenceTable: "artists",
		referenceField: "id",
		junction: {
			table: "genre_artist",
			field: "genre_id",
			referenceField: "artist_id",
		},
	},
};

describe("findMany", () => {
	it("should generate a SELECT query with aliased columns", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: "ArtistId",
					name: "Name",
				},
			},
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "ArtistId" AS "id", "Name" AS "name" FROM "artist"`,
		);
	});

	it("should generate a SELECT query with ONE-TO-MANY relation using include", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					name: true,
				},
				include: {
					albums: {
						select: {
							title: true,
						},
					},
				},
			},
			relations: relations,
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "id", "name", "albums" FROM "artist" LEFT JOIN LATERAL (SELECT jsonb_agg("albums") AS "albums" FROM (SELECT jsonb_build_object('title', "title") AS "albums" FROM "albums" WHERE "albums"."artist_id" = "artist"."id") ) ON TRUE`,
		);
	});

	it("should generate a SELECT query with MANY-TO-MANY relation using include", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					name: true,
				},
				include: {
					genre: {
						select: {
							title: true,
						},
					},
				},
			},
			relations: relations,
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "id", "name", "genre" FROM "artist" LEFT JOIN LATERAL (SELECT jsonb_agg("genre") AS "genre" FROM (SELECT jsonb_build_object('title', "title") AS "genre" FROM "genre_artist" LEFT JOIN "genre" ON "genre_artist"."genre_id" = "genre"."id" WHERE "genre_artist"."artist_id" = "artists"."id") ) ON TRUE`,
		);
	});

	it("should generate a SELECT query with nested include", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					name: true,
				},
				include: {
					albums: {
						select: {
							title: true,
						},
						include: {
							producer: {
								select: {
									name: true,
								},
							},
						},
					},
				},
			},
			relations: relations,
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "id", "name", "albums" FROM "artist" LEFT JOIN LATERAL (SELECT jsonb_agg("albums") AS "albums" FROM (SELECT jsonb_build_object('title', "title", 'producer', "producer") AS "albums" FROM "albums" LEFT JOIN LATERAL (SELECT "producer" FROM (SELECT jsonb_build_object('name', "name") AS "producer" FROM "producer" WHERE "producer"."id" = "albums"."producer_id") ) ON TRUE WHERE "albums"."artist_id" = "artist"."id") ) ON TRUE`,
		);
	});

	it("should throw an error if the relationship used in the include is not defined", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					name: true,
				},
				include: {
					managers: {
						select: {
							name: true,
						},
					},
				},
			},
			relations: relations,
		};
		expect(() => findMany(param)).toThrowError(
			"Relation managers is not defined",
		);
	});

	it("should generate a SELECT query with LEFT Join", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					name: true,
				},
				leftJoin: {
					albums: {
						select: {
							title: true,
						},
					},
				},
			},
			relations: relations,
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "id", "name", "title" FROM "artist" LEFT JOIN "albums" ON "albums"."artist_id" = "artist"."id"`,
		);
	});

	it("should throw error if the relationship used in LEFT join is not defined", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					name: true,
				},
				leftJoin: {
					vinyls: {
						select: {
							title: true,
						},
					},
				},
			},
			relations: relations,
		};

		expect(() => findMany(param)).toThrowError(
			"Relation vinyls is not defined",
		);
	});

	it("should generate a SELECT query with RIGHT Join", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					name: true,
				},
				rightJoin: {
					albums: {
						select: {
							title: true,
						},
					},
				},
			},
			relations: relations,
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "id", "name", "title" FROM "artist" RIGHT JOIN "albums" ON "albums"."artist_id" = "artist"."id"`,
		);
	});

	it("should throw error if the relationship used in Right join is not defined", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					name: true,
				},
				rightJoin: {
					vinyls: {
						select: {
							title: true,
						},
					},
				},
			},
			relations: relations,
		};

		expect(() => findMany(param)).toThrowError(
			"Relation vinyls is not defined",
		);
	});

	it("should generate a SELECT query with INNER Join", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					name: true,
				},
				innerJoin: {
					albums: {
						select: {
							title: true,
						},
					},
				},
			},
			relations: relations,
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "id", "name", "title" FROM "artist" INNER JOIN "albums" ON "albums"."artist_id" = "artist"."id"`,
		);
	});

	it("should throw error if the relationship used in INNER join is not defined", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					name: true,
				},
				innerJoin: {
					vinyls: {
						select: {
							title: true,
						},
					},
				},
			},
			relations: relations,
		};

		expect(() => findMany(param)).toThrowError(
			"Relation vinyls is not defined",
		);
	});

	it("should generate a SELECT query with FULL Join", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					name: true,
				},
				fullJoin: {
					albums: {
						select: {
							title: true,
						},
					},
				},
			},
			relations: relations,
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "id", "name", "title" FROM "artist" FULL JOIN "albums" ON "albums"."artist_id" = "artist"."id"`,
		);
	});

	it("should throw error if the relationship used in FULL join is not defined", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					name: true,
				},
				fullJoin: {
					vinyls: {
						select: {
							title: true,
						},
					},
				},
			},
			relations: relations,
		};

		expect(() => findMany(param)).toThrowError(
			"Relation vinyls is not defined",
		);
	});

	it("should generate a SELECT query with subquery where clause", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					name: true,
				},
				where: {
					exists: {
						records: {
							table: "records",
							where: {
								type: "Master",
							},
						},
					},
				},
			},
			relations: relations,
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "id", "name" FROM "artist" WHERE EXISTS(SELECT 1 FROM "records" WHERE "type" = 'Master')`,
		);
	});

	it("should generate a SELECT query with raw util function in select clause", () => {
		const param: FindManyParams = {
			table: "artist",
			query: {
				select: {
					id: true,
					countries: raw`meta->'countries'`,
				},
			},
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "id", meta->'countries' AS "countries" FROM "artist"`,
		);
	});

	it("should generate a SELECT query with table alias", () => {
		const param: FindManyParams = {
			table: "product_categories",
			tableAlias: "categories",
			query: {
				select: {
					id: true,
					name: true,
				},
				where: {
					parent_id: {
						is: "NULL",
					},
				},
			},
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "id", "name" FROM "product_categories" AS "categories" WHERE "parent_id" IS NULL`,
		);
	});

	it("should generate a SELECT query with table alias in relationship", () => {
		const param: FindManyParams = {
			table: "product_categories",
			query: {
				select: {
					id: true,
					name: true,
				},
				where: {
					parent_id: {
						is: "NULL",
					},
				},
				include: {
					subcategories: {
						select: {
							name: true,
						},
					},
				},
			},
			relations: {
				subcategories: {
					type: "MANY",
					table: "product_categories",
					tableAlias: "sub_categories",
					field: "parent_id",
					referenceTable: "product_categories",
					referenceField: "id",
				},
			},
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "id", "name", "subcategories" FROM "product_categories" LEFT JOIN LATERAL (SELECT jsonb_agg("subcategories") AS "subcategories" FROM (SELECT jsonb_build_object('name', "name") AS "subcategories" FROM "product_categories" AS "sub_categories" WHERE "sub_categories"."parent_id" = "product_categories"."id") ) ON TRUE WHERE "parent_id" IS NULL`,
		);
	});

	it("should generate a SELECT query with table alias in nested relationship", () => {
		const param: FindManyParams = {
			table: "offers",
			query: {
				select: {
					id: true,
					title: true,
				},
				include: {
					payment_offers: {
						select: {
							title: true,
							description: true,
						},
						where: {
							is_active: true,
						},
						include: {
							payment_method: {
								select: {
									name: true,
									logo: true,
									type: true,
								},
							},
						},
					},
				},
			},
			relations: {
				payment_offers: {
					type: "MANY",
					table: "payment_offers",
					tableAlias: "po",
					field: "id",
					referenceTable: "offers",
					referenceField: "id",
					junction: {
						table: "offer_payment_offer",
						field: "payment_offer_id",
						referenceField: "offer_id",
					},
				},
				payment_method: {
					table: "payment_methods",
					tableAlias: "pm",
					field: "id",
					referenceTable: "po",
					referenceField: "payment_method_id",
				},
			},
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "id", "title", "payment_offers" FROM "offers" LEFT JOIN LATERAL (SELECT jsonb_agg("payment_offers") AS "payment_offers" FROM (SELECT jsonb_build_object('title', "title", 'description', "description", 'payment_method', "payment_method") AS "payment_offers" FROM "offer_payment_offer" LEFT JOIN "payment_offers" AS "po" ON "offer_payment_offer"."payment_offer_id" = "po"."id" LEFT JOIN LATERAL (SELECT "payment_method" FROM (SELECT jsonb_build_object('name', "name", 'logo', "logo", 'type', "type") AS "payment_method" FROM "payment_methods" AS "pm" WHERE "pm"."id" = "po"."payment_method_id") ) ON TRUE WHERE "is_active" = true AND "offer_payment_offer"."offer_id" = "offers"."id") ) ON TRUE`,
		);
	});

	it("should generate a SELECT query with LEFT Join and table alias", () => {
		const param: FindManyParams = {
			table: "product_categories",
			query: {
				select: {
					"product_categories.id": true,
					"product_categories.name": true,
				},
				where: {
					"product_categories.parent_id": {
						is: "NULL",
					},
				},
				leftJoin: {
					subcategories: {
						select: {
							subcategory_name: "sub_categories.name",
						},
					},
				},
			},
			relations: {
				subcategories: {
					type: "MANY",
					table: "product_categories",
					tableAlias: "sub_categories",
					field: "parent_id",
					referenceTable: "product_categories",
					referenceField: "id",
				},
			},
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "product_categories"."id", "product_categories"."name", "sub_categories"."name" AS "subcategory_name" FROM "product_categories" LEFT JOIN "product_categories" AS "sub_categories" ON "sub_categories"."parent_id" = "product_categories"."id" WHERE "product_categories"."parent_id" IS NULL`,
		);
	});

	it("should generate a SELECT query with LEFT Join using junction table and table alias", () => {
		const param: FindManyParams = {
			table: "offers",
			tableAlias: "of",
			query: {
				select: {
					"of.id": true,
					title: "of.title",
				},
				leftJoin: {
					payment_offers: {
						select: {
							payment_offer_title: "po.title",
							payment_offer_description: "po.description",
						},
					},
				},
			},
			relations: {
				payment_offers: {
					type: "MANY",
					table: "payment_offers",
					tableAlias: "po",
					field: "id",
					referenceTable: "of",
					referenceField: "id",
					junction: {
						table: "offer_payment_offer",
						field: "payment_offer_id",
						referenceField: "offer_id",
					},
				},
			},
		};
		const result = findMany(param);
		expect(result).toBe(
			`SELECT "of"."id", "of"."title" AS "title", "po"."title" AS "payment_offer_title", "po"."description" AS "payment_offer_description" FROM "offers" AS "of" LEFT JOIN "offer_payment_offer" ON "offer_payment_offer"."offer_id" = "of"."id" LEFT JOIN "payment_offers" AS "po" ON "offer_payment_offer"."payment_offer_id" = "po"."id"`,
		);
	});
});
