import { Dispatcher } from 'shared/ReactTypes';
import ReactCurrentDispatcher from './ReactCurrentDispatcher';

/**
 *
 * @returns Dispatcher
 */
export const resolveDispatcher = (): Dispatcher => {
	const dispatcher = ReactCurrentDispatcher.current;
	if (dispatcher === null) {
		throw new Error('hook 只能在函数组件中执行');
	}
	return dispatcher;
};

export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};
