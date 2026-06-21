import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { useTranslation } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import {
  DesignBackHeader,
  DesignEqualFilterBar,
  EmptyState,
  NoPermissionState,
  Screen,
} from "../../../shared/ui";
import { companiesApi, type JoinRequestUserDTO, type UserDTO } from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";
import { PendingUserCard } from "../components/PendingUserCard";

type FilterKey = "all" | "pending" | "rejected";

function matchesFilter(status: string, filter: FilterKey): boolean {
  if (filter === "all") return status === "pending" || status === "rejected";
  return status === filter;
}

export function PendingUsersScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const canApprove = useCan(PERMISSIONS.USER_APPROVE);
  const companyId = useAuthStore((s) => s.user?.companyId);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(() => {
    if (!companyId) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    companiesApi
      .getJoinRequests(companyId)
      .then((res) => {
        const requests = Array.isArray(res.data) ? res.data : [];
        const mapped: UserDTO[] = requests.map((item: JoinRequestUserDTO) => ({
          id: item.id,
          email: item.email,
          fullName: item.fullName,
          phone: item.phone ?? null,
          avatarUrl: null,
          authProvider: "local",
          approvalStatus: "pending",
          title: item.title,
          companyId,
          companyName: item.companyName ?? null,
          roles: [],
          permissions: [],
          createdAt: item.createdAt,
        }));
        setUsers(mapped);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const pendingCount = users.filter((u) => u.approvalStatus === "pending").length;
  const rejectedCount = users.filter((u) => u.approvalStatus === "rejected").length;

  const filteredUsers = useMemo(
    () => users.filter((user) => matchesFilter(user.approvalStatus, activeFilter)),
    [users, activeFilter],
  );

  if (!canApprove) {
    return (
      <Screen scroll={false}>
        <NoPermissionState
          actionLabel={t("states.backHome")}
          description={t("states.noPermissionDesc")}
          onRequestAccess={() => router.replace("/(main)/(tabs)/dashboard")}
          title={t("states.noPermission")}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("users.pendingTitle")} />

      <DesignEqualFilterBar
        activeKey={activeFilter}
        onChange={(key) => setActiveFilter(key as FilterKey)}
        tabs={[
          { key: "all", label: t("common.all"), count: users.length },
          { key: "pending", label: t("filters.pending"), count: pendingCount },
          { key: "rejected", label: t("filters.rejected"), count: rejectedCount },
        ]}
      />

      <View>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredUsers.length === 0 ? (
          <EmptyState description={t("users.emptyFilterDesc")} title={t("common.noData")} />
        ) : (
          filteredUsers.map((user) => (
            <PendingUserCard
              key={user.id}
              onPress={() =>
                router.push({
                  pathname: "/(main)/users/[userId]",
                  params: { userId: user.id },
                })
              }
              user={user}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100 },
    loading: { paddingVertical: 60, alignItems: "center" },
  });
}
