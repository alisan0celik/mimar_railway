import { createContext } from "react";

export type TourScrollHandle = {
  /** İçeriği dikeyde verilen piksel kadar kaydırır. */
  scrollBy: (dy: number) => void;
};

/** Tanıtım turunun ekran dışındaki bir hedefi görünür alana kaydırabilmesi için. */
export const TourScrollContext = createContext<TourScrollHandle | null>(null);
