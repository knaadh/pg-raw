import type { GroupBy } from "./types";
import { quoteIdentifier } from "./util";

/**
 * Builds a string representing the GROUP BY clause for an SQL query.
 *
 * @param {GroupBy} group - An array of strings representing the columns to group by.
 * @returns {string} A comma-separated string of quoted identifiers for the GROUP BY clause.
 */
export function group(group: GroupBy): string {
	return group.map((value) => quoteIdentifier(value)).join(", ");
}
