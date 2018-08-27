import * as React from 'react';

export const Static = () => (
	<div className={'host'}>Вова, купи "гречу"!</div>
);

export const Hello = ({username}) => (
	<div className={`host`}>Привет {username}-кун!1</div>
);

export const ClickHere = ({username}) => (
	<div>
		Привет {username}, нажми <a href="#">здесь</a> чтобы продолжить.
	</div>
);

export const Input = ({hint, mode}) => (
	<div className={`input ${mode}`}>
		<input placeholder={`Подсказка: ${hint}`}/>
		<button value="Войти"/>
	</div>
);

export const InputWithText = ({hint, mode}) => (
	<div className={`input ${mode}`}>
		Представьтесь:
		<input placeholder={`Подсказка: ${hint}`}/>
		<button value="Войти"/>
	</div>
);
