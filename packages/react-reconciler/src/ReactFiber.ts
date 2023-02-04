import { Props, Key, Ref, ReactElement } from 'shared/ReactTypes';
import { Flags, NoFlags } from './ReactFiberFlags';
import {
	HostComponent,
	HostRoot,
	WorkTag,
	FunctionComponent,
	Fragment
} from './ReactWorkTags';

export class FiberNode {
	tag: WorkTag;
	key: Key;
	stateNode: any;
	type: any;
	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;
	ref: Ref;
	pendingProps: Props;
	memoizedProps: Props | null;
	alternate: FiberNode | null;
	flags: Flags;
	subtreeFlags: Flags;
	deletions: FiberNode[] | null;
	elementType: any;
	updateQueue: any;
	memoizedState: any;
	dependencies: any;
	nextEffect: FiberNode | null;
	firstEffect: FiberNode | null;
	lastEffect: FiberNode | null;
	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// ========== 实例属性: 作为静态的数据结构，保存节点的信息 =============
		/**
		 * Fiber类型：WorkTag
		 * 例如： Class B extends React.Component 类组件对应的tag = 1
		 */
		this.tag = tag;
		this.key = key;
		this.elementType = null; // 元素类型
		/**
		 * type:
		 * - FunctionComponent: const App = () => {} eg: { type: f App() }
		 * - ClassComponent: Class B extends React.Component  eg: { type: f B() }
		 * - HostComponent: 指DOM节点的标签名， <div>123</div>   eg: { type: 'div' }
		 */
		this.type = null;

		/**
		 * stateNode: 关联局部状态节点
		 * 例如：
		 * - HostComponent: 对应真实的DOM节点
		 * - ClassComponent: 对应class实例
		 */
		this.stateNode = null;

		// ============== 构建属性：构成树状结构 FiberTree ================
		this.return = null; // 指向父
		this.sibling = null; // 指向兄弟
		this.child = null; // 指向第一个孩子
		this.index = 0; // 兄弟节点中的序列

		this.ref = null;

		// ============== Work（工作属性） ================
		// ==== 更新状态的相关信息 =======
		this.pendingProps = pendingProps; // 从父组件传来的props
		this.memoizedProps = null; // 上一次渲染所使用的props
		this.updateQueue = null; // 存储state更新的队列，改动后，会创建一个update对象添加到队列中
		this.memoizedState = null; // 上一次渲染所使用的state
		this.dependencies = null; // 该fiber节点所依赖的(contexts, events)等

		// ========= 更新导致的DOM操作，打标签，并保存在effectList单向链表中 ========
		this.flags = NoFlags; // 表示当前fiber如何更新（插入/更新/删除）
		this.subtreeFlags = NoFlags;
		this.deletions = null;

		this.nextEffect = null; // 下一个需要更新的fiber
		this.firstEffect = null; // 指向所有子节点里，需要更新的fiber里的第一个
		this.lastEffect = null; // 指向所有子节点中需要更新的fiber的最后一个

		// ======= 调度优先级相关 =========
		// this.lanes = NoLanes;  // 当前节点的优先级
		// this.childLanes = NoLanes;  // 子节点的优先级

		// ==== Update =====
		this.alternate = null; // 指向内存中另一个 fiber。 current树和workInprogress树 之间相互引用。
	}
}

export const createFiber = function (
	tag: WorkTag,
	pendingProps: Props,
	key: Key
): FiberNode {
	return new FiberNode(tag, pendingProps, key);
};

export function createHostRootFiber(): FiberNode {
	return createFiber(HostRoot, {}, null);
}

export function createWorkInProgress(current: FiberNode, pendingProps: Props) {
	let workInProgress = current.alternate;
	if (workInProgress === null) {
		// mount
		workInProgress = createFiber(current.tag, pendingProps, current.key);
		workInProgress.elementType = current.elementType;
		workInProgress.type = current.type;
		workInProgress.stateNode = current.stateNode;
		workInProgress.alternate = current;
		current.alternate = workInProgress;
	} else {
		// update
		workInProgress.pendingProps = pendingProps;
		workInProgress.type = current.type;
		workInProgress.flags = NoFlags;
		workInProgress.subtreeFlags = NoFlags;
		workInProgress.deletions = null;
	}
	workInProgress.memoizedProps = current.memoizedProps;
	workInProgress.memoizedState = current.memoizedState;
	workInProgress.updateQueue = current.updateQueue;
	workInProgress.child = current.child;
	workInProgress.sibling = current.sibling;
	workInProgress.ref = current.ref;

	return workInProgress;
}

/**
 * 将 ReactElement 转为 Fiber对象
 * @param element
 * @returns
 */
export function createFiberFromElement(element: ReactElement) {
	const { key, type, props } = element;
	let fiberTag: WorkTag;
	if (typeof type === 'string') {
		fiberTag = HostComponent;
	} else if (typeof type === 'function') {
		fiberTag = FunctionComponent;
	} else {
		if (__DEV__) {
			console.error('尚未处理此type的ReactElement', element);
		}
		fiberTag = FunctionComponent;
	}

	const fiber = createFiber(fiberTag, props, key);
	fiber.type = type; // 源码中，type 需要会根据不同的组件类型 处理
	fiber.elementType = type;
	return fiber;
}

export function createFiberFromFragment(elements: any[], key: Key): FiberNode {
	const fiber = new FiberNode(Fragment, elements, key);
	return fiber;
}
