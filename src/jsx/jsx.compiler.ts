import { Plural } from '@artifact-project/i18n';
import { icu, Token } from '../utils/icu';
import { AST, Element } from 'format-message-parse';
import { htmlDecode } from '../utils/entities';
import { InterpolateString, createInterpolateString, initInterpolateString } from '../i18n/i18n.compiler';

const EMPTY_ARRAY = [];
const EMPTY_STRING = '';
const HASH_BANG = '#';

const COMPILED = {} as Record<string, (parts: any[]) => LikeJSXElement>;

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

	const icuTools = icu.fn({ plural });
	const tokenCache = new Map<Element, {
		type: Token;
		idx: number | null;
		raw?: string;
		plural: InterpolateString | null;
	}>()
	

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

	// Tokens processing
	// console.log(tokens);
	function processing(values: any, tokens: AST, idx: number) {
		const el = values[idx];
		const args = [el.type, el.props];
		// write(`($$$ = __vls__[${idx}], __CREATE__($$$.type, $$$.props`);

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			const cache = tokenCache.get(token) || {
				type: icu.getTokenType(token),
				idx: null,
				plural: null,
			};

			switch (cache.type) {
				case Token.String:
					if (token !== EMPTY_STRING) {
						const raw = cache.raw || htmlDecode(token as string);
						cache.raw = raw;
						args.push(raw);
					}
					break;

				case Token.Simple:
					idx = cache.idx === null ? icu.parseTokenIdx(token, 0) : cache.idx;
					cache.idx = idx;
					args.push(token[0] === HASH_BANG ? values[idx]._ : values[idx]);
					break;

				case Token.Tag:
					idx = cache.idx === null ? icu.parseTokenIdx(token, 0) : cache.idx;
					cache.idx = idx;

					if (token.length === 3) {
						args.push(processing(values, (token[2] as any).children, idx));
					} else {
						args.push(processing(values, EMPTY_ARRAY, idx));
					}
					break;

				case Token.Typed:
					throw new Error("todo: Token.Typed");

				case Token.Styled:
					throw new Error("todo: Token.Typed");

				case Token.Plural:
					if (cache.plural === null) {
						cache.plural = createInterpolateString(icuTools);
						initInterpolateString(cache.plural, [token], 0);
					}

					cache.plural.value = null;
					cache.plural.values = values;

					args.push(cache.plural.toString());
					break;
			}

			tokenCache.set(token, cache);
		}

		return args.length === 2
			? createElement(el.type, el.props)
			: args.length === 2
			? createElement(el.type, el.props. args[2])
			: createElement.apply(null, args)
	}

	// Compile
	// console.log(code);
	try {
		compiled = function (values: any) {
			return processing(values, tokens, 0)
		}
	} catch (err) {
		compiled = () => phrase;
		console.warn(`Parse failed: "${phrase}"`);
		console.error(err);
	}

	COMPILED[phrase] = compiled;
	return compiled;
}
