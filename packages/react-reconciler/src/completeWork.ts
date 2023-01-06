import { NoFlags, Update } from './ReactFiberFlags';
import { appendInitialChild, createTextInstance } from 'hostConfig';
import {
	HostComponent,
	HostText,
	HostRoot,
	FunctionComponent
} from './ReactWorkTags';
import { FiberNode } from './ReactFiber';
import { createInstance, Instance, updateFiberProps } from 'hostConfig';

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update;
}

export const completeWork = (workInProgress: FiberNode) => {
	console.log('completeWork', workInProgress);
	// 递归中的归

	const newProps = workInProgress.pendingProps;
	const current = workInProgress.alternate;
	switch (workInProgress.tag) {
		case HostComponent:
			if (current !== null && workInProgress.stateNode) {
				// update
				// 更新后，需要同步更新 props
				updateFiberProps(workInProgress.stateNode, newProps);
			} else {
				// 1. 构建DOM
				const instance = createInstance(
					workInProgress.type,
					newProps,
					workInProgress
				);
				// 2. 将 Fiber 上已经创建的子 DOM 挂到当前的 DOM 上
				appendAllChildren(instance, workInProgress);
				workInProgress.stateNode = instance;
			}
			bubbleProperties(workInProgress);
			return null;
		case HostText:
			if (current !== null && workInProgress.stateNode) {
				// UPDATE
				const oldText = current.memoizedProps?.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(workInProgress);
				}
			} else {
				const instance = createTextInstance(newProps.content);
				workInProgress.stateNode = instance;
			}
			bubbleProperties(workInProgress);
			return null;
		case HostRoot:
			bubbleProperties(workInProgress);
			return null;

		case FunctionComponent:
			bubbleProperties(workInProgress);
			return null;

		default:
			if (__DEV__) {
				console.error('未处理的completeWork情况', workInProgress);
			}
			break;
	}
	return null;
};

function appendAllChildren(parentDOM: Instance, workInProgress: FiberNode) {
	let node = workInProgress.child;
	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parentDOM, node.stateNode);
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === workInProgress) {
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === workInProgress) {
				return;
			}
			node = node?.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

function bubbleProperties(workInProgress: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = workInProgress.child;

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		child.return = workInProgress;
		child = child.sibling;
	}
	workInProgress.subtreeFlags |= subtreeFlags;
}
