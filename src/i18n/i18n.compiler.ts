import { Plural } from '@artifact-project/i18n';
import { icu, Token } from '../utils/icu';
import { AST } from 'format-message-parse';

const stringify = JSON.stringify;
const R_CONCAT = /"\+\n\s*"/g;
const R_CLEANER = /""\s*\+\s*/g;
const R_TRIM_START = /(return\s*\()[\n\s]*"/;
const R_TRIM_END = /"[\s\n]*\+\s*(\);[\s\r]*\};)/;

const EMPTY_STRING = '';
const HASH_BANG = '#';
const EQUAL = '=';

const COMPILED = {};

export function textCompile(
	phrase: string,
	plural?: Plural<any, any>,
): (parts: any[]) => string {
	if (COMPILED.hasOwnProperty(phrase)) {
		return COMPILED[phrase];
	}

	let tokens = [] as AST;
	let compiled = null;

	try {
		tokens = icu.parse(phrase);
	} catch (err) {
		tokens = [phrase];
		console.error(err);
	}

	const code = `return function (__vls__) {
		return (${
			compileTokens(tokens, -1)
				.join('')
				.replace(R_CLEANER, '')
				.replace(R_CONCAT, '')
		});
	};`.trim()
		.replace(R_TRIM_START, '$1"')
		.replace(R_TRIM_END, '"$1')
	;

	// Compile
	// console.log(code);
	try {
		compiled = Function(`__ICUFN__`, code)(
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

export function compileTokens(tokens: AST, idxOffset: number): string[] {
	const source = [] as string [];

	function write(code: string) {
		source.push(code);
	}

	(function processing(tokens: AST, idx: number) {
		write('""');

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			const head = token[0];

			switch (icu.getTokenType(token)) {
				case Token.String:
					if (token !== EMPTY_STRING) {
						write(`+ ${stringify(token)}\n`);
					}
					break;

				case Token.Simple:
					if (head === HASH_BANG) {
						write(`+ __vls__[${idx}]._\n`);
					} else {
						idx = icu.parseTokenIdx(token, -1);
						write(`+ __vls__[${idx}]\n`);
					}
					break;

				case Token.Typed:
					throw "todo: Token.Typed";
					break;

				case Token.Styled:
					idx = icu.parseTokenIdx(token, idxOffset);
					write(`+ __ICUFN__.select(__vls__[${idx}], {`);

					Object.keys(token[2]).forEach((key) => {
						write(`${stringify(key)}: (`);
						processing(token[2][key], idx);
						write(`),\n`);
					});

					write(`})`);
					break;

				case Token.Plural:
					idx = icu.parseTokenIdx(token, idxOffset);
					write(`+ __ICUFN__.plural(__vls__[${idx}], ${token[2]}, {`);

					const excep = [] as string[];
					const writeSub = (key: string, asKey: string) => {
						write(`${stringify(asKey)}: (`);
						processing(token[3][key], idx);
						write(`),\n`);
					};

					Object.keys(token[3]).forEach((key) => {
						if (key.charAt(0) === EQUAL) {
							excep.push(key);
						} else {
							writeSub(key, key);
						}
					});

					if (excep.length) {
						write(`"=": {`);
						excep.forEach((key) => {
							writeSub(key, key.substr(1));
						});
						write(`},`);
					}

					write(`})`);
					break;
			}
		}
	})(tokens, 0);

	return source;
}