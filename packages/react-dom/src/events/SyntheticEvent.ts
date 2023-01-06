import hasOwnProperty from 'shared/hasOwnProperty';
import { FiberNode } from 'react-reconciler/src/ReactFiber';

const EventInterface = {
	eventPhase: 0,
	bubbles: 0,
	cancelable: 0,
	timeStamp: function (event) {
		return event.timeStamp || Date.now();
	},
	defaultPrevented: 0,
	isTrusted: 0
};

function functionThatReturnsTrue() {
	return true;
}

function functionThatReturnsFalse() {
	return false;
}

export const SyntheticEvent = createSyntheticEvent(EventInterface);

function createSyntheticEvent(Interface: any) {
	function SyntheticBaseEvent(
		reactName: string | null,
		reactEventType: string,
		targetInst: FiberNode,
		nativeEvent: { [propName: string]: any },
		nativeEventTarget: null | EventTarget
	) {
		this._reactName = reactName;
		this._targetInst = targetInst;
		this.type = reactEventType;
		this.nativeEvent = nativeEvent;
		this.target = nativeEventTarget;
		this.currentTarget = null;
		for (const propName in Interface) {
			if (!hasOwnProperty.call(Interface, propName)) {
				continue;
			}
			const normalize = Interface[propName];
			if (normalize) {
				this[propName] = normalize(nativeEvent);
			} else {
				this[propName] = nativeEvent[propName];
			}
		}
		const defaultPrevented =
			nativeEvent.defaultPrevented != null
				? nativeEvent.defaultPrevented
				: nativeEvent.returnValue === false;
		if (defaultPrevented) {
			this.isDefaultPrevented = functionThatReturnsTrue;
		} else {
			this.isDefaultPrevented = functionThatReturnsFalse;
		}
		this.isPropagationStopped = functionThatReturnsFalse;

		return this;
	}

	Object.assign(SyntheticBaseEvent.prototype, {
		preventDefault: function () {
			this.defaultPrevented = true;
			const event = this.nativeEvent;
			if (!event) {
				return;
			}
			if (event.preventDefault) {
				event.preventDefault();
			} else if (typeof event.returnValue !== 'unknown') {
				event.returnValue = false;
			}
			this.isPropagationStopped = functionThatReturnsTrue;
		},

		stopPropagation: function () {
			const event = this.nativeEvent;
			if (!event) {
				return;
			}
			if (event.stopPropagation) {
				event.stopPropagation();
			} else if (typeof event.cancelBubble !== 'unknown') {
				event.cancelBubble = true;
			}
		}
	});
	return SyntheticBaseEvent;
}
