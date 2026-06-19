import type { ReactNode } from "react";
import {
  type ScrollViewProps,
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

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentContainerStyle]}>{children}</View>
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
