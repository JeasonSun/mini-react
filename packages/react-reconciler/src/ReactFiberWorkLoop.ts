import { MutationMask, NoFlags } from './ReactFiberFlags';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode } from './ReactFiber';
import { FiberRootNode } from './ReactFiberRoot';
import { commitMutationEffects } from './commitWork';

let workInProgress: FiberNode | null = null;

export function scheduleUpdateOnFiber(root: FiberRootNode) {
	performSyncWorkOnRoot(root);
}

function performSyncWorkOnRoot(root: FiberRootNode) {
	renderRootSync(root);

	const finishedWork = root.current?.alternate || null;
	root.finishedWork = finishedWork;
	commitRoot(root);
}

function renderRootSync(root: FiberRootNode) {
	// 初始化创建一个 workInProgress
	// workInProgress 工作中的Fiber 与 current Fiber 存在 alternate 双向引用关系。
	prepareFreshStack(root);

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
		console.warn('commit 阶段开始', finishedWork);
	}
	root.finishedWork = null;

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

function prepareFreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current!, {});
}

function workLoopSync() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber);
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
