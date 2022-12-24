import { createElement } from './src/createElement';
import ReactCurrentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/ReactCurrentDispatcher';

export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	ReactCurrentDispatcher
};

export default {
	version: '0.0.0',
	createElement: createElement
};
