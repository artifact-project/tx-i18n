import { Plural } from '@artifact-project/i18n';
import { icu, Token } from '../utils/icu';
import { AST } from 'format-message-parse';
import { htmlDecode } from '../utils/entities';
import { compileTokens } from '../i18n/i18n.compiler';

const stringify = JSON.stringify;
const R_CLEANER = /,\s*(\)\))/g;

const EMPTY_ARRAY = [];
const EMPTY_STRING = '';
const HASH_BANG = '#';
const EQUAL = '=';

const COMPILED = {};

export type LikeJSXElement = {
	type: string | Function;
	props: {
		children: Array<LikeJSXElement | string>;
		[key:string]: any;
	};
}

export type LikeJSXFactory = (type: string | Function, props: object, ...children: any[]) => LikeJSXElement;

export function jsxCompile(
	phrase: string,
	createElement: LikeJSXFactory,
	plural?: Plural<any, any>,
): (parts: any[]) => LikeJSXElement {
	if (COMPILED.hasOwnProperty(phrase)) {
		return COMPILED[phrase];
	}

	const source = [] as string[];
	let tokens = [] as AST;
	let compiled = null;

	try {
		tokens = icu.parse(phrase, {
			tags: true,
		});
	} catch (err) {
		tokens = [phrase];
		console.error(err);
	}

	function write(code: string) {
		source.push(code);
	}

	// Tokens processing
	// console.log(tokens);
	(function processing(tokens: AST, idx: number) {
		write(`($$$ = __vls__[${idx}], __CREATE__($$$.type, $$$.props`);

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];

			switch (icu.getTokenType(token)) {
				case Token.String:
					if (token !== EMPTY_STRING) {
						write(`,\n${stringify(htmlDecode(token as string))}`);
					}
					break;

				case Token.Simple:
					if (token[0] === HASH_BANG) {
						write(`,\n__vls__[${idx}]._`);
					} else {
						idx = icu.parseTokenIdx(token, 0);
						write(`,\n__vls__[${idx}]`);
					}
					break;

				case Token.Tag:
					idx = icu.parseTokenIdx(token, 0);
					write(`,\n`);
					if (token.length === 3) {
						processing((token[2] as any).children, idx);
					} else {
						processing(EMPTY_ARRAY, idx);
					}
					break;

				case Token.Typed:
					throw "todo: Token.Typed";
					break;

				case Token.Styled:
					// idx = icu.parseTokenIdx(token);
					// write(`+ __ICUFN__.select(__vls__[${idx}], {`);

					// Object.keys(token[2]).forEach((key) => {
					// 	write(`${stringify(key)}: (`);
					// 	processing(token[2][key], idx);
					// 	write(`),\n`);
					// });

					// write(`})`);
					break;

				case Token.Plural:
					write(`, ${compileTokens([token], 0).join('')}`);
					break;
			}
		}
		write('))');
	})(tokens, 0);

	const code = `return function (__vls__) {
		var $$$;
		return (${ source.join('') });
	};`.trim();

	// Compile
	// console.log(code);
	try {
		compiled = Function(`__CREATE__, __ICUFN__`, code)(
			createElement,
			icu.fn({
				plural,
			}),
		);
	} catch (err) {
		compiled = () => phrase;
		console.warn(`Parse failed: "${phrase}"\n-----------\n${code}`);
		console.error(err);
	}

	COMPILED[phrase] = compiled;
	return compiled;
}