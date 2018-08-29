let LANG = 'default';

const LOCALES = {
	[LANG]: {},
};

export type LangObserver = (newLang: string, oldLang: string) => void;

const observers: LangObserver[] = [];

export type Locale = {
	[phrase:string]: string;
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

export function getLang() {
	return LANG;
}

export function setLocale(lang: 'default' | string, locale: Locale) {
	LOCALES[lang] = locale;
}

export function setDefaultLocale(locale: Locale) {
	setLocale('default', locale);
}

export function getTranslate(phrase: string, lang = LANG) {
	if (LOCALES.hasOwnProperty(lang) && LOCALES[lang].hasOwnProperty(phrase)) {
		return LOCALES[lang][phrase];
	}

	// todo: warning not translated phrase
	return phrase;
}