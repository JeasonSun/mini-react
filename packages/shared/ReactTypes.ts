export type ElementType = any;
export type Key = string | null;
export type Ref = any;
export type Props = {
	[key: string]: any;
	children?: ReactElement;
};

export interface ReactElement {
	$$typeof: symbol | number;
	type: ElementType;
	key: Key;
	props: Props;
	ref: Ref;
	__mark: 'MoJie';
}
