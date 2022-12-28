import { HostRoot } from './ReactWorkTags';
import { FiberNode } from './ReactFiber';
import { Dispatch } from 'shared/ReactTypes';

export type Update<State> = {
	payload: any;
	next: Update<State> | null;
};

type SharedQueue<State> = {
	pending: Update<State> | null;
};

export type UpdateQueue<State> = {
	baseState: any;
	firstBaseUpdate: Update<State> | null;
	lastBaseUpdate: Update<State> | null;
	shared: SharedQueue<State>;
	dispatch: Dispatch<State> | null;
};

// export type UpdateQueue

/**
 * 给 fiber 初始化 updateQueue
 * @param fiber fiber节点
 */
export function initializeUpdateQueue<State>(fiber: FiberNode) {
	const queue: UpdateQueue<State> = createUpdateQueue();
	queue.baseState = fiber.memoizedProps;
	fiber.updateQueue = queue;
}

/**
 * 创建一个 update
 */
export function createUpdate<State>(): Update<State> {
	const update = {
		payload: null,
		next: null
	};
	return update;
}

export function createUpdateQueue<State>(): UpdateQueue<State> {
	return {
		baseState: null,
		firstBaseUpdate: null,
		lastBaseUpdate: null,
		shared: {
			pending: null
		},
		dispatch: null
	};
}

/**
 * 源码中还需要判断是否是 interleaved update（插入的更新）
 */
export function enqueueUpdate<State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) {
	if (updateQueue === null) {
		return null;
	}
	const sharedQueue = updateQueue.shared;

	const pending = sharedQueue.pending;
	if (pending === null) {
		update.next = update;
	} else {
		update.next = pending.next;
		pending.next = update;
	}
	sharedQueue.pending = update;
}

export function markUpdateFromFiberToRoot(sourceFiber: FiberNode) {
	let node = sourceFiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = parent.return;
	}
	return node.tag === HostRoot ? node.stateNode : null;
}

/**
 * 源码中 processUpdateQueue 第一个入参是 workInProgress
 * 这里更改成 UpdateQueue
 * 因为 fiber.updateQueue 和 hook.updateQueue 从操作上是一致的
 * 源码中 fiber.updateQueue 有一个shared 属性指向一个 sharedQueue，sharedQueue.pending指向一个环形链表。
 * hook.updateQueue 没有shared 属性，hook.updateQueue.pending直接指向了一个环形链表。
 * 这里暂时改成一样的结构，使用一样的逻辑。
 */
export function processUpdateQueue<State>(
	queue: UpdateQueue<State>,
	props?: any
): { memoizedState: State } {
	// const queue: UpdateQueue<State> = workInProgress.updateQueue;

	let firstBaseUpdate = queue.firstBaseUpdate;
	let lastBaseUpdate = queue.lastBaseUpdate;

	const pendingQueue = queue.shared.pending;

	// 有 pendingQueue， 则把pendingQueue 断开环状链表，并且添加到 firstBaseUpdate 链表。
	if (pendingQueue !== null) {
		queue.shared.pending = null;
		const lastPendingUpdate = pendingQueue;
		const firstPendingUpdate = lastPendingUpdate.next;
		lastPendingUpdate.next = null; // 断开环状链表。
		if (lastBaseUpdate === null) {
			firstBaseUpdate = firstPendingUpdate;
		} else {
			lastBaseUpdate.next = firstPendingUpdate;
		}
		lastBaseUpdate = lastPendingUpdate;
	}

	if (firstBaseUpdate !== null) {
		let newState = queue.baseState;

		let update: Update<State> | null = firstBaseUpdate;

		do {
			newState = getStateFromUpdate(update, newState, props);
			update = update.next;
			if (update === null) {
				break;
			}
		} while (true);

		queue.baseState = newState;
		queue.firstBaseUpdate = null;
		queue.lastBaseUpdate = null;
	}
	return { memoizedState: queue.baseState };
}

/**
 * 源码中海油workInProgress/queue/instance 等入参
 */
function getStateFromUpdate<State>(
	update: Update<State>,
	prevState: State,
	nextProps: any
) {
	// 源码中会根据不同的update做不同的处理
	// 现在是处理 state 的 update

	const payload = update.payload;
	let partialState;
	if (typeof payload === 'function') {
		partialState = payload.call(null, prevState, nextProps);
	} else {
		partialState = payload;
	}
	if (partialState === null || partialState === undefined) {
		return prevState;
	}

	if (typeof partialState === 'string' || typeof partialState === 'number') {
		return partialState;
	}

	return Object.assign({}, prevState, partialState);
}
