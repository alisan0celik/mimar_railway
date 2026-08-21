import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Klavyenin açık olup olmadığını döndürür.
 *
 * Sohbet biçimli ekranlarda yazma kutusu normalde cihazın gezinme çubuğu
 * kadar alt boşluk bırakır; klavye açıkken bu boşluk gereksiz kalır ve
 * kutuyu klavyenin epey üstünde bırakır. Bu kanca ile boşluk yalnızca
 * klavye kapalıyken uygulanır.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // iOS'ta "will" olayları animasyonla aynı anda tetiklendiği için
    // geçiş daha akıcı olur; Android yalnızca "did" olaylarını verir.
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return visible;
}

/**
 * Klavyenin pencerenin altını kapattığı yüksekliği (dp) döndürür; kapalıyken 0.
 *
 * Yalnızca Android için hesaplanır. React Native orada klavye yüksekliğini
 * `imeInsets.bottom - barInsets.bottom` olarak bildiriyor (ReactRootView),
 * yani gezinme çubuğu yüksekliği kadar eksik. Edge-to-edge açık olduğu için
 * pencere ekranın tamamını kaplıyor ve gerçek örtüşme bu ikisinin toplamı;
 * eksik bırakılırsa yazma kutusu klavyenin altında kalıyor.
 *
 * iOS'ta 0 döner: orada örtüşmeyi `Screen` bileşenindeki
 * `KeyboardAvoidingView behavior="padding"` zaten doğru uyguluyor.
 */
export function useKeyboardOverlap(): number {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const showSub = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (keyboardHeight <= 0) return 0;
  return keyboardHeight + insets.bottom;
}
