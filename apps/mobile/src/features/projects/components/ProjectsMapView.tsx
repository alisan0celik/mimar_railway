import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import MapView, { Marker, type MapPressEvent } from "react-native-maps";

import { radius } from "../../../shared/theme";
import { useThemeColors, useThemeMode } from "../../../shared/theme/ThemeProvider";
import { isDarkThemeMode } from "../../../shared/theme/colors";
import { regionAround } from "../utils/projectMap";
import { MapTypeToggle, type ProjectMapType } from "./MapTypeToggle";

export type ProjectPin = {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
  /** Ekran okuyucu için işin adı. */
  label: string;
};

type Props = {
  pins: ProjectPin[];
  onSelect: (id: string | null) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Konumu girilmiş işlerin haritası; işaretler süre durumuna göre renkli.
 * Web sürümü ayrı dosyada (ProjectsMapView.web.tsx).
 */
export function ProjectsMapView({ pins, onSelect, style }: Props) {
  const colors = useThemeColors();
  const dark = isDarkThemeMode(useThemeMode());
  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<ProjectMapType>("standard");

  const [initialRegion] = useState(() => regionAround(pins));

  // Görünüm yalnızca haritadaki noktalar değişince yeniden ayarlanıyor; renk
  // ya da ad değişikliği kullanıcının yakınlaştırdığı yeri bozmasın.
  const pointsKey = pins.map((pin) => `${pin.id}:${pin.latitude}:${pin.longitude}`).join("|");
  const fittedKey = useRef(pointsKey);
  useEffect(() => {
    if (pointsKey === fittedKey.current) return;
    fittedKey.current = pointsKey;
    mapRef.current?.animateToRegion(regionAround(pins), 400);
  }, [pointsKey, pins]);

  const handlePress = (event: MapPressEvent) => {
    if (event.nativeEvent.action === "marker-press") return;
    onSelect(null);
  };

  return (
    <View style={[styles.frame, { borderColor: colors.border }, style]}>
      <MapView
        initialRegion={initialRegion}
        mapType={mapType}
        moveOnMarkerPress={false}
        onPress={handlePress}
        pitchEnabled={false}
        ref={mapRef}
        rotateEnabled={false}
        style={StyleSheet.absoluteFill}
        toolbarEnabled={false}
        userInterfaceStyle={dark ? "dark" : "light"}
      >
        {pins.map((pin) => (
          <Marker
            accessibilityLabel={pin.label}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            identifier={pin.id}
            key={pin.id}
            onPress={() => onSelect(pin.id)}
            pinColor={pin.color}
            stopPropagation
          />
        ))}
      </MapView>
      <MapTypeToggle onChange={setMapType} value={mapType} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 380,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
});
