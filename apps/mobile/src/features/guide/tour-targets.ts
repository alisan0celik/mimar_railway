import { useCallback, useContext, useRef } from "react";
import type { View } from "react-native";

import { TourScrollContext, type TourScrollHandle } from "../../shared/ui/TourScrollContext";

type RegisteredTarget = {
  node: View;
  scroll: TourScrollHandle | null;
};

const targets = new Map<string, RegisteredTarget>();

export function getTourTarget(id: string): RegisteredTarget | undefined {
  return targets.get(id);
}

/**
 * Bir öğeyi tur hedefi olarak işaretler: dönen ref, vurgulanacak View'a verilir.
 * Öğe yetki yüzünden hiç çizilmezse kayıt da olmaz ve adım atlanır.
 */
export function useTourTarget(id: string | undefined) {
  const scroll = useContext(TourScrollContext);
  const nodeRef = useRef<View | null>(null);

  return useCallback(
    (node: View | null) => {
      const previous = nodeRef.current;
      if (id && previous && targets.get(id)?.node === previous) targets.delete(id);
      nodeRef.current = node;
      if (id && node) targets.set(id, { node, scroll });
    },
    [id, scroll],
  );
}

export type TargetRect = { x: number; y: number; width: number; height: number };

const MEASURE_TIMEOUT_MS = 500;

export function measureNode(node: View): Promise<TargetRect | null> {
  return new Promise((resolve) => {
    // Ekrandan kalkmış bir öğe için geri çağrı hiç gelmeyebilir.
    const timeout = setTimeout(() => resolve(null), MEASURE_TIMEOUT_MS);
    const finish = (rect: TargetRect | null) => {
      clearTimeout(timeout);
      resolve(rect);
    };
    try {
      node.measureInWindow((x, y, width, height) => {
        if (!Number.isFinite(x) || !Number.isFinite(y) || width <= 0 || height <= 0) {
          finish(null);
          return;
        }
        finish({ x, y, width, height });
      });
    } catch {
      finish(null);
    }
  });
}
