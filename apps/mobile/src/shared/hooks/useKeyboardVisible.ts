import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

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
