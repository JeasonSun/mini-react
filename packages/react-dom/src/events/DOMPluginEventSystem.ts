import { Container } from 'hostConfig';
import { FiberNode } from 'react-reconciler/src/ReactFiber';
import { Props } from 'shared/ReactTypes';
import { allNativeEvents, registrationNameDependencies } from './EventRegistry';
import * as SimpleEventPlugin from './SimpleEventPlugin';
import { DOMEventName, extractEvents } from './SimpleEventPlugin';

export const elementPropsKey = '__reactProps$';
export const internalInstanceKey = '__reactFiber$';

export interface DOMElement extends Element {
	[elementPropsKey]: Props;
}

export const IS_CAPTURE_PHASE = 1 << 2;

SimpleEventPlugin.registerEvents();

export const nonDelegatedEvents: Set<DOMEventName> = new Set(['cancel']);

/**
 * 事件监听
 * @param rootContainerElement
 * 源码中的处理步骤大致如下：
 * 1. 判断 rootContainerElement 是否已经监听过，防止重复监听
 * 2. 遍历 allNativeEvents，区分冒泡阶段，捕获阶段，区分有无副作用进行监听
 */
export function listenToAllSupportedEvents(rootContainerElement: Container) {
	console.log(
		rootContainerElement,
		allNativeEvents,
		registrationNameDependencies
	);
	allNativeEvents.forEach((domEventName: DOMEventName) => {
		// 是否将监听器绑定在捕获阶段
		if (!nonDelegatedEvents.has(domEventName)) {
			listenToNativeEvent(domEventName, false, rootContainerElement);
		}
		listenToNativeEvent(domEventName, true, rootContainerElement);
	});
}

/**
 * 分阶段添加监听
 * 源码中还会处理各种优先级，取消监听等逻辑
 */
function listenToNativeEvent(
	domEventName: DOMEventName,
	isCapturePhaseListener: boolean,
	target: Container
) {
	let eventSystemFlags = 0;
	if (isCapturePhaseListener) {
		eventSystemFlags |= IS_CAPTURE_PHASE;
	}
	const listener = dispatchEvent.bind(
		null,
		domEventName,
		eventSystemFlags,
		target
	);
	if (isCapturePhaseListener) {
		addEventCaptureListener(target, domEventName, listener);
	} else {
		addEventBubbleListener(target, domEventName, listener);
	}
}

function addEventCaptureListener(
	target: Container,
	eventType: DOMEventName,
	listener: EventListener
) {
	target.addEventListener(eventType, listener, true);
	return listener;
}

function addEventBubbleListener(
	target: Container,
	eventType: DOMEventName,
	listener: EventListener
) {
	target.addEventListener(eventType, listener, false);
	return listener;
}

function dispatchEvent(
	domEventName: DOMEventName,
	eventSystemFlags: number,
	targetContainer: Container,
	nativeEvent: Event
) {
	// 1. 找到对应的 fiber
	const target = nativeEvent.target;
	const instance = (target as any)[internalInstanceKey];
	// 2. 不同事件调用不同的 dispatchEvent
	// let blockedOn = findInstanceBlockingEvent(
	// 	domEventName,
	// 	eventSystemFlags,
	// 	targetContainer,
	// 	nativeEvent
	// );
	dispatchEventsForPlugins(
		domEventName,
		eventSystemFlags,
		nativeEvent,
		instance,
		targetContainer
	);
}

function dispatchEventsForPlugins(
	domEventName: DOMEventName,
	eventSystemFlags: number,
	nativeEvent: Event,
	targetInst: FiberNode | null,
	targetContainer: Container
) {
	const nativeEventTarget = nativeEvent.target;
	const dispatchQueue: any[] = [];
	extractEvents(
		dispatchQueue,
		domEventName,
		targetInst,
		nativeEvent,
		nativeEventTarget,
		eventSystemFlags,
		targetContainer
	);
	console.log(dispatchQueue, 'dispatchQueue');
}
// let return_targetInst = null;

// function findInstanceBlockingEvent(
// 	domEventName: DOMEventName,
// 	eventSystemFlags: number,
// 	targetContainer: Container,
// 	nativeEvent: Event
// ) {
// 	return_targetInst = null;
// 	// 1. 定位原生 DOM 节点
// 	const nativeEventTarget = getEventTarget(nativeEvent);
// 	// 2. 获取与DOM 节点对应的 fiber 节点
// 	console.log(nativeEventTarget);
// 	if (nativeEventTarget === null) {
// 		return;
// 	}
// 	let targetInst = getClosestInstanceFromNode(nativeEventTarget);
// 	console.log(targetInst);
// 	// if (targetInst !== null) {
// 	// 	const nearestMounted = getNearestMountedFiber(targetInst);
// 	// 	if (nearestMounted === null) {
// 	// 		targetInst = null;
// 	// 	} else {
// 	// 		const tag = nearestMounted.tag;
// 	// 	}
// 	// }
// }

// function getEventTarget(nativeEvent: Event) {
// 	const target = (nativeEvent.target || window) as DOMElement;
// 	// 文本节点需要返回上一次元素
// 	return target.nodeType === 3 ? target.parentNode : target;
// }

// function getClosestInstanceFromNode(targetNode: Node): null | FiberNode {
// 	let targetInst = (targetNode as any)[internalInstanceKey];
// 	if (targetInst) {
// 		return targetInst;
// 	}
// 	let parentNode = targetNode.parentNode;
// 	while (parentNode) {
// 		targetInst = (parentNode as any)[internalInstanceKey];
// 		if (targetInst) {
// 			return targetInst;
// 		}
// 		targetNode = parentNode;
// 		parentNode = targetNode.parentNode;
// 	}
// 	return null;
// }
