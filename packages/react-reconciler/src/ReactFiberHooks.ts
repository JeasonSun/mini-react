import internals from 'shared/internals';
import { Action, Dispatch, Dispatcher } from 'shared/ReactTypes';
import { FiberNode } from './ReactFiber';

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

type Update<State> = {
	action: Action<State> | null;
	next: Update<State> | null;
};

type UpdateQueue<State> = {
	pending: Update<State> | null;
	dispatch: Dispatch<State> | null;
};

export function renderWithHooks(workInProgress: FiberNode) {
	// 赋值操作
	currentlyRenderingFiber = workInProgress;
	// 重置
	workInProgress.memoizedState = null;
	workInProgress.updateQueue = null;

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

	// 重置操作
	currentlyRenderingFiber = null;
	workInProgressHook = null;
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

	const queue: UpdateQueue<State> = {
		pending: null,
		dispatch: null
	};
	hook.updateQueue = queue;

	//@ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
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
	const update: Update<State> = {
		action,
		next: null
	};
	// 把创建的 update 对象加入到 updateQueue，形成串联的 updateQueue 链表。
	// TODO: 这里先只处理渲染阶段， 后续要处理更新阶段
	if (fiber === currentlyRenderingFiber) {
		enqueueRenderPhaseUpdate(queue, update);
	}
}

function enqueueRenderPhaseUpdate<State>(
	queue: UpdateQueue<State>,
	update: Update<State>
) {
	const pending = queue.pending;
	if (pending === null) {
		update.next = update;
	} else {
		update.next = pending.next;
		pending.next = update;
	}
	queue.pending = update;
}
