import type { Select } from "./types";
import { quoteIdentifier } from "./util";

export function select(
	columns: Select,
	from: string,
	type: "simple" | "aggregated" | "object" = "simple",
	dataKey?: string,
): string {
	if ((type === "aggregated" || type === "object") && !dataKey) {
		throw new Error("dataKey is required for aggregated and object types");
	}
	const aliasClause = dataKey ? `AS ${quoteIdentifier(dataKey)}` : "";
	switch (type) {
		case "aggregated":
			return `SELECT jsonb_agg(${quoteIdentifier(
				dataKey,
			)}) ${aliasClause} FROM ${quoteIdentifier(from)}`;
		case "object":
			return `SELECT jsonb_build_object(${Object.entries(columns)
				.map(
					([key, value]) =>
						`'${key}', ${
							value === true ? quoteIdentifier(key) : quoteIdentifier(value)
						}`,
				)
				.join(", ")}) ${aliasClause} FROM ${quoteIdentifier(from)}`;
		default:
			return `SELECT ${Object.entries(columns)
				.map(
					([key, value]) =>
						`${
							value === true
								? quoteIdentifier(key)
								: `${quoteIdentifier(value)} AS ${quoteIdentifier(key)}`
						}`,
				)
				.join(", ")} FROM ${quoteIdentifier(from)}`;
	}
}
