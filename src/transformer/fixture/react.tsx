import * as React from 'react';

export const Static = () => (
	<div>Вова, купи "гречу"!</div>
);

export const Hello = ({username}) => (
	<div>Привет {username}-кун!1</div>
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
