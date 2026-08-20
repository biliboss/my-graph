//! compras — feitas quando o estoque avisa, ou quando ele lembra.
//! depends_on: src/seo-joaquim · src/financeiro
// THIS ONE IS NOT A DRAFT.
export interface Compras {
	cotar(): void;
	comprar(): void;
}
