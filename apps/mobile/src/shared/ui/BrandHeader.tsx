import { Image, StyleSheet, Text, View } from "react-native";
import { spacing } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";

interface BrandHeaderProps {
  compact?: boolean;
}

export function BrandHeader({ compact = false }: BrandHeaderProps) {
  const styles = useThemedStyles((c) => createStyles(c, compact));
  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/brand/mimarlik-logo.png")}
        style={[styles.logo, compact && styles.logoCompact]}
        resizeMode="contain"
      />
      <Text style={styles.brandTitle}>MİMARLIK</Text>
      <Text style={styles.brandAccent}>PROJE PLATFORMU</Text>
      <View style={styles.divider} />
    </View>
  );
}

function createStyles(colors: AppColors, compact: boolean) {
  return StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: compact ? spacing.xs : spacing.xl,
    marginBottom: compact ? spacing.sm : spacing.xxl,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: spacing.xl,
  },
  logoCompact: {
    width: 68,
    height: 68,
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 5,
    textTransform: "uppercase",
  },
  brandAccent: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 6,
    marginTop: spacing.xs,
    textTransform: "uppercase",
  },
  divider: {
    width: 30,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginTop: spacing.lg,
    opacity: 0.8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});
}
