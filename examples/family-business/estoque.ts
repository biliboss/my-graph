//! estoque — farinha, fermento e memória do Seu Joaquim.
//! depends_on: src/compras · src/seo-joaquim
// THIS ONE IS NOT A DRAFT.
export interface Estoque {
	conferir(): void;
	anotarFalta(): void;
}
