import { Image, StyleSheet, Text, View } from "react-native";
import { spacing } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";

interface AppLogoProps {
  compact?: boolean;
  showSubtitle?: boolean;
}

export function AppLogo({ compact = false, showSubtitle = false }: AppLogoProps) {
  const styles = useThemedStyles((c) => createStyles(c, compact));
  return (
    <View style={styles.wrapper}>
      <Image
        source={require("../../../assets/brand/mimarlik-logo.png")}
        style={[styles.logo, compact && styles.logoCompact]}
        resizeMode="contain"
      />
      <Text style={styles.brandTitle}>MİMARLIK</Text>
      {showSubtitle ? (
        <Text style={styles.brandAccent}>PROJE PLATFORMU</Text>
      ) : null}
    </View>
  );
}

function createStyles(colors: AppColors, compact: boolean) {
  return StyleSheet.create({
    wrapper: {
      alignItems: "center",
      marginTop: compact ? spacing.xs : spacing.xl,
      marginBottom: compact ? spacing.sm : spacing.xxl,
    },
    logo: {
      width: 84,
      height: 84,
      marginBottom: spacing.md,
    },
    logoCompact: {
      width: 64,
      height: 64,
      marginBottom: spacing.sm,
    },
    brandTitle: {
      fontSize: compact ? 22 : 28,
      fontWeight: "900",
      color: colors.text,
      letterSpacing: compact ? 4 : 6,
      textTransform: "uppercase",
    },
    brandAccent: {
      fontSize: compact ? 10 : 13,
      fontWeight: "600",
      color: colors.primaryLight,
      letterSpacing: compact ? 4 : 2.5,
      marginTop: spacing.xs,
      textTransform: "uppercase",
    },
  });
}
