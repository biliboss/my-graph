//! transporte — depende do banho ter atrasado.
//! depends_on: src/banho · src/mochila
// THIS ONE IS NOT A DRAFT.
export interface Transporte {
	correr(): void;
	perder(): void;
}
