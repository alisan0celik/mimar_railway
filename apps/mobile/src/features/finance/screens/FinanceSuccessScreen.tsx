import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { spacing } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { useTranslation } from "../../../shared/i18n";
import { refreshFinance } from "../../../store/financeStore";
import { AppButton, Screen, SuccessStateLayout } from "../../../shared/ui";

type SuccessScreenProps = {
  title?: string;
  subtitle?: string;
  backRoute?: string;
};

export function FinanceSuccessScreen({
  title,
  subtitle,
  backRoute,
}: SuccessScreenProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();

  const handleTamam = async () => {
    await refreshFinance({ silent: true });

    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (backRoute) {
      router.replace(backRoute as any);
      return;
    }
    router.replace("/(main)/(tabs)/finance");
  };

  return (
    <Screen scroll={false} contentContainerStyle={styles.screen}>
      <SuccessStateLayout
        icon={
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="check-circle" size={72} color={colors.success} />
          </View>
        }
        title={title ?? t("finance.success.defaultTitle")}
        description={subtitle}
        action={
          <AppButton fullWidth onPress={handleTamam} title={t("common.ok")} style={styles.button} />
        }
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    iconCircle: {
      width: 112,
      height: 112,
      borderRadius: 56,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    button: {
      minHeight: 52,
    },
  });
}
