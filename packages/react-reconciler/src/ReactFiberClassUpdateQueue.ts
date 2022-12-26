import { HostRoot } from './ReactWorkTags';
import { FiberNode } from './ReactFiber';

export type Update = {
	payload: any;
	next: Update | null;
};

type SharedQueue = {
	pending: Update | null;
};

export type UpdateQueue = {
	baseState: any;
	firstBaseUpdate: Update | null;
	lastBaseUpdate: Update | null;
	shared: SharedQueue;
	callbacks: Array<() => any> | null;
};

// export type UpdateQueue

/**
 * 给 fiber 初始化 updateQueue
 * @param fiber fiber节点
 */
export function initializeUpdateQueue(fiber: FiberNode) {
	const queue: UpdateQueue = {
		baseState: fiber.memoizedProps,
		firstBaseUpdate: null,
		lastBaseUpdate: null,
		shared: {
			pending: null
		},
		callbacks: null
	};
	fiber.updateQueue = queue;
}

export function createUpdate(): Update {
	const update = {
		payload: null,
		next: null
	};
	return update;
}

export function enqueueUpdate(fiber: FiberNode, update: Update) {
	const updateQueue = fiber.updateQueue;
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

	return markUpdateFromFiberToRoot(fiber);
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

// 暂时不用 props，现在执行
export function processUpdateQueue(workInProgress: FiberNode, props: any) {
	const queue: UpdateQueue = workInProgress.updateQueue;

	let firstBaseUpdate = queue.firstBaseUpdate;
	let lastBaseUpdate = queue.lastBaseUpdate;

	const pendingQueue = queue.shared.pending;

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

		// // TODO: current
		// const current = workInProgress.alternate;
		// if (current !== null) {
		// 	const currentQueue = current.updateQueue;
		// 	const currentLastBaseUpdate = currentQueue.lastBastUpdate;
		// 	if (currentLastBaseUpdate !== lastBaseUpdate) {
		// 		if (currentLastBaseUpdate === null) {
		// 			currentQueue.firstBaseUpdate = firstPendingUpdate;
		// 		} else {
		// 			currentLastBaseUpdate.next = firstPendingUpdate;
		// 		}
		// 		currentQueue.lastBaseUpdate = lastPendingUpdate;
		// 	}
		// }
	}

	if (firstBaseUpdate !== null) {
		let newState = queue.baseState;

		let update: Update | null = firstBaseUpdate;

		do {
			const prevState = newState;
			if (update.payload instanceof Function) {
				newState = update.payload(prevState, props);
			} else {
				newState = update.payload;
			}
			newState = { ...prevState, ...newState };
			update = update.next;
			if (update === null) {
				break;
			}
		} while (true);

		queue.baseState = newState;
		queue.firstBaseUpdate = null;
		queue.lastBaseUpdate = null;

		workInProgress.memoizedState = newState;
	}
}
