//! caixa — dinheiro que entra no balcão e fecha com ele.
//! depends_on: src/balcao · src/seo-joaquim
// THIS ONE IS NOT A DRAFT.
export interface Caixa {
	receber(): void;
	fechar(): void;
}
