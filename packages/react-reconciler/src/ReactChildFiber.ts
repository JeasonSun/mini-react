import { HostText } from './ReactWorkTags';
import { ReactElement, Props } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import {
	createFiberFromElement,
	createWorkInProgress,
	FiberNode
} from './ReactFiber';
import { ChildDeletion, Placement } from './ReactFiberFlags';

function ChildReconciler(shouldTrackEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}

	function placeSingleChild(newFiber: FiberNode) {
		// 如果要跟踪副作用并且没有老的fiber， 那就标记为新建
		if (shouldTrackEffects && newFiber.alternate === null) {
			newFiber.flags |= Placement;
		}
		return newFiber;
	}

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		element: ReactElement
	) {
		const key = element.key;
		const child = currentFirstChild;
		// 源码中使用while， 需要处理 child.sibling
		if (child !== null) {
			if (child?.key === key) {
				const elementType = element.type;
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					// 如果key相同，并且 elementType 相同，那么复用老的 fiber
					if (elementType === child.elementType) {
						const existing = useFiber(child, element.props);
						existing.return = returnFiber;
						return existing;
					}
					// 如果 elementType 不相同， 那么需要删除老的
					deleteChild(returnFiber, child);
				} else {
					if (__DEV__) {
						console.warn('还没有实现的 React 类型', element);
					}
				}
			} else {
				deleteChild(returnFiber, child);
			}
		}

		const created = createFiberFromElement(element);
		created.return = returnFiber;
		return created;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		content: string
	) {
		if (currentFirstChild !== null) {
			if (currentFirstChild.tag === HostText) {
				const existing = useFiber(currentFirstChild, { content });
				existing.return = returnFiber;
				return existing;
			} else {
				// 如果存在老的fiber，但是tag更改了，那么就删除老的fiber
				deleteChild(returnFiber, currentFirstChild);
			}
		}

		const created = new FiberNode(HostText, { content }, null);
		created.return = returnFiber;
		return created;
	}

	function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild?: ReactElement
	) {
		// 判断当前 fiber 的类型
		if (typeof newChild === 'object' && newChild) {
			// TODO: newChild 是数组的情况
			if (Array.isArray(newChild)) {
				console.warn('还没有实现数组 children 的情况');
			}
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFirstChild, newChild)
					);
				default:
					if (__DEV__) {
						console.error('未实现的fiber类型', newChild);
					}
					break;
			}
		}

		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFirstChild, newChild + '')
			);
		}
		return null;
	}
	return reconcileChildFibers;
}

function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
