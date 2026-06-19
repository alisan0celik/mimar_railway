import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from "react-native";

import { useTranslation } from "../i18n";
import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  showClearButton?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  editable?: boolean;
};

export function SearchInput({
  value,
  onChangeText,
  placeholder,
  showClearButton = true,
  containerStyle,
  editable = true,
}: SearchInputProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const canClear = showClearButton && value.length > 0;

  return (
    <View style={[styles.container, !editable && styles.containerDisabled, containerStyle]}>
      <MaterialCommunityIcons color={colors.primaryLight} name="magnify" size={20} style={styles.searchIcon} />
      <TextInput
        editable={editable}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t("common.search")}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={value}
      />
      {canClear ? (
        <Pressable
          accessibilityLabel={t("common.clear")}
          onPress={() => onChangeText("")}
          style={styles.clearButton}
        >
          <Text style={styles.clearText}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.input,
      paddingHorizontal: spacing.md,
      shadowColor: colors.primaryGlow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    containerDisabled: {
      opacity: 0.65,
    },
    searchIcon: {
      marginRight: spacing.sm,
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.text,
      paddingVertical: spacing.md,
    },
    clearButton: {
      marginLeft: spacing.sm,
      width: 24,
      height: 24,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardSoft,
    },
    clearText: {
      ...typography.body,
      lineHeight: 20,
      color: colors.textSoft,
    },
  });
}
