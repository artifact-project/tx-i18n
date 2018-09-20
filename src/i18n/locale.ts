let LANG = 'default';

const LOCALES = {
	[LANG]: {},
} as {
	[lang:string]: ContextedLocale;
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

export function setLang(name: string) {
	if (LANG !== name) {
		const old = LANG;
		LANG = name;
		observers.forEach(fn => {
			fn(LANG, old);
		});
	}
}

export function getLang(): string {
	return LANG;
}

export function getLocale(lang: string): ContextedLocale {
	return LOCALES[lang];
}

export function setLocale(lang: 'default' | string, locale: ContextedLocale) {
	LOCALES[lang] = locale;
}

export function setDefaultLocale(locale: ContextedLocale) {
	setLocale('default', locale);
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