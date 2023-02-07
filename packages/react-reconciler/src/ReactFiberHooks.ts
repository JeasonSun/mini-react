import { Passive, HookHasEffect } from './ReactHookEffectTags';
import internals from 'shared/internals';
import { Action, Dispatch, Dispatcher } from 'shared/ReactTypes';
import { FiberNode } from './ReactFiber';
import { Flags, PassiveEffect } from './ReactFiberFlags';
import { Lane, requestUpdateLane, NoLane } from './ReactFiberLane';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	UpdateQueue
} from './ReactFiberUpdateQueue';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';

type EffectCallback = () => void;
type EffectDeps = any[] | null;

export interface Effect {
	tag: Flags;
	create: EffectCallback | void;
	destroy: EffectCallback | void;
	deps: EffectDeps;
	next: Effect | null;
}

export interface FCUpdateQueue<S> extends UpdateQueue<S> {
	lastEffect: Effect | null;
}

// 当前正在渲染的Fiber
let currentlyRenderingFiber: FiberNode | null = null;
// 处理中的 hook
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;
let renderLane: Lane = NoLane;

const { ReactCurrentDispatcher } = internals;

interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

export function renderWithHooks(workInProgress: FiberNode, lane: Lane) {
	// 赋值操作
	currentlyRenderingFiber = workInProgress;
	// 重置
	workInProgress.memoizedState = null;
	workInProgress.updateQueue = null;
	renderLane = lane;

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
	renderLane = NoLane;
	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState,
	useEffect: mountEffect
};
function mountEffect(create: EffectCallback | void, deps: EffectDeps | void) {
	console.log('mountEffect');
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;

	// 对于mount阶段， 都需要运行 create 副作用
	(currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;

	hook.memoizedState = pushEffect(
		Passive | HookHasEffect,
		create,
		undefined,
		nextDeps
	);
}

function pushEffect(
	hookFlags: Flags,
	create: EffectCallback | void,
	destroy: EffectCallback | void,
	deps: EffectDeps
): Effect {
	const effect: Effect = {
		tag: hookFlags,
		create,
		destroy,
		deps,
		next: null
	};
	const fiber = currentlyRenderingFiber as FiberNode;
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
	if (updateQueue === null) {
		const updateQueue = createFCUpdateQueue();
		fiber.updateQueue = updateQueue;
		effect.next = effect;
		updateQueue.lastEffect = effect;
	} else {
		const lastEffect = updateQueue.lastEffect;
		if (lastEffect === null) {
			effect.next = effect;
			updateQueue.lastEffect = effect;
		} else {
			const firstEffect = lastEffect.next;
			lastEffect.next = effect;
			effect.next = firstEffect;
			updateQueue.lastEffect = effect;
		}
	}
	return effect;
}

function createFCUpdateQueue<State>() {
	const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>;
	updateQueue.lastEffect = null;
	return updateQueue;
}

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
	const lane = requestUpdateLane();
	update.payload = action;
	update.lane = lane;
	// 把创建的 update 对象加入到 updateQueue，形成串联的 updateQueue 链表。
	enqueueUpdate<State>(queue, update);

	scheduleUpdateOnFiber(fiber, lane);
}

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState,
	useEffect: updateEffect
};

function updateEffect(create: EffectCallback | void, deps: EffectDeps | void) {
	const hook = updateWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;

	let destroy: EffectCallback | void;
	if (currentHook !== null) {
		const prevEffect = currentHook.memoizedState as Effect;
		destroy = prevEffect.destroy;

		if (nextDeps !== null) {
			// 浅比较依赖
			const prevDeps = prevEffect.deps;
			if (areHookInputsEqual(nextDeps, prevDeps)) {
				hook.memoizedState = pushEffect(Passive, create, destroy, nextDeps);
			}
		}

		// 浅比较， 不相等
		(currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;
		hook.memoizedState = pushEffect(
			Passive | HookHasEffect,
			create,
			destroy,
			nextDeps
		);
	}
}

function areHookInputsEqual(nextDeps: EffectDeps, prevDeps: EffectDeps) {
	if (prevDeps === null || nextDeps === null) {
		return false;
	}
	for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
		if (Object.is(prevDeps[i], nextDeps[i])) {
			continue;
		}
		return false;
	}
	return true;
}

function updateState<State>(): [State, Dispatch<State>] {
	// 找到当前 useState 对应的 hook数据
	const hook = updateWorkInProgressHook();

	// 计算新 state 的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>;
	const { memoizedState } = processUpdateQueue<State>(queue, {}, renderLane);
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
