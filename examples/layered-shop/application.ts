//! application — orquestra os casos de uso, uma camada acima.
// THIS ONE IS NOT A DRAFT.
import type { Domain } from "./domain";
import type { Catalog } from "./catalog";
import type { Orders } from "./orders";
import type { Payments } from "./payments";
import type { Notifications } from "./notifications";
export interface Application {
	buy(): void;
	cancel(): void;
}
