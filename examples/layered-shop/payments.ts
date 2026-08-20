//! payments — cobrar e estornar.
// THIS ONE IS NOT A DRAFT.
import type { Domain } from "./domain";
export interface Payments {
	charge(): void;
	refund(): void;
}
