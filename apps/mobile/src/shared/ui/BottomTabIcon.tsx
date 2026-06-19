import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";

import { radius } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type BottomTabIconProps = {
  name: IconName;
  color: string;
  focused: boolean;
};

export function BottomTabIcon({ name, color, focused }: BottomTabIconProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <MaterialCommunityIcons name={name} size={20} color={color} />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  iconWrapActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
});
}
