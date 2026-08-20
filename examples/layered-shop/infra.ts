//! infra — banco, fila e disco. Implementa, não decide.
// THIS ONE IS NOT A DRAFT.
import type { Domain } from "./domain";
export interface Infra {
	db(): void;
	queue(): void;
}
