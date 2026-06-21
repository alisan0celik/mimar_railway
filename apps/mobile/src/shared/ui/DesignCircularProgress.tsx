import { StyleSheet, Text, View } from "react-native";

import { typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

type DesignCircularProgressProps = {
  percent: number;
  size?: number;
  label?: string;
};

export function DesignCircularProgress({
  percent,
  size = 120,
  label,
}: DesignCircularProgressProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const clamped = Math.min(100, Math.max(0, percent));
  const stroke = 10;
  const inner = size - stroke * 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: colors.progressBg,
          },
        ]}
      />
      <View
        style={[
          styles.ringActive,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: colors.primary,
            borderTopColor: colors.primary,
            borderRightColor: clamped > 25 ? colors.primary : colors.progressBg,
            borderBottomColor: clamped > 50 ? colors.primary : colors.progressBg,
            borderLeftColor: clamped > 75 ? colors.primary : colors.progressBg,
          },
        ]}
      />
      <View
        style={[
          styles.inner,
          {
            width: inner,
            height: inner,
            borderRadius: inner / 2,
          },
        ]}
      >
        <Text style={styles.percent}>{clamped}%</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  ring: {
    position: "absolute",
  },
  ringActive: {
    position: "absolute",
  },
  inner: {
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  percent: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
}
