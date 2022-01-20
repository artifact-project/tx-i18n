import parse, { Element } from 'format-message-parse';
import { Plural } from '@artifact-project/i18n';

const isArray = Array.isArray;
const R_ICU_ESCAPE = /[{}]/g;
const R_NOT_NUMBER = /[^\d]+/g;
const HTML_TAG_TYPE = 'HTML_TAG';

export type ICUFuncStore = {
	plural: Plural<string, any>;
	select?: (val: any, sub: object) => any;
}

export type ICUFuncCall<T> = {$: T, _: any};

export const enum Token {
	String,
	Simple,
	Plural,
	Typed,
	Styled,
	Tag,
};

type ICUParseOptions = {
	tags?: boolean
}

export const icu = {
	parse: (value: string, options: ICUParseOptions = {}) => {
		return parse(value, {
			tagsType: options.tags ? HTML_TAG_TYPE : undefined,
		})
	},

	quote(val: string) {
		return val ? val.replace(R_ICU_ESCAPE, `'$&`) : val;
	},

	getTokenType(token: Element): Token {
		if (isArray(token)) {
			switch (token.length) {
				case 1: return Token.Simple;
				case 2: return token[1] === HTML_TAG_TYPE ? Token.Tag : Token.Typed;
				case 3: return token[1] === HTML_TAG_TYPE ? Token.Tag : Token.Styled;
				case 4: return Token.Plural;
			}
		}

		return Token.String
	},

	parseTokenIdx(token: Element, offset: number) {
		return +token[0].replace(R_NOT_NUMBER, '') + offset;
	},

	fn: (store: ICUFuncStore) => ({
		select(fn: ICUFuncCall<typeof store.select>, messages: object) {
			if (fn == null) {
				return 'icu:select:failed';
			}
			return (fn.$ || store.select)(fn._, messages);
		},

		plural(fn: ICUFuncCall<typeof store.plural>, offset: number, messages: object) {
			if (fn == null) {
				return 'icu:plural:failed';
			}
			return (fn.$ || store.plural)(fn._ + offset, messages);
		},
	}),
}