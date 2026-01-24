import { create } from "zustand";

interface Props {
  onOpen: boolean;
  setOnOpen: () => void;
}

const useMedSideBar = create<Props>((set) => ({
  onOpen: true,
  setOnOpen: () => set((state) => ({ onOpen: !state.onOpen })),
}));

export default useMedSideBar;
