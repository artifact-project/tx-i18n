import * as React from 'react';

const username = 'Рубаха';

export const Hello = ({name}) => (
	<div className={`host`} title="Демо">
		<h1>Привет, <b>{name}</b>!</h1>
		<div>Мы рады видеть тебя!</div>
	</div>
);