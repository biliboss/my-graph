//! checkout — o arquivo que todo mundo tem medo de abrir.
// THIS ONE IS NOT A DRAFT.
import type { Api } from "./api";
import type { Legacy } from "./legacy";
import type { Utils } from "./utils";
import type { Db } from "./db";
import type { Shared } from "./shared";
export interface Checkout {
	pay(): void;
	refund(): void;
}
