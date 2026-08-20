//! utils — função sem dono, todo mundo usa, usa todo mundo de volta.
// THIS ONE IS NOT A DRAFT.
import type { Helpers } from "./helpers";
import type { Db } from "./db";
export interface Utils {
	format(): void;
	parse(): void;
	slug(): void;
}
