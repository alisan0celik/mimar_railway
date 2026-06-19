import { Image, StyleSheet, Text, View } from "react-native";

import { spacing } from "../theme";

import { useTranslation } from "../i18n";

type AuthBrandHeaderProps = {
  variant?: "hero" | "compact";
};

export function AuthBrandHeader({ variant = "compact" }: AuthBrandHeaderProps) {
  const { t } = useTranslation();
  const isHero = variant === "hero";

  return (
    <View style={[styles.container, isHero && styles.containerHero]}>
      <Image
        source={require("../../../assets/brand/mimarlik-logo.png")}
        style={[styles.logo, isHero ? styles.logoHero : styles.logoCompact]}
        resizeMode="contain"
      />
      <Text style={[styles.tagline, isHero ? styles.taglineHero : styles.taglineCompact]}>
        {t("auth.tagline")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  containerHero: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  logo: {
    marginBottom: spacing.sm,
  },
  logoHero: {
    width: 104,
    height: 104,
  },
  logoCompact: {
    width: 72,
    height: 72,
  },
  tagline: {
    color: "rgba(255,255,255,0.55)",
    fontWeight: "500",
  },
  taglineHero: {
    fontSize: 13,
  },
  taglineCompact: {
    fontSize: 12,
  },
});
