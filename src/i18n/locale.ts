import { Plural } from '@artifact-project/i18n';

let LANG = 'default';

const LOCALES = {
	[LANG]: {},
} as {
	[lang:string]: ContextedLocale;
};
const PLURAL = {
	[LANG]: null,
} as {
	[lang:string]: Plural<any> | null;
};

export type LangObserver = (newLang: string, oldLang: string) => void;

const observers: LangObserver[] = [];

export type Locale = {
	[phrase:string]: string;
}

export type ContextedLocale = {
	[context:string]: {
		[phrase:string]: string;
	};
}

export function addLangObserver(fn: LangObserver) {
	observers.push(fn);

	return () => {
		observers.splice(observers.indexOf(fn), 1);
	};
}

export function setLang(code: string) {
	if (LANG !== code) {
		const prev = LANG;
		
		LANG = code;

		observers.forEach(fn => {
			fn(LANG, prev);
		});
	}
}

export function getLang() {
	return LANG;
}

export function getPlural(): Plural<any> | null {
	return PLURAL[LANG];
}

export function setPlural<C extends string>(lang: C, plural: Plural<any>) {
	return PLURAL[lang] = plural;
}

export function setDefaultPlural(plural: Plural<any>) {
	setPlural('default', plural);
}

export function getLocale(lang: string): ContextedLocale {
	return LOCALES[lang];
}

export function setLocale<C extends string>(
	lang: 'default' | C,
	locale: ContextedLocale,
	plural: Plural<any>,
) {
	LOCALES[lang] = locale;
	setPlural(lang, plural);
}

export function setDefaultLocale(locale: ContextedLocale, plural: Plural<any>) {
	setLocale('default', locale, plural);
}

export function getTranslate(phrase: string, lang = LANG, ctx: string = 'default'): string {
	if (LOCALES.hasOwnProperty(lang)) {
		if (
			LOCALES[lang].hasOwnProperty(ctx)
			&& LOCALES[lang][ctx].hasOwnProperty(phrase)
		) {
			return LOCALES[lang][ctx][phrase];
		} else if (
			ctx !== 'default'
			&& LOCALES[lang].hasOwnProperty('default')
			&& LOCALES[lang].default.hasOwnProperty(phrase)
		) {
			return LOCALES[lang].default[phrase];
		}
	}

	// todo: warning not translated phrase
	return phrase;
}