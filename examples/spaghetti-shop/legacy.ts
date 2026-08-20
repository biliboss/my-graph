//! legacy — sistema de 2019, ainda em produção.
// THIS ONE IS NOT A DRAFT.
import type { Common } from "./common";
import type { Db } from "./db";
import type { Misc } from "./misc";
export interface Legacy {
	erpSync(): void;
	report(): void;
}
