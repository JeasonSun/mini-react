import { Action } from 'shared/ReactTypes';

// const [number, setNumber] = useState(0)
// setNumber 就是一个Dispatch，它是一个函数，接受一个 state 或者 (state)=> newState 的函数。
export type Dispatch<State> = (action: Action<State>) => void;

// 定义所有的 hook
export interface Dispatcher {
	useState: <S>(initialState: (() => S) | S) => [S, Dispatch<S>];
}

const ReactCurrentDispatcher: { current: Dispatcher | null } = {
	current: null
};

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

export default ReactCurrentDispatcher;
