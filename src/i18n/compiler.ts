const R_SEP = /<(\/|#)?(\d+)(\/?)>/g;
const R_CLEANER = /(?:,)(\n\s*\))/g;

type CompilerSpec = {
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

const EMPTY_STRING = '';
const HASH_BANG = '#';

const INDENT = '  ';
const INDENT_INC = 'inc';
const INDENT_DEC = 'dec';

export function createCompiler(spec: CompilerSpec) {
	const COMPILED = {};

	return function compile(phrase: string): (parts: any[]) => string {
		if (COMPILED.hasOwnProperty(phrase)) {
			return COMPILED[phrase];
		}

		const source = [];
		const tokens = phrase.split(R_SEP);
		let indent = EMPTY_STRING;
		let compiled = null;

		function write(code: string, ind?: typeof INDENT_INC | typeof INDENT_DEC) {
			if (ind === INDENT_DEC) {
				indent = indent.slice(2);
			}

			source.push(`${indent}${code}`);

			if (ind === INDENT_INC) {
				indent += INDENT;
			}
		}

		write(EMPTY_STRING);
		write(spec.before(), INDENT_INC);

		for (let i = 0; i < tokens.length; i += 4) {
			const text = tokens[i];
			const type = tokens[i + 1];
			const partIdx = +tokens[i + 2] + spec.partOffset;
			const selfClosed = tokens[i + 3];

			if (text !== EMPTY_STRING) {
				write(spec.text(JSON.stringify(text)));
			}

			if (type === HASH_BANG) {
				write(spec.value(`__parts__[${partIdx}]`, partIdx));
			} else if (selfClosed) {
				write(spec.selfClose(`__parts__[${partIdx}]`, partIdx));
			} else if (type === '/') {
				write(spec.close(`__parts__[${partIdx}]`, partIdx), INDENT_DEC);
			} else if (partIdx) {
				write(spec.open(`__parts__[${partIdx}]`, partIdx), INDENT_INC);
			}
		}

		write(spec.after(), INDENT_DEC);

		const code = `${spec.inject ? `var ${Object
			.keys(spec.inject)
			.map(name => `${name} = __INJECT__['${name}']`)
			.join(';\nvar ')
		};` : ``}
		return function (__parts__) {return (${source.join('\n').replace(R_CLEANER, '$1')})}`;

		try {
			compiled = Function(`__INJECT__`, code)(spec.inject);
		} catch (err) {
			compiled = () => `${phrase}\n---------\n${err.message}\n---------\n${code}`;
		}

		COMPILED[phrase] = compiled;
		return compiled;
	}
}