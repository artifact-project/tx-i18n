import * as React from 'react';

export const Static = () => (
	<div className={'host'}>Вова, купи&nbsp;"гречу"!</div>
);

export const Entities = () => (
	<div className={'host'}>
		<p title="Foo bar">
			<h2>Left &mdash; Right</h2>
		</p>
		<div>
			<Input
				hint="Space &mdash; bar"
				mode="text"
			/>
		</div>
		<div>
			Enter:
			<Input
				hint="User&#8209;name"
				mode="text"
			/>
		</div>
	</div>
);

export const Hello = ({username}) => (
	<div className={`host`}>Привет {username}-кун!1</div>
);

export const ClickHere = ({username}) => (
	<div>
		Привет&nbsp;{username}, нажми <a href="#">здесь</a> чтобы продолжить.
	</div>
);

export const Input = ({hint, mode}) => (
	<div className={`input ${mode}`}>
		{/* note: Bla-bla-bla */}
		<input placeholder={`Подсказка: ${hint}`}/>
		<button value="Войти"/>
	</div>
);

export const InputWithText = ({hint, mode}) => (
	<div className={`input ${mode}`}>
		Представьтесь: {/* note: hmmm */}
		<input placeholder={`Подсказка: ${hint}`}/>
		<button value="Войти"/>
	</div>
);

export const Fragment = () => (
	<div>
		<>Простой текст</>
		<>Фрагмент и <i/></>
	</div>
);
