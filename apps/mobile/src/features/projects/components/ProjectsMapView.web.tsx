import type { StyleProp, ViewStyle } from "react-native";

export type ProjectPin = {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
  label: string;
};

/**
 * react-native-maps web'de çalışmıyor. Web'de MAPS_AVAILABLE false olduğu için
 * bu bileşen hiç çizilmiyor; dosya yalnızca web paketinin derlenebilmesi için var.
 */
export function ProjectsMapView(_props: {
  pins: ProjectPin[];
  onSelect: (id: string | null) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return null;
}
