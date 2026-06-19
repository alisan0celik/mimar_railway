import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useAuthStore } from "../../../store/authStore";
import { useTranslation } from "../../../shared/i18n";
import { spacing } from "../../../shared/theme";
import { AppButton, AppCard, AppInput, Screen, ScreenHeader } from "../../../shared/ui";
import { usersApi } from "../../../services/api/users.api";

export function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [title, setTitle] = useState(user?.title ?? "");
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await usersApi.updateProfile({ fullName: name, phone, title });
      if (res.data) {
        setUser({ ...user, ...res.data } as any);
        router.back();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenHeader
        onBack={() => router.back()}
        showBack
        title={t("profile.account.title")}
      />
      <AppCard style={styles.card}>
        <View style={styles.form}>
          <AppInput label={t("profile.account.fullName")} onChangeText={setName} value={name} />
          <AppInput
            keyboardType="email-address"
            label={t("profile.account.email")}
            onChangeText={setEmail}
            value={email}
          />
          <AppInput
            keyboardType="phone-pad"
            label={t("profile.account.phone")}
            onChangeText={setPhone}
            value={phone}
          />
          <AppInput label={t("profile.account.titleField")} onChangeText={setTitle} value={title} />
        </View>
        <AppButton
          loading={loading}
          onPress={handleSave}
          style={styles.btn}
          title={t("profile.account.saveChanges")}
        />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  card: { marginTop: spacing.md },
  form: { gap: spacing.md, marginBottom: spacing.xl },
  btn: { width: "100%" },
});
