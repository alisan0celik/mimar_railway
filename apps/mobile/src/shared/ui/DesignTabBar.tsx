import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "../i18n";
import { spacing } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

type TabConfig = {
  name: string;
  labelKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const VISIBLE_TABS: TabConfig[] = [
  { name: "dashboard", labelKey: "tabs.dashboard", icon: "home-outline" },
  { name: "projects", labelKey: "tabs.projects", icon: "folder-multiple-outline" },
  { name: "finance", labelKey: "tabs.finance", icon: "wallet-outline" },
  { name: "profile", labelKey: "tabs.other", icon: "dots-horizontal" },
];

export function DesignTabBar({ state, navigation }: BottomTabBarProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const renderTab = (tab: TabConfig) => {
    const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
    if (routeIndex < 0) return null;
    const isFocused = state.index === routeIndex;
    const route = state.routes[routeIndex];
    return (
      <Pressable
        key={tab.name}
        onPress={() => navigation.navigate(route.name)}
        style={styles.tab}
      >
        <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
          <MaterialCommunityIcons
            color={isFocused ? colors.primaryLight : colors.textMuted}
            name={tab.icon}
            size={22}
          />
        </View>
        <Text style={[styles.label, isFocused && styles.labelActive]}>{t(tab.labelKey)}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {VISIBLE_TABS.slice(0, 2).map(renderTab)}

        <Pressable onPress={() => router.push("/(main)/projects/create")} style={styles.fabWrap}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.fab}
          >
            <MaterialCommunityIcons color={colors.white} name="plus" size={28} />
          </LinearGradient>
        </Pressable>

        {VISIBLE_TABS.slice(2).map(renderTab)}
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.tabBar,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    bar: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-around",
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      gap: 4,
      paddingBottom: 4,
    },
    tabIconWrap: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
    },
    tabIconWrapActive: {
      backgroundColor: colors.primarySoft,
    },
    label: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textMuted,
    },
    labelActive: {
      color: colors.primaryLight,
      fontWeight: "700",
    },
    fabWrap: {
      flex: 1,
      alignItems: "center",
      marginTop: -28,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primaryGlow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 12,
      borderWidth: 4,
      borderColor: colors.tabBar,
    },
  });
}
