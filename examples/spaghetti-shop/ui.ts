//! ui — telas que sabem SQL por tabela.
// THIS ONE IS NOT A DRAFT.
import type { Api } from "./api";
import type { Utils } from "./utils";
import type { Common } from "./common";
import type { Helpers } from "./helpers";
import type { Shared } from "./shared";
export interface Ui {
	home(): void;
	productPage(): void;
	cart(): void;
}
