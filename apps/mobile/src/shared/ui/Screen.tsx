import { useMemo, useRef, type ReactNode } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { componentTokens } from "../theme";
import { useThemedStyles } from "../theme/useThemedStyles";
import { useThemeColors } from "../theme/ThemeProvider";
import type { AppColors } from "../theme/colors";
import { TourScrollContext, type TourScrollHandle } from "./TourScrollContext";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
  showsVerticalScrollIndicator?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  scroll = false,
  edges = ["top"],
  keyboardShouldPersistTaps = "handled",
  showsVerticalScrollIndicator = false,
  style,
  contentContainerStyle,
}: ScreenProps) {
  const styles = useThemedStyles(createStyles);
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const tourScroll = useMemo<TourScrollHandle>(
    () => ({
      scrollBy: (dy) => {
        const y = Math.max(0, scrollOffsetRef.current + dy);
        scrollRef.current?.scrollTo({ y, animated: true });
      },
    }),
    [],
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  };

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      {scroll ? (
        // automaticallyAdjustKeyboardInsets: klavye açılınca iOS'ta alt boşluk
        // eklenir, böylece klavyenin kapattığı içerik kaydırılarak görülebilir.
        // (Android'de manifest'teki adjustResize aynı işi yapıyor.)
        <ScrollView
          ref={scrollRef}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          onScroll={handleScroll}
          scrollEventThrottle={64}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        >
          <TourScrollContext.Provider value={tourScroll}>{children}</TourScrollContext.Provider>
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flexFill}
        >
          <View style={[styles.content, contentContainerStyle]}>{children}</View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flexFill: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingTop: componentTokens.screen.topPadding,
      paddingHorizontal: componentTokens.screen.horizontalPadding,
      paddingBottom: componentTokens.screen.bottomPadding,
    },
    scrollContent: {
      flexGrow: 1,
      paddingTop: componentTokens.screen.topPadding,
      paddingHorizontal: componentTokens.screen.horizontalPadding,
      paddingBottom: componentTokens.screen.bottomPadding,
    },
  });
}
