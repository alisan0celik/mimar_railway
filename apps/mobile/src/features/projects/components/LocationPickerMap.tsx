import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import MapView, { Marker, type MapPressEvent } from "react-native-maps";

import type { GeoPoint } from "../../../shared/location";
import { radius } from "../../../shared/theme";
import { useThemeColors, useThemeMode } from "../../../shared/theme/ThemeProvider";
import { isDarkThemeMode } from "../../../shared/theme/colors";
import { pointRegion, type MapRegion } from "../utils/projectMap";
import { MapTypeToggle, type ProjectMapType } from "./MapTypeToggle";

type Props = {
  point: GeoPoint | null;
  /** Yalnızca ilk açılışta kullanılıyor. */
  initialRegion: MapRegion;
  /** Verilmezse harita yalnızca gösterir. */
  onChange?: (point: GeoPoint) => void;
  /** Her artışında harita noktaya yakınlaşır (bulunduğum yer, yapıştırılan koordinat). */
  focusRequest: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * İşin yerini seçme haritası: dokunulan yere işaret konur, işaret sürüklenerek
 * kaydırılabilir. Web sürümü ayrı dosyada (LocationPickerMap.web.tsx).
 */
export function LocationPickerMap({ point, initialRegion, onChange, focusRequest, style }: Props) {
  const colors = useThemeColors();
  const dark = isDarkThemeMode(useThemeMode());
  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<ProjectMapType>("standard");
  const handledFocus = useRef(focusRequest);

  // Haritaya dokunarak seçilen nokta zaten görünüyor; yalnızca dışarıdan
  // gelen istekte (bulunduğum yer, yapıştırılan koordinat) yakınlaşılıyor.
  useEffect(() => {
    if (focusRequest === handledFocus.current) return;
    handledFocus.current = focusRequest;
    if (point) mapRef.current?.animateToRegion(pointRegion(point), 400);
  }, [focusRequest, point]);

  const handlePress = (event: MapPressEvent) => {
    // Android'de işarete dokunmak da haritaya dokunma olarak gelebiliyor.
    if (event.nativeEvent.action === "marker-press") return;
    onChange?.(event.nativeEvent.coordinate);
  };

  return (
    <View style={[styles.frame, { borderColor: colors.border }, style]}>
      <MapView
        initialRegion={initialRegion}
        mapType={mapType}
        onPress={onChange ? handlePress : undefined}
        pitchEnabled={false}
        ref={mapRef}
        rotateEnabled={false}
        style={StyleSheet.absoluteFill}
        toolbarEnabled={false}
        userInterfaceStyle={dark ? "dark" : "light"}
      >
        {point ? (
          <Marker
            coordinate={point}
            draggable={Boolean(onChange)}
            onDragEnd={(event) => onChange?.(event.nativeEvent.coordinate)}
            stopPropagation
          />
        ) : null}
      </MapView>
      <MapTypeToggle onChange={setMapType} value={mapType} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 300,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
});
