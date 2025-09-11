import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type State = {
	draftId?: string;
	variantIds: string[];
	journey: "existing" | "unique" | null;
	unsavedChanges: boolean;
	categoryId: string | null;
	brandId: string | null;
	hasVariants: boolean;
	setCategory: (id: string | null) => void;
	setBrand: (id: string | null) => void;
	setUnsaved: (v: boolean) => void;
	setDraft: (id: string) => void;
	setJourney: (j: State["journey"]) => void;
};

export const useCreationStore = create<State>()(
	immer((set) => ({
		draftId: undefined,
		variantIds: [],
		journey: null,
		unsavedChanges: false,
		categoryId: null as string | null,
		brandId: null as string | null,
		hasVariants: false,
		setCategory: (id: string | null) =>
			set((s) => {
				s.categoryId = id;
			}),
		setBrand: (id: string | null) =>
			set((s) => {
				s.brandId = id;
			}),
		setUnsaved: (v) =>
			set((s) => {
				s.unsavedChanges = v;
			}),
		/* ➕ new helpers */
		setDraft: (id: string) =>
			set((s) => {
				s.draftId = id;
			}),
		setJourney: (j: State["journey"]) =>
			set((s) => {
				s.journey = j;
			}),
		setHasVariants: (v: State["hasVariants"]) =>
			set((s) => {
				s.hasVariants = v;
			}),
	})),
);
