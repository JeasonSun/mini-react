import { HostText, Fragment } from './ReactWorkTags';
import { ReactElement, Props } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import {
	createFiberFromElement,
	createFiberFromFragment,
	createWorkInProgress,
	FiberNode
} from './ReactFiber';
import { ChildDeletion, Placement } from './ReactFiberFlags';

type ExistingChildren = Map<string | number, FiberNode>;

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

	function deleteRemainingChildren(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null
	) {
		if (!shouldTrackEffects) {
			return;
		}
		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
	}

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		element: ReactElement
	) {
		const key = element.key;
		let child = currentFirstChild;

		while (child !== null) {
			if (child?.key === key) {
				const elementType = element.type;
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					// 如果key相同，并且 elementType 相同，那么复用老的 fiber
					if (elementType === child.elementType) {
						// 对于fragment，属性应该是children
						let props = element.props;
						if (elementType === REACT_FRAGMENT_TYPE) {
							props = element.props.children;
						}
						const existing = useFiber(child, props);
						existing.return = returnFiber;
						deleteRemainingChildren(returnFiber, child.sibling);
						return existing;
					}
					// 如果 elementType 不相同， 那么需要删除老的
					// deleteChild(returnFiber, child);
					deleteRemainingChildren(returnFiber, child);
					break;
				} else {
					if (__DEV__) {
						console.warn('还没有实现的 React 类型', element);
					}
					break;
				}
			} else {
				deleteChild(returnFiber, child);
				child = child.sibling;
			}
		}

		let fiber;
		if (element.type === REACT_FRAGMENT_TYPE) {
			fiber = createFiberFromFragment(element.props.children, key);
		} else {
			fiber = createFiberFromElement(element);
		}

		fiber.return = returnFiber;
		return fiber;
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

	/**
	 * 原则：能复用就复用，不能复用就创建
	 * 步骤：
	 * 1. 构建current 子节点的Map 信息
	 * 2. 循环newChild， 在Map中判断是否可以复用，不能复用创建新的fiber
	 * 3. 标记移动或者创建的Flag
	 * 4. 删除Map中剩余的没有用的节点
	 * 5. 返回第一个儿子节点
	 */
	function reconcileChildArray(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any[]
	) {
		let firstNewFiber: FiberNode | null = null;
		let lastNewFiber: FiberNode | null = null;
		let lastPlacedIndex = 0;

		// 1.构建Map
		const existingChildren: ExistingChildren = new Map();
		let current = currentFirstChild;
		while (current !== null) {
			const keyToUse = current.key !== null ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}

		// 2. 循环newChild
		for (let i = 0; i < newChild.length; i++) {
			const after = newChild[i];
			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);
			if (newFiber === null) {
				continue;
			}

			// 3. 标记移动还是插入
			newFiber.index = i;
			newFiber.return = returnFiber;

			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				firstNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				lastNewFiber = newFiber;
			}

			if (!shouldTrackEffects) {
				continue;
			}

			const current = newFiber.alternate;
			if (current !== null) {
				// 复用的
				const oldIndex = current.index;
				if (oldIndex < lastPlacedIndex) {
					newFiber.flags |= Placement;
					continue;
				} else {
					lastPlacedIndex = oldIndex;
				}
			} else {
				// mount
				newFiber.flags |= Placement;
			}
		}
		// 4. 将 Map 中剩下的都标记为删除
		existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber);
		});
		return firstNewFiber;
	}

	function updateFromMap(
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any
	) {
		const keyToUse = element.key !== null ? element.key : index;

		const before = existingChildren.get(keyToUse);

		if (typeof element === 'string' || typeof element === 'number') {
			if (before) {
				if (before.tag === HostText) {
					// 复用
					existingChildren.delete(keyToUse);
					return useFiber(before, { content: element + '' });
				}
			}
			// 创建文本fiber
			return new FiberNode(HostText, { content: element + '' }, null);
		}
		// TIP: 这边卡颂的判断又有问题
		if (Array.isArray(element)) {
			return updateFragment(
				returnFiber,
				before,
				element,
				keyToUse,
				existingChildren
			);
		}

		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (element.type === REACT_FRAGMENT_TYPE) {
						// TIP 这边应该是子元素 element.props.children
						return updateFragment(
							returnFiber,
							before,
							element.props.children,
							keyToUse,
							existingChildren
						);
					}
					if (before) {
						if (element.type === before.elementType) {
							// 复用
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}
					// 创建
					return createFiberFromElement(element);
				default:
					if (__DEV__) {
						console.warn('updateFromMap 还没有实现的child 类型');
					}
					break;
			}
		}
		return null;
	}

	function updateFragment(
		returnFiber: FiberNode,
		current: FiberNode | undefined,
		elements: any[],
		key: Key,
		existingChildren: ExistingChildren
	) {
		let fiber;
		if (!current || current.tag !== Fragment) {
			fiber = createFiberFromFragment(elements, key);
		} else {
			existingChildren.delete(key);
			fiber = useFiber(current, elements);
		}
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild?: ReactElement
	) {
		const isUnKeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null;
		if (isUnKeyedTopLevelFragment) {
			newChild = newChild.props.children;
		}

		// TODO: newChild 是数组的情况
		if (Array.isArray(newChild)) {
			return reconcileChildArray(returnFiber, currentFirstChild, newChild);
		}
		// 判断当前 fiber 的类型
		if (typeof newChild === 'object' && newChild) {
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
