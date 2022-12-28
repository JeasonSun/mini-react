import internals from 'shared/internals';
import { Action, Dispatch, Dispatcher } from 'shared/ReactTypes';
import { FiberNode } from './ReactFiber';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	UpdateQueue
} from './ReactFiberUpdateQueue';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';

// 当前正在渲染的Fiber
let currentlyRenderingFiber: FiberNode | null = null;
// 处理中的 hook
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

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
	workInProgress.updateQueue = null;

	const current = workInProgress.alternate;
	if (current !== null) {
		// update
		ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
	} else {
		// mount
		ReactCurrentDispatcher.current = HooksDispatcherOnMount;
	}
	const Component = workInProgress.type;
	const props = workInProgress.pendingProps;
	const children = Component(props);

	// 重置操作
	currentlyRenderingFiber = null;
	workInProgressHook = null;
	currentHook = null;
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
	hook.memoizedState = memoizedState;

	const queue: UpdateQueue<State> = createUpdateQueue();
	queue.baseState = hook.memoizedState;

	hook.updateQueue = queue;

	//@ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
	queue.dispatch = dispatch;
	return [memoizedState, dispatch];
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

function dispatchSetState<State>(
	fiber: FiberNode,
	queue: UpdateQueue<State>,
	action: Action<State>
) {
	// 创建一个 update
	const update = createUpdate();
	update.payload = action;
	// 把创建的 update 对象加入到 updateQueue，形成串联的 updateQueue 链表。
	enqueueUpdate<State>(queue, update);

	scheduleUpdateOnFiber(fiber);
}

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
};

function updateState<State>(): [State, Dispatch<State>] {
	// 找到当前 useState 对应的 hook数据
	const hook = updateWorkInProgressHook();

	// 计算新 state 的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>;
	const { memoizedState } = processUpdateQueue<State>(queue);
	hook.memoizedState = memoizedState;

	return [memoizedState, queue.dispatch as Dispatch<State>];
}

function updateWorkInProgressHook() {
	let nextCurrentHook: Hook | null;
	if (currentHook === null) {
		const current = currentlyRenderingFiber?.alternate;
		if (current !== null) {
			nextCurrentHook = current?.memoizedState;
		} else {
			// mount
			nextCurrentHook = null;
		}
	} else {
		nextCurrentHook = currentHook.next;
	}
	if (nextCurrentHook === null) {
		// 1. mount 阶段
		// 2. hook 数量不一致
		throw new Error(
			`组件 ${currentlyRenderingFiber?.type} 本次执行时的 Hook 比上次执行时多`
		);
	}
	currentHook = nextCurrentHook as Hook;
	const newHook: Hook = {
		memoizedState: currentHook.memoizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	};

	if (workInProgressHook === null) {
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用 Hook ');
		} else {
			workInProgressHook = newHook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		workInProgressHook.next = newHook;
		workInProgressHook = newHook;
	}
	return workInProgressHook;
}
