import { HostComponent } from 'react-reconciler/src/ReactWorkTags';
import { Container, getFiberCurrentPropsFromNode } from 'hostConfig';
import { FiberNode } from 'react-reconciler/src/ReactFiber';
import { IS_CAPTURE_PHASE } from './DOMPluginEventSystem';
import { registerTwoPhaseEvent } from './EventRegistry';
import { SyntheticEvent } from './SyntheticEvent';

export type DOMEventName = 'click' | 'keyup' | 'cancel';

const simpleEventPluginEvents = ['click', 'keyUp'];

const topLevelEventsToReactNames: Map<DOMEventName, string | null> = new Map();

function registerSimpleEvents() {
	if (__DEV__) {
		console.log('registerSimpleEvents');
	}
	for (let i = 0; i < simpleEventPluginEvents.length; i++) {
		const eventName = simpleEventPluginEvents[i];
		const domEventName = eventName.toLowerCase() as DOMEventName;
		const capitalizedEvent = eventName[0].toUpperCase() + eventName.slice(1);
		registerSimpleEvent(domEventName, 'on' + capitalizedEvent);
	}
}

/**
 * 注册普通事件
 * @param domEventName dom事件名称，都是小写
 * @param reactName react事件名称，onClick 驼峰命名
 */
function registerSimpleEvent(domEventName: DOMEventName, reactName: string) {
	topLevelEventsToReactNames.set(domEventName, reactName);
	registerTwoPhaseEvent(reactName, [domEventName]);
}

export function extractEvents(
	dispatchQueue: any[],
	domEventName: DOMEventName,
	targetInst: FiberNode | null,
	nativeEvent: Event,
	nativeEventTarget: EventTarget | null,
	eventSystemFlags: number,
	targetContainer: Container
) {
	console.log(topLevelEventsToReactNames);
	const reactEventType = domEventName;
	const reactName = topLevelEventsToReactNames.get(domEventName);
	if (reactName === undefined) {
		if (__DEV__) {
			console.error('不支持此 React 事件');
		}
		return;
	}
	const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;

	const listeners = accumulateSinglePhaseListeners(
		targetInst,
		reactName,
		nativeEvent.type,
		inCapturePhase,
		nativeEvent
	);
	if (listeners.length > 0) {
		const event = new SyntheticEvent(
			reactName,
			reactEventType,
			null,
			nativeEvent,
			nativeEventTarget
		);
		dispatchQueue.push({ event, listeners });
	}
}

function accumulateSinglePhaseListeners(
	targetFiber: FiberNode | null,
	reactName: string | null,
	nativeEventType: string,
	inCapturePhase: boolean,
	nativeEvent: Event
) {
	console.log('inCapturePhase?');
	const captureName = reactName !== null ? reactName + 'Capture' : null;
	const reactEventName = inCapturePhase ? captureName : reactName;
	const listeners: any[] = [];
	let instance = targetFiber;
	let lastHostComponent = null;

	while (instance !== null) {
		const { stateNode, tag } = instance;
		if (tag === HostComponent && stateNode !== null && reactEventName) {
			lastHostComponent = stateNode;
			const listener = getListener(instance, reactEventName);
			if (listener != null) {
				listeners.push(
					createDispatchListener(instance, listener, lastHostComponent)
				);
			}
		}
		instance = instance.return;
	}
	return listeners;
}

function createDispatchListener(
	instance: FiberNode | null,
	listener: any,
	currentTarget: EventTarget
) {
	return {
		instance,
		listener,
		currentTarget
	};
}

/**
 *
 * @param inst
 * @param registrationName
 * @returns
 */
function getListener(inst: FiberNode, registrationName: string) {
	const stateNode = inst.stateNode;
	if (stateNode === null) {
		return null;
	}
	const props = getFiberCurrentPropsFromNode(stateNode);
	if (props === null) {
		// work in progress
		return null;
	}
	const listener = props[registrationName];
	return listener;
}

export { registerSimpleEvents as registerEvents };
