import { Tabs } from "expo-router";

import { useTranslation } from "../../../src/shared/i18n";
import { PERMISSIONS, useCan } from "../../../src/shared/permissions";
import { useThemeColors } from "../../../src/shared/theme";
import { DesignTabBar } from "../../../src/shared/ui/DesignTabBar";

export default function MainTabsLayout() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const canViewFinance = useCan(PERMISSIONS.FINANCE_VIEW);

  return (
    <Tabs
      tabBar={(props) => <DesignTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t("tabs.dashboard") }} />
      <Tabs.Screen name="projects" options={{ title: t("tabs.projects") }} />
      <Tabs.Screen
        name="finance"
        options={canViewFinance ? { title: t("tabs.finance") } : { href: null }}
      />
      <Tabs.Screen name="profile" options={{ title: t("tabs.other") }} />
      <Tabs.Screen name="roles" options={{ href: null }} />
      <Tabs.Screen name="completed" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
      <Tabs.Screen name="companies" options={{ href: null }} />
    </Tabs>
  );
}
