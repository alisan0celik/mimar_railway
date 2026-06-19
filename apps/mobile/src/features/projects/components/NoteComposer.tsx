import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "../../../shared/i18n";
import { radius, spacing, typography } from "../../../shared/theme";
import { useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";

export type NoteAttachment =
  | { type: "image"; uri: string }
  | { type: "emoji"; value: string }
  | { type: "icon"; name: string; color: string };

export type NoteComposerPayload = {
  body: string;
  attachments: NoteAttachment[];
};

type NoteComposerProps = {
  onSend: (payload: NoteComposerPayload) => void;
};

const INPUT_BAR_HEIGHT = 44;

export function NoteComposer({ onSend }: NoteComposerProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");

  const canSend = text.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onSend({
      body: text.trim(),
      attachments: [],
    });
    setText("");
  };

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.inputBar,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <TextInput
          multiline
          onChangeText={setText}
          placeholder={t("projects.notes.composer.placeholder")}
          placeholderTextColor={colors.textMuted}
          style={styles.inputField}
          value={text}
        />

        <Pressable
          disabled={!canSend}
          onPress={handleSend}
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
        >
          <MaterialCommunityIcons color="#fff" name="send" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.background,
    },
    inputBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    inputField: {
      flex: 1,
      ...typography.body,
      color: colors.text,
      backgroundColor: colors.card,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingTop: 10,
      paddingBottom: 10,
      maxHeight: 120,
      minHeight: INPUT_BAR_HEIGHT,
      textAlignVertical: "center",
    },
    sendBtn: {
      width: INPUT_BAR_HEIGHT,
      height: INPUT_BAR_HEIGHT,
      borderRadius: INPUT_BAR_HEIGHT / 2,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: {
      opacity: 0.45,
    },
  });
}
