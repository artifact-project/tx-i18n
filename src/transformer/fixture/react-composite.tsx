import * as React from 'react';
import { Hello } from './react';

export const DeepHello = (props) => {
	return <div>
		<Hello {...props}/> или Нет!
	</div>
};

export const Button = ({name, text}) => {
	return <button name={name} value={text}/>
}

export const Form = (props) => {
	return (
		<form>
			{props.children}
			<div>
				{props.controls}
			</div>
		</form>
	)
}

export const Dialog = (props) => (
	<div className="host">
		<h1>Alert</h1>
		<Form controls={
			<div title="Подвал">
				<Button name="submit" text="Хорошо"/>
				<button value="Отмена"/>
			</div>
		}>
			<h2>Бла-бла-бла</h2>
			<fieldset>
				<div className="row">
					<div className="col">Ширина:</div>
					<div className="col">123px</div>
				</div>
				<div className="row">
					<div className="col">
						Да{' '}
						<input type="checked"/>
					</div>
				</div>
			</fieldset>
		</Form>
	</div>
);
