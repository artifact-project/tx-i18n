tx-i18n: Compare with
---------------------

- [tx-i18n](#tx-i18n)
- [react-intl](#react-intl)
- [react-i18n](#react-i18next)

---

### Original

```jsx
// src/compoents/Page.tsx
const Page = ({name}) => (
	<div>
		<h1>Page Header</h1>
		<div>Hi, <a href="#account" title="Open">{name}</a>.</div>
	</div>
);
```

---

### tx-i18n

```jsx
// src/compoents/Page.tsx
const Page = ({name}) => (
	<div>
		<h1>Page Header</h1>
		<div>Hi, <a href="#account" title="Open">{name}</a>.</div>
	</div>
);

// src/translate/ru.ts
export default {
	'Page Header': 'Заголовок страницы',
	'Hi, <1><#2></1>.': 'Привет, <1><#2></1>.',
	'Open': 'Открыть',
};
```

---

### react-intl

```jsx
// src/compoents/Page.tsx
const Page = ({name}, {intl}) => (
	<div>
		<h1>
			<FormattedMessage
				id="pageHeader"
				defaultMessage="Page Header"
			/>
		</h1>
		<div>
			<FormattedMessage
				id="welcome"
				defaultMessage="Hi, {name}."
				values={{
					name: <a href="#account" title={intl.messages.titleOpen}>{name}</a>
				}}
			/>
		</div>
	</div>
);

// src/translate/ru.ts
export default {
	pageHeader: 'Заголовок страницы',
	welcome: 'Привет, {name}.',
	titleOpen: 'Открыть',
};
```

---

### react-i18next

```jsx
// src/compoents/Page.tsx
const Page = ({name, t}) => (
	<div>
		<h1>{t('pageHeader')}</h1>
		<div>
			<Trans i18nKey="welcome">
				Hi, <a href="#account" title={t('titleOpen')}>{{name}}</a>.
			</Trans>
		</div>
	</div>
);

// src/translate/ru.ts
export default {
	pageHeader: 'Заголовок страницы',
	welcome: 'Привет, <1><0>{{name}}</0></1>.',
	titleOpen: 'Открыть',
};
```