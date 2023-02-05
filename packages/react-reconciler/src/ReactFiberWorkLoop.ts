import {
	getHighestPriorityLane,
	Lane,
	markRootFinished,
	mergeLanes,
	NoLane,
	SyncLane
} from './ReactFiberLane';
import { MutationMask, NoFlags } from './ReactFiberFlags';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode } from './ReactFiber';
import { FiberRootNode } from './ReactFiberRoot';
import { commitMutationEffects } from './commitWork';
import { markUpdateFromFiberToRoot } from './ReactFiberUpdateQueue';
import { scheduleMicroTask } from 'hostConfig';
import { flushSyncCallbacks, scheduleSyncCallback } from './ReactSyncTaskQueue';

let workInProgress: FiberNode | null = null;
let workInProgressRenderLane: Lane = NoLane;

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
	const root = markUpdateFromFiberToRoot(fiber);
	if (root === null) {
		return null;
	}
	markRootUpdated(root, lane);
	ensureRootIsScheduled(root);

	return null;
}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
	root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

function ensureRootIsScheduled(root: FiberRootNode) {
	const updateLane = getHighestPriorityLane(root.pendingLanes);
	if (updateLane === NoLane) {
		return;
	}
	if (updateLane === SyncLane) {
		// 同步优先级，用微任务调度
		// 1. 批量处理任务，需要将批量任务暂时存储到一个队列中，然后使用微任务进行调度，合并任务。
		if (__DEV__) {
			console.log('在微任务中调度，任务优先级', updateLane);
		}
		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
		scheduleMicroTask(flushSyncCallbacks);
	} else {
		// 其他优先级 用宏任务调度
	}
}

function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
	const nextLane = getHighestPriorityLane(root.pendingLanes);

	// 因为上一轮 performSyncWorkOnRoot执行完成后， 在commitRoot 中已经去除了 lane（markRootFinished），所以这里得到的nextLane有两种情况
	// 1. 更低优先级的Lane
	// 2. NoLane
	if (nextLane !== SyncLane) {
		ensureRootIsScheduled(root);
		return;
	}

	renderRootSync(root, lane);

	const finishedWork = root.current?.alternate || null;
	root.finishedWork = finishedWork;
	root.finishedLane = lane;
	workInProgressRenderLane = NoLane;
	commitRoot(root);
}

function renderRootSync(root: FiberRootNode, lane: Lane) {
	if (__DEV__) {
		console.log('render阶段开始');
	}
	// 初始化创建一个 workInProgress
	// workInProgress 工作中的Fiber 与 current Fiber 存在 alternate 双向引用关系。
	prepareFreshStack(root, lane);

	do {
		try {
			workLoopSync();
			break;
		} catch (error) {
			console.warn('workLoop发生错误', error);
			workInProgress = null;
		}
	} while (true);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;
	if (finishedWork === null) {
		return;
	}
	if (__DEV__) {
		console.log('commit 阶段开始', finishedWork);
	}
	const lane = root.finishedLane;
	if (lane === NoLane && __DEV__) {
		console.error('commit 阶段 finishedLane 不应该是 NoLane');
	}

	root.finishedWork = null;
	root.finishedLane = NoLane;

	markRootFinished(root, lane);

	// 判断是否存在3个子阶段需要执行的操作
	// root flags root subtreeFlags
	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		commitMutationEffects(finishedWork);
		root.current = finishedWork;
	} else {
		root.current = finishedWork;
	}
}

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
	workInProgress = createWorkInProgress(root.current!, {});
	workInProgressRenderLane = lane;
}

function workLoopSync() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber, workInProgressRenderLane);
	fiber.memoizedProps = fiber.pendingProps;

	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let completedWork: FiberNode | null = fiber;
	do {
		completeWork(completedWork);
		const siblingFiber = completedWork.sibling;

		if (siblingFiber !== null) {
			workInProgress = siblingFiber;
			return;
		}
		completedWork = completedWork?.return || null;
		workInProgress = completedWork;
	} while (completedWork !== null);
}
