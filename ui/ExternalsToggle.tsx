"use client";

//! THE DASHED SATELLITES — `src/…`, the paths an interface only CITES in a comment.
//! Off by default: thirteen grey circles around eight real ones is a picture of the
//! extractor, not of the architecture. On when the question is "where does this land".

import { Toggle } from "./Toggle";

export function ExternalsToggle({
	value,
	onChange,
}: {
	value: boolean;
	onChange: (on: boolean) => void;
}) {
	return (
		<Toggle value={value} onChange={onChange}>
			caminhos <code className="font-mono">src/</code> (tracejado)
		</Toggle>
	);
}
