import type { StyleProp, ViewStyle } from "react-native";

import type { GeoPoint } from "../../../shared/location";
import type { MapRegion } from "../utils/projectMap";

/**
 * react-native-maps web'de çalışmıyor. Web'de MAPS_AVAILABLE false olduğu için
 * bu bileşen hiç çizilmiyor; dosya yalnızca web paketinin derlenebilmesi için var.
 */
export function LocationPickerMap(_props: {
  point: GeoPoint | null;
  initialRegion: MapRegion;
  onChange?: (point: GeoPoint) => void;
  focusRequest: number;
  style?: StyleProp<ViewStyle>;
}) {
  return null;
}
