//! api — concentra regra porque "é mais rápido".
// THIS ONE IS NOT A DRAFT.
import type { Db } from "./db";
import type { Utils } from "./utils";
import type { Helpers } from "./helpers";
import type { Shared } from "./shared";
export interface Api {
	listProducts(): void;
	createOrder(): void;
	applyCoupon(): void;
}
