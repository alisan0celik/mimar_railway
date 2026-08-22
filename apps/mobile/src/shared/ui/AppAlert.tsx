import { create } from "zustand";

import { ConfirmDialog } from "./ConfirmDialog";

/**
 * Uygulama temasında uyarı kutusu.
 *
 * Yerli `Alert.alert` işletim sisteminin kutusunu açıyor; ekranda başka bir
 * uygulamadan gelmiş gibi duruyor ve temaya uydurulamıyor. Buradaki kuyruk
 * her yerden çağrılabildiği için React dışındaki servisler de kullanabilir.
 *
 * Aynı anda birden fazla uyarı istenebildiğinden (ör. arka arkaya başarısız
 * iki istek) mesajlar kuyruğa alınır; kullanıcı birini kapatınca sıradaki
 * gösterilir, hiçbiri sessizce kaybolmaz.
 */

type AlertEntry = { title: string; message: string };

type AlertState = {
  queue: AlertEntry[];
  push: (entry: AlertEntry) => void;
  shift: () => void;
};

const useAlertStore = create<AlertState>((set) => ({
  queue: [],
  push: (entry) => set((state) => ({ queue: [...state.queue, entry] })),
  shift: () => set((state) => ({ queue: state.queue.slice(1) })),
}));

/** Uyarı gösterir. React bileşeni olmayan yerlerden de çağrılabilir. */
export function showAppAlert(title: string, message?: string): void {
  useAlertStore.getState().push({ title, message: message ?? "" });
}

/** Uyarıları çizen tek bileşen; kök düzende bir kez render edilir. */
export function AppAlertHost() {
  const current = useAlertStore((state) => state.queue[0]);
  const shift = useAlertStore((state) => state.shift);

  return (
    <ConfirmDialog
      confirmLabel="OK"
      message={current?.message ?? ""}
      onCancel={shift}
      onConfirm={shift}
      singleAction
      title={current?.title ?? ""}
      visible={current !== undefined}
    />
  );
}
