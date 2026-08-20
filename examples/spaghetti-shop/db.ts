//! db — o banco que conhece a camada de cima.
// THIS ONE IS NOT A DRAFT.
import type { Utils } from "./utils";
export interface Db {
	query(): void;
	migrate(): void;
}
