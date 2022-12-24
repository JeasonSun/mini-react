import { Dispatch } from './../../react/src/ReactCurrentDispatcher';
import { Dispatcher } from 'react/src/ReactCurrentDispatcher';
import internals from 'shared/internals';
import { FiberNode } from './ReactFiber';
import { createUpdate } from './ReactFiberClassUpdateQueue';

// 当前正在渲染的Fiber
let currentlyRenderingFiber: FiberNode | null = null;
// 处理中的 hook
let workInProgressHook: Hook | null = null;

const { ReactCurrentDispatcher } = internals;

interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

export function renderWithHooks(workInProgress: FiberNode) {
	// 赋值操作
	currentlyRenderingFiber = workInProgress;
	// 重置
	workInProgress.memoizedState = null;

	const current = workInProgress.alternate;
	if (current !== null) {
		// update
	} else {
		// mount
		ReactCurrentDispatcher.current = HooksDispatcherOnMount;
	}
	const Component = workInProgress.type;
	const props = workInProgress.pendingProps;
	const children = Component(props);
	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	// 找到当前 useState 对应的 hook 数据
	const hook = mountWorkInProgressHook();

	let memoizedState;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}
	const queue = createUpdate();
	//@ts-ignore
	return;
}

function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};
	if (workInProgressHook === null) {
		// 第一个 hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内部调用 hook');
		} else {
			workInProgressHook = hook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// mount 时候后续的hook ，添加到链表中去
		workInProgressHook.next = hook;
		workInProgressHook = hook;
	}
	return workInProgressHook;
}
