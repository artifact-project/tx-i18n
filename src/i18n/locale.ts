let LANG = 'default';

const LOCALES = {
	[LANG]: {},
};

export type Locale = {
	[phrase:string]: string;
}

export function setLang(name: string) {
	LANG = name;
}

export function getLang() {
	return LANG;
}

export function setLocale(lang: 'default' | string, locale: Locale) {
	LOCALES[lang] = locale;
}

export function createLocale(originalPhrases: string[], translatedPhrases: string[]): Locale{
	return originalPhrases.reduce((locale, phrase, idx) => {
		locale[phrase] = translatedPhrases.length < idx ? translatedPhrases[idx] : phrase;
		return locale;
	}, {});
}

export function setDefaultLocale(locale: Locale) {
	setLocale('default', locale);
}

export function getTranslate(phrase: string) {
	if (LOCALES.hasOwnProperty(LANG) && LOCALES[LANG].hasOwnProperty(phrase)) {
		return LOCALES[LANG][phrase];
	}

	// todo: warning not translated phrase
	return phrase;
}