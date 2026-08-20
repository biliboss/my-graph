//! catalog — verbos de catálogo, dependem só do domínio.
// THIS ONE IS NOT A DRAFT.
import type { Domain } from "./domain";
export interface Catalog {
	list(): void;
	search(): void;
}
