import { getTranslate } from '../i18n/locale';

type JsxElement = {
	type: string;
	props: {
		children: Array<JsxElement | string>;
		[key:string]: any;
	};
}

const R_SEP = /<(\/|#)?(\d+)(\/?)>/g;
const R_CLEANER = /,(\n\s*\))/g;
const COMPILED = {};

function compile(input: string) {
	const source = [];
	const tokens = input.split(R_SEP);
	let indent = '';

	function line(code: string, ind?: number) {
		if (ind < 0) {
			indent = indent.slice(2);
		}

		source.push(`${indent}${code}`);

		if (ind > 0) {
			indent += '  ';
		}
	}

	line(`__CREATE__(`, +1);
	line('__parts__[0].type,');
	line('__parts__[0].props,');

	for (let i = 0; i < tokens.length; i += 4) {
		const text = tokens[i];
		const type = tokens[i + 1];
		const partIdx = tokens[i + 2];
		const selfClosed = tokens[i + 3];

		if (text !== '') {
			line(`${JSON.stringify(text)},`);
		}

		if (type === '#') {
			line(`__parts__[${partIdx}],`);
		} else if (selfClosed) {
			line(`__CREATE__(__parts__[${partIdx}].type, __parts__[${partIdx}].props),`);
		} else if (type === '/') {
			line('),', -1);
		} else if (partIdx) {
			line(`__CREATE__(`, +1);
			line(`__parts__[${partIdx}].type,`);
			line(`__parts__[${partIdx}].props,`);
		}
	}

	line(')', -1);

	return Function(`__CREATE__, __parts__`, `return (${source.join('\n').replace(R_CLEANER, '$1')});`);
}

export function jsxFactory(create: (type: string, props: object, ...children: any[]) => JsxElement) {
	return function jsx(phrase: string, parts) {
		const translatePhrase = getTranslate(phrase);

		if (!COMPILED.hasOwnProperty(translatePhrase)) {
			COMPILED[translatePhrase] = compile(translatePhrase);
		}

		return COMPILED[translatePhrase](create, parts);
	};
}