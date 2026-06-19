import type { ReactNode } from "react";
import { useState } from "react";
import type {
  KeyboardTypeOptions,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles, type AppColors } from "../theme";
import { useThemeColors } from "../theme/ThemeProvider";

type AppInputProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  helperText?: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  editable?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function AppInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  helperText,
  error,
  multiline = false,
  keyboardType = "default",
  leftIcon,
  rightIcon,
  editable = true,
  autoCapitalize = "sentences",
  autoCorrect = false,
  onBlur,
  onFocus,
  containerStyle,
  inputStyle,
}: AppInputProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);
  const hasHelperText = Boolean(helperText);

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          keyboardType={keyboardType}
          multiline={multiline}
          onBlur={handleBlur}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          style={[styles.input, multiline && styles.multilineInput, inputStyle]}
          value={value}
        />
        {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
      </View>
      {hasError ? <Text style={styles.error}>{error}</Text> : null}
      {!hasError && hasHelperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  label: {
    ...typography.label,
    color: colors.textSoft,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.input,
    paddingHorizontal: spacing.md,
  },
  inputContainerFocused: {
    borderColor: colors.inputBorderFocus,
  },
  inputContainerError: {
    borderColor: colors.danger,
  },
  inputContainerDisabled: {
    opacity: 0.65,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  helper: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
}
