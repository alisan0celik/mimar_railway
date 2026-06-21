import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FAQ_ITEM_IDS } from "../data/faqContent";
import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import { DesignBackHeader, Screen } from "../../../shared/ui";

export function FaqScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const items = useMemo(
    () =>
      FAQ_ITEM_IDS.map((id) => ({
        id,
        question: t(`support.faq.items.${id}.question`),
        answer: t(`support.faq.items.${id}.answer`),
      })),
    [t],
  );

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <DesignBackHeader title={t("support.faqTitle")} />

      <View style={styles.list}>
        {items.map((item, idx) => {
          const expanded = expandedId === item.id;
          return (
            <View key={item.id} style={[styles.item, idx < items.length - 1 && styles.itemBorder]}>
              <Pressable
                onPress={() => setExpandedId(expanded ? null : item.id)}
                style={styles.questionRow}
              >
                <Text style={styles.question}>{item.question}</Text>
                <MaterialCommunityIcons
                  color={colors.textMuted}
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={22}
                />
              </Pressable>
              {expanded ? <Text style={styles.answer}>{item.answer}</Text> : null}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: { paddingBottom: 100 },
    list: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    item: { padding: spacing.lg },
    itemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    questionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    question: {
      ...typography.body,
      color: colors.text,
      fontWeight: "600",
      flex: 1,
    },
    answer: {
      ...typography.bodySmall,
      color: colors.textMuted,
      marginTop: spacing.md,
      lineHeight: 22,
    },
  });
}
