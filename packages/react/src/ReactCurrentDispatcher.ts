import { Dispatcher } from 'shared/ReactTypes';

const ReactCurrentDispatcher: { current: Dispatcher | null } = {
	current: null
};

export default ReactCurrentDispatcher;
