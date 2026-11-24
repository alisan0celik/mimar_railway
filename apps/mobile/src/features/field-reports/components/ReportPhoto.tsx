import { Image, type ImageStyle, type StyleProp, View } from "react-native";

import { useThemeColors } from "../../../shared/theme/ThemeProvider";

export type ReportPhotoSource = {
  uri: string;
  /** Sunucudaki fotoğraflar herkese açık değil; oturum anahtarıyla istenir. */
  authenticated: boolean;
};

type ReportPhotoProps = {
  source: ReportPhotoSource;
  token: string | null;
  style: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain";
};

/** Saha raporu fotoğrafı: cihazdaki kopya ya da sunucudaki yetkili adres. */
export function ReportPhoto({ source, token, style, resizeMode = "cover" }: ReportPhotoProps) {
  const colors = useThemeColors();

  if (source.authenticated && !token) {
    return <View style={[style as object, { backgroundColor: colors.surfaceMuted }]} />;
  }

  return (
    <Image
      resizeMode={resizeMode}
      source={
        source.authenticated
          ? { uri: source.uri, headers: { Authorization: `Bearer ${token}` } }
          : { uri: source.uri }
      }
      // Yer tutucu renk önce: görüntüleyici gibi kendi zeminini verenler onu ezebilsin.
      style={[{ backgroundColor: colors.surfaceMuted }, style]}
    />
  );
}
