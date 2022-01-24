import { Plural } from '@artifact-project/i18n';
import { icu, Token } from '../utils/icu';
import { AST } from 'format-message-parse';

const EMPTY_STRING = '';
const HASH_BANG = '#';
const EQUAL = '=';

const COMPILED = {} as Record<string, (parts: any[]) => string>;

export function textCompile(
	phrase: string,
	plural?: Plural<any>,
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

	// Compile
	// console.log(code);
	try {
		const string = createInterpolateString(icu.fn({ plural }));
		
		initInterpolateString(
			string,
			tokens,
			-1,
		);

		compiled = function (values: Record<number, any>) {
			string.value = null;
			string.values = values;
			return string.toString();
		};
	} catch (err) {
		compiled = () => phrase;
		console.warn(`Parse failed: "${phrase}"`);
		console.error(err);
	}

	COMPILED[phrase] = compiled;
	return compiled;
}

export function initInterpolateString(
	rootString: InterpolateString,
	tokens: AST,
	idxOffset: number,
) {
	(function processing(string: InterpolateString, tokens: AST, idx: number) {
		const list = string.list = [] as InterpolateInstruction[];

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			const type = icu.getTokenType(token);
			const head = token[0];

			switch (icu.getTokenType(token)) {
				case Token.String:
					if (token !== EMPTY_STRING) {
						list.push({type, raw: token as string})
					}
					break;

				case Token.Simple:
					if (head === HASH_BANG) {
						list.push({type, idx, hashBang: true});
					} else {
						idx = icu.parseTokenIdx(token, -1);
						list.push({type, idx});
					}
					break;

				case Token.Typed:
					throw "todo: Token.Typed";
					break;

				case Token.Styled:
					idx = icu.parseTokenIdx(token, idxOffset);
					list.push({
						type,
						idx,
						sub: Object.keys(token[2]).reduce((sub, key) => {
							sub[key] = string.next();
							processing(sub[key], token[2][key], idx);
							return sub;
						}, {} as InterpolateInstruction['sub']),
					});
					break;

				case Token.Plural:
					idx = icu.parseTokenIdx(token, idxOffset);
					list.push({
						type,
						idx,
						num: token[2] as number,
						sub: Object.keys(token[3]).reduce((sub, key) => {
							const subStr = string.next();
							processing(subStr, token[3][key], idx);
							
							if (key.charAt(0) === EQUAL) {
								sub['='][+key.slice(1)] = subStr;
							} else {
								sub[key] = subStr;
							}

							return sub;
						}, {'=': {}} as InterpolateInstruction['sub']),
					});
					break;
			}
		}
	})(rootString, tokens, 0);
}

type InterpolateInstruction = {
	type: Token;
	raw?: string;
	idx?: number;
	hashBang?: boolean;
	num?: number;
	sub?: Record<string, InterpolateString> & {'='?: Record<string, InterpolateString>};
}

export type InterpolateString = {
	icu: ReturnType<typeof icu.fn>;
	list: InterpolateInstruction[];
	values: Record<number, any>;
	value: string | null;
	
	next(): InterpolateString;
	indexOf(search: string): number;
	toString(): string;
}

export function createInterpolateString(icuTools: ReturnType<typeof icu.fn>): InterpolateString {
	return {
		icu: icuTools,
		list: [],
		values: {},
		value: null,
		indexOf: interpolateStringIndexOf,
		next: nextInterpolateStringNext,
		toString: interpolateString,
	};
}

function interpolateStringIndexOf(this: InterpolateString, search: string) {
	return this.toString().indexOf(search);
}

function nextInterpolateStringNext(this: InterpolateString) {
	const ns: InterpolateString = Object.create(this);
	ns.value = null;
	return ns;
}

function interpolateString(this: InterpolateString) {
	if (this.value !== null) {
		return this.value;
	}

	const list = this.list;
	const values = this.values || {};
	let result = '';
	
	for (let i = 0, n = list.length; i < n; i++) {
		const item = list[i];
		const value = values[item.idx];

		switch (item.type) {
			case Token.String:
				result += item.raw;
				break;

			case Token.Simple:
				result += item.hashBang ? value._ : value;
				break;

			case Token.Styled:
				result += this.icu.select(value, item.sub);
				break;

			case Token.Plural:
				result += this.icu.plural(value, item.num, item.sub);
				// console.log(values[item.idx], item.num, item.sub);
				break;

			default:
				throw new Error('Not implemented');
		};
	}

	this.value = result;

	return result;
}
