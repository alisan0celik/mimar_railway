import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { rolesApi, companiesApi } from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  PERMISSION_LABELS,
  useCan,
  type PermissionCode,
} from "../../../shared/permissions";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { AppButton, AppInput, DesignBackHeader, NoPermissionState, Screen } from "../../../shared/ui";

type CreateRoleScreenProps = {
  roleId?: string;
  pendingUserId?: string;
};

const GROUP_ORDER = [
  { prefix: "project.", groupKey: "project" },
  { prefix: "finance.", groupKey: "finance" },
  { prefix: "user.", groupKey: "user" },
  { prefix: "role.", groupKey: "role" },
  { prefix: "notification.", groupKey: "notification" },
  { prefix: "completed-project.", groupKey: "completedProject" },
  { prefix: "company.", groupKey: "company" },
] as const;

function groupPermissions(
  t: (key: string) => string,
): Array<{ title: string; permissions: PermissionCode[] }> {
  const grouped = Object.fromEntries(
    GROUP_ORDER.map(({ groupKey }) => [groupKey, [] as PermissionCode[]]),
  ) as Record<string, PermissionCode[]>;

  ALL_PERMISSIONS.forEach((code) => {
    const match = GROUP_ORDER.find(({ prefix }) => code.startsWith(prefix));
    if (match) grouped[match.groupKey].push(code);
  });

  return GROUP_ORDER.map(({ groupKey }) => ({
    title: t(`roles.permissionGroups.${groupKey}`),
    permissions: grouped[groupKey],
  })).filter((g) => g.permissions.length > 0);
}

export function CreateRoleScreen({ roleId, pendingUserId }: CreateRoleScreenProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const companyId = useAuthStore((s) => s.user?.companyId);
  const canAccess = roleId ? useCan(PERMISSIONS.ROLE_UPDATE) : useCan(PERMISSIONS.ROLE_CREATE);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<PermissionCode[]>([]);
  const [loading, setLoading] = useState(!!roleId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!roleId) return;
    rolesApi.getById(roleId).then((res) => {
      setName(res.data.name);
      setDescription(res.data.description || "");
      setSelected(res.data.permissions as PermissionCode[]);
      setLoading(false);
    }).catch(() => {
      Alert.alert(t("common.error"), t("roles.alerts.loadError"));
      setLoading(false);
    });
  }, [roleId, t]);

  const toggle = (code: PermissionCode) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("roles.alerts.nameRequired"));
      return;
    }

    setSaving(true);
    try {
      if (roleId) {
        await rolesApi.update(roleId, {
          name: name.trim(),
          description: description.trim() || undefined,
          permissions: selected,
        });
      } else {
        const code = name.trim().toLowerCase().replace(/\s+/g, "-");
        const created = await rolesApi.create({
          name: name.trim(),
          code,
          description: description.trim() || undefined,
          permissions: selected,
          icon: "shield-account-outline",
          color: colors.primary,
        });

        if (pendingUserId && companyId) {
          await companiesApi.approveMember(companyId, pendingUserId, { roleId: created.data.id });
          router.replace("/(main)/users/approval-success");
          return;
        }
      }
      router.back();
    } catch (error: any) {
      const msg = error?.response?.data?.message || t("roles.alerts.saveError");
      Alert.alert(t("common.error"), msg);
    } finally {
      setSaving(false);
    }
  };

  const groups = useMemo(() => groupPermissions(t), [t]);

  if (!canAccess) {
    return (
      <Screen scroll={false}>
        <NoPermissionState
          actionLabel={t("roles.backAction")}
          onRequestAccess={() => router.back()}
          title={t("roles.noPermissionTitle")}
        />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <DesignBackHeader title="" />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={roleId ? t("roles.create.editTitle") : t("roles.create.title")} />

      <View style={styles.section}>
        <AppInput
          label={t("roles.create.name")}
          onChangeText={setName}
          placeholder={t("roles.create.namePlaceholder")}
          value={name}
        />
        <AppInput
          label={t("roles.create.description")}
          multiline
          onChangeText={setDescription}
          placeholder={t("roles.create.descriptionPlaceholder")}
          value={description}
        />
      </View>

      <Text style={styles.sectionTitle}>{t("roles.create.permissionsSection")}</Text>
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <View style={styles.groupHeader}>
            <MaterialCommunityIcons color={colors.primary} name="shield-account-outline" size={20} />
            <Text style={styles.groupTitle}>{group.title}</Text>
          </View>
          <View style={styles.permList}>
            {group.permissions.map((code) => {
              const isSelected = selected.includes(code);
              return (
                <Pressable
                  key={code}
                  onPress={() => toggle(code)}
                  style={[styles.permItem, isSelected && styles.permItemSelected]}
                >
                  <MaterialCommunityIcons
                    color={isSelected ? colors.primary : colors.textMuted}
                    name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={20}
                  />
                  <Text style={[styles.permLabel, isSelected && styles.permLabelSelected]}>
                    {PERMISSION_LABELS[code]?.label ?? code}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <AppButton
        disabled={saving}
        fullWidth
        loading={saving}
        onPress={handleSave}
        style={styles.saveBtn}
        title={
          roleId
            ? t("common.update")
            : pendingUserId
              ? t("roles.approveFlow.createAndApprove")
              : t("common.create")
        }
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: { paddingBottom: 100 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  section: { gap: spacing.md, marginBottom: spacing.xl },
  sectionTitle: { ...typography.body, fontWeight: "600", color: colors.text, marginBottom: spacing.md },
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.cardSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupTitle: { ...typography.body, color: colors.text, fontWeight: "600" },
  permList: { padding: spacing.sm },
  permItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  permItemSelected: { backgroundColor: colors.primarySoft },
  permLabel: { ...typography.bodySmall, color: colors.textMuted, flex: 1 },
  permLabelSelected: { color: colors.text, fontWeight: "500" },
  saveBtn: { marginTop: spacing.lg },
});
}
