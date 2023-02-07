
import {
	unstable_ImmediatePriority as ImmediatePriority,
	unstable_UserBlockingPriority as UserBlockingPriority,
	unstable_NormalPriority as NormalPriority,
	unstable_LowPriority as LowPriority,
	unstable_IdlePriority as IdlePriority,
	unstable_scheduleCallback as scheduleCallback,
	unstable_shouldYield as shouldYield,
	CallbackNode,
	unstable_getFirstCallbackNode as getFirstCallbackNode,
	unstable_cancelCallback as cancelCallback
} from 'scheduler';

import './style.css';
const root = document.querySelector('#root');

type Priority =
	| typeof IdlePriority
	| typeof LowPriority
	| typeof NormalPriority
	| typeof UserBlockingPriority
	| typeof ImmediatePriority;

	
	interface Work{
		count : number
		priority: Priority
	}

	const workList: Work[] = []

	let prevPriority: Priority = IdlePriority;
	let curCallback: CallbackNode | null = null;


	// 创建按钮，启动不同优先级的任务

	[LowPriority,NormalPriority,UserBlockingPriority, ImmediatePriority].forEach((priority) => {
		const btn = document.createElement('button');
		root.appendChild(btn);
		/* export const unstable_ImmediatePriority = 1;
export const unstable_UserBlockingPriority = 2;
export const unstable_NormalPriority = 3;
export const unstable_IdlePriority = 5;
export const unstable_LowPriority = 4; */
		btn.innerText = [
			'',
			'ImmediatePriority',
			'UserBlockingPriority',
			'NormalPriority',
			'LowPriority'
		][priority]

		// 点击按钮，新增一个 work 更新， 开始调度
		btn.onclick = () => {
			workList.unshift({
				count: 100,
				priority: priority
			})

			schedule()
		}
	})

	function schedule(){
		const cbNode = getFirstCallbackNode();
		const curWork = workList.sort((w1, w2) => w1.priority - w2.priority)[0];

		// 策略逻辑
		if(!curWork){
			curCallback = null;
			cbNode && cancelCallback(cbNode);
			return;
		}

		const { priority: curPriority} = curWork
		if(curPriority === prevPriority){
			return
		}

		// 更高优先级的work
		cbNode&& cancelCallback(cbNode);
		curCallback = scheduleCallback(curPriority, perform.bind(null, curWork))
	}


	function perform(work: Work, didTimeout?: boolean){
		const needSync = work.priority === ImmediatePriority || didTimeout
		while((needSync || !shouldYield() )&& work.count){
			work.count --
			insertSpan(work.priority + '')
		}

		// 中断执行 || 执行完成
		prevPriority = work.priority
		if(!work.count){
			const workIndex = workList.indexOf(work);
			workList.splice(workIndex, 1);
			prevPriority = IdlePriority
		}

		const prevCallback = curCallback;
		schedule();
		const newCallback = curCallback;
		if(newCallback&& newCallback === prevCallback){
			return perform.bind(null, work)
		}
	}



function insertSpan(content) {
	const span = document.createElement('span');
	span.innerText = content;
	span.className = `pri-${content}`;
	doSomeBusyWork(10000000);
	root?.appendChild(span);
}

function doSomeBusyWork(len: number) {
	let result = 0;
	while (len--) {
		result += len;
	}
}

