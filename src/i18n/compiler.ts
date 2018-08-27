const R_SEP = /<(\/|#)?(\d+)(\/?)>/g;
const R_CLEANER = /(?:,)(\n\s*\))/g;

type CompilerConfig = {
	inject: {
		[dep:string]: Function;
	};
	partOffset: number;
	before: () => string;
	after: () => string;
	text: (text: string) => string;
	value: (part: string, partIdx: number) => string;
	open?: (part: string, partIdx: number) => string;
	close?: (part: string, partIdx: number) => string;
	selfClose?: (part: string, partIdx: number) => string;
}

export function createCompiler(cfg: CompilerConfig) {
	const COMPILED = {};

	return function compile(phrase: string): (parts: any[]) => string {
		if (COMPILED.hasOwnProperty(phrase)) {
			return COMPILED[phrase];
		}

		const source = [];
		const tokens = phrase.split(R_SEP);
		let indent = '';
		let compiled = null;

		function write(code: string, ind?: 'inc' | 'dec') {
			if (ind === 'dec') {
				indent = indent.slice(2);
			}

			source.push(`${indent}${code}`);

			if (ind === 'inc') {
				indent += '  ';
			}
		}

		write(cfg.before(), 'inc');

		for (let i = 0; i < tokens.length; i += 4) {
			const text = tokens[i];
			const type = tokens[i + 1];
			const partIdx = +tokens[i + 2] + cfg.partOffset;
			const selfClosed = tokens[i + 3];

			if (text !== '') {
				write(cfg.text(JSON.stringify(text)));
			}

			if (type === '#') {
				write(cfg.value(`__parts__[${partIdx}]`, partIdx));
			} else if (selfClosed) {
				write(cfg.selfClose(`__parts__[${partIdx}]`, partIdx));
			} else if (type === '/') {
				write(cfg.close(`__parts__[${partIdx}]`, partIdx));
			} else if (partIdx) {
				write(cfg.open(`__parts__[${partIdx}]`, partIdx));
			}
		}

		write(cfg.after(), 'dec');

		const code = `${cfg.inject ? `var ${Object
			.keys(cfg.inject)
			.map(name => `${name} = __INJECT__['${name}']`)
			.join(';\nvar ')
		};` : ``}
		return function (__parts__) {return (${source.join('\n').replace(R_CLEANER, '$1')})}`;

		try {
			compiled = Function(`__INJECT__`, code)(cfg.inject);
		} catch (err) {
			compiled = () => `${phrase}\n---------\n${err.message}\n---------\n${code}`;
		}

		COMPILED[phrase] = compiled;
		return compiled;
	}
}