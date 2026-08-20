//! notifications — avisa o cliente.
// THIS ONE IS NOT A DRAFT.
//! depends_on: src/email-provider
import type { Domain } from "./domain";
export interface Notifications {
	orderConfirmed(): void;
	shipped(): void;
}
