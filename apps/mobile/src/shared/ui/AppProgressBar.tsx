import { StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

type AppProgressBarProps = {
  value: number;
  max?: number;
  color?: string;
  trackColor?: string;
  height?: number;
  showLabel?: boolean;
};

export function AppProgressBar({
  value,
  max = 100,
  color,
  trackColor,
  height = 6,
  showLabel = false,
}: AppProgressBarProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const fillColor = color ?? colors.progressFill;
  const barTrackColor = trackColor ?? colors.progressBg;
  const percent = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { height, backgroundColor: barTrackColor }]}>
        <View
          style={[
            styles.fill,
            { width: `${percent}%`, height, backgroundColor: fillColor },
          ]}
        />
      </View>
      {showLabel ? <Text style={styles.label}>%{percent}</Text> : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  track: {
    flex: 1,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  fill: {
    borderRadius: radius.full,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    minWidth: 36,
    textAlign: "right",
  },
});
}
