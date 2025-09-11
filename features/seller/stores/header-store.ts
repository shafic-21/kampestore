// features/ui/useHeaderStore.ts
import { LucideIcon } from "lucide-react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type HeaderButton = {
	id: string; // stable key
	label: string;
	icon?: LucideIcon;
	onClick: () => void;
};

type HeaderState = {
	title: string;
	buttons: HeaderButton[];
};

type HeaderActions = {
	setHeader: (title: string, buttons?: HeaderButton[]) => void;
	resetHeader: () => void;
};

export const useHeaderStore = create<HeaderState & HeaderActions>()(
	immer((set) => ({
		title: "",
		buttons: [],
		setHeader: (title, buttons = []) =>
			set((s) => {
				s.title = title;
				s.buttons = buttons;
			}),
		resetHeader: () =>
			set((s) => {
				s.title = "";
				s.buttons = [];
			}),
	})),
);
