import { createElement, useState, useEffect } from 'react';
import addons, { types } from '@storybook/addons';
import { API } from '@storybook/api';
import { IconButton, Icons, TooltipLinkList, WithTooltip } from '@storybook/components';
import { ADDON_ID, PANEL_ID, ADDON_TITLE, ADDON_EVENT_SET, ADDON_EVENT_REGISTER } from './shared';
import { setLang } from '../src/i18n/locale';

addons.register(ADDON_ID, (api: API) => {
	addons.add(PANEL_ID, {
		type: types.TOOL,
		title: ADDON_TITLE,
		match: ({ viewMode }) => viewMode === 'story',
		render: () => createElement(LangSelector, { api }),
	});
});

type LangSelectorProps = {
	api: API;
}

function LangSelector({ api }: LangSelectorProps) {
	const [defaultLang, setDefaultLang] = useState('ru');
	const [langList, setLangList] = useState([]);
	const [activeLang, setActiveLang] = useState(defaultLang);
	const links = langList.map(lang => ({
		id: lang,
		title: lang,
		value: lang,
		active: activeLang === lang,
		onClick: () => {
			console.log(`[tx-i18n] Switch lang from "${activeLang}" to "${lang}"`);
			setActiveLang(lang);
			setLang(lang);
			api.emit(ADDON_EVENT_SET, lang);
    		api.setQueryParams({ lang });
		},
	}));

	useEffect(() => {
		setLang(defaultLang);
	}, [defaultLang]);

	useEffect(() => {
		function handle({locales, defaultLang}) {
			const langs = Object.keys(locales);

			if (!langs.includes(defaultLang)) {
				langs.unshift(defaultLang);
			}

			setDefaultLang(defaultLang);
			setLangList(langs);
		}

		api.on(ADDON_EVENT_REGISTER, handle);
		return () => {
			api.off(ADDON_EVENT_REGISTER, handle);
		};
	}, [api]);

	return createElement(WithTooltip, {
		placement: 'top',
		trigger: 'click',
		tooltip: createElement(TooltipLinkList, {links}),
		closeOnClick: true,
		children: createElement(
			IconButton,
			{ active: activeLang !== defaultLang, title: 'Switch the lang of the preview' },
			createElement(Icons, {icon: 'globe'}),
		),
	});
}
