import { cloneElement, isValidElement, type ReactElement, type Ref } from "react";
import type { View } from "react-native";

import { useTourTarget } from "./tour-targets";

type TourTargetProps = {
  id: string;
  /** Tek bir View ya da Pressable; ref doğrudan ona bağlanır, yerleşim değişmez. */
  children: ReactElement<{ ref?: Ref<View> }>;
};

/**
 * Ekran bileşeni `Screen`'in üstünde çizildiği için kaydırma bağlamını ancak
 * `Screen`'in içinde çizilen bir bileşen okuyabilir; bu sarmalayıcı o işi görür.
 */
export function TourTarget({ id, children }: TourTargetProps) {
  const ref = useTourTarget(id);
  if (!isValidElement(children)) return children;
  return cloneElement(children, { ref });
}
