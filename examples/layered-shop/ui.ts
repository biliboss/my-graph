//! ui — telas. Só falam com a aplicação.
// THIS ONE IS NOT A DRAFT.
import type { Application } from "./application";
export interface Ui {
	home(): void;
	productPage(): void;
	cart(): void;
}
