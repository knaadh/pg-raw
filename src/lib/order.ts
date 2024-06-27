import type { OrderBy } from "./types";
import { quoteIdentifier } from "./util";

export function order(order: OrderBy) {
	return Object.entries(order)
		.map(([key, value]) => `${quoteIdentifier(key)} ${value}`)
		.join(", ");
}
