import * as React from 'react';
import { Hello } from './react';

export const DeepHello = (props) => {
	return <div>
		<Hello {...props}/> или Нет!
	</div>
};

export const Button = ({name, text, hint}) => {
	return <button name={name} value={text} title={hint}/>
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

export class Dialog extends React.Component<any> {
	innerRender(props) {
	}


	render() {
		const {props} = this;

		return (
			<div className="host">
				<h1>Alert</h1>
				<Form controls={
					<div title="Подвал">
						<Button
							name="submit"
							text="Хорошо"
							hint={`Подсказка: ${123}!`}
						/>
						<button value="Отмена" data-id={`рав-текст`}/>
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
						<div>
							{this.innerRender({...props, value: 'Тест'})}
							Окей
						</div>
					</fieldset>
				</Form>
			</div>
		);
	}
}
