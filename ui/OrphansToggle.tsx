"use client";

//! O CÓDIGO QUE CONTRATO NENHUM RECLAMA.
//!
//! A PERGUNTA QUE ESTE TOGGLE FAZ é a única que o grafo não sabia fazer: **por que
//! este arquivo existe?** Um arquivo que nenhum contrato cita ou é trabalho que
//! ninguém documentou, ou é trabalho que ninguém precisa — e as duas respostas são
//! acionáveis, o que é mais do que se pode dizer de um diagrama bonito.
//!
//! ELES NÃO SÃO PARTE DO GRAFO, e por isso entram fora por padrão e desenhados em
//! outra forma: não têm aresta, não têm camada, não dependem de ninguém no desenho.
//! Ficam ao LADO da arquitetura, que é exatamente o que eles são.

import { Toggle } from "./Toggle";

export function OrphansToggle({
	value,
	onChange,
	count,
}: {
	value: boolean;
	onChange: (on: boolean) => void;
	/** Quantos arquivos, não quantas pastas: o número que dói é o de arquivos. */
	count: number;
}) {
	if (!count) return null;
	return (
		<Toggle value={value} onChange={onChange}>
			órfãos — {count} arquivos sem contrato
		</Toggle>
	);
}
