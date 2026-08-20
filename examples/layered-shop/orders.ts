//! orders — verbos de pedido.
// THIS ONE IS NOT A DRAFT.
import type { Domain } from "./domain";
export interface Orders {
	create(): void;
	track(): void;
}
