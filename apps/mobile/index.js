/**
 * Uygulamanın giriş noktası.
 *
 * Normalde `expo-router/entry` doğrudan `main` alanından yükleniyordu. Araya
 * girmemizin sebebi şu: açılış sırasında bir modül hata fırlatırsa React
 * Native bunu ölümcül sayıp süreci `abort()` ile kapatıyor ve geriye yalnızca
 * "abort() called" yazan bir çökme kaydı kalıyor — hatanın kendisi hiçbir
 * yerde görünmüyor. iOS'ta cihaz logu alınamadığı için tek okunabilir yer
 * ekranın kendisi.
 *
 * Burada hem paket değerlendirilirken fırlayan senkron hatayı yakalıyoruz hem
 * de RN'in genel hata işleyicisini devralıyoruz; ikisi de uygulamayı
 * kapatmak yerine mesajı ekrana basıyor.
 */
import React from "react";
import { AppRegistry, ScrollView, StyleSheet, Text } from "react-native";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1B2E" },
  content: { padding: 24, paddingTop: 72 },
  heading: { color: "#F97316", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  hint: { color: "#A1A1AA", fontSize: 12, marginBottom: 20 },
  label: { color: "#F97316", fontSize: 12, fontWeight: "700", marginTop: 16 },
  body: { color: "#FAFAFA", fontSize: 12, lineHeight: 18 },
});

function describe(error) {
  if (error === null || error === undefined) return "(bos hata)";
  if (typeof error === "string") return error;
  return [error.name, error.message, error.stack]
    .filter((part) => typeof part === "string" && part.length > 0)
    .join("\n\n");
}

/** Hatayı uygulamanın kendi ekranında gösterir. */
function showStartupFailure(error) {
  const detail = describe(error);

  function StartupFailure() {
    return (
      <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
        <Text style={styles.heading}>Açılış hatası</Text>
        <Text style={styles.hint}>Bu ekranın fotoğrafını çekip geliştiriciye gönderin.</Text>
        <Text style={styles.label}>DETAY</Text>
        <Text selectable style={styles.body}>
          {detail}
        </Text>
      </ScrollView>
    );
  }

  AppRegistry.registerComponent("main", () => StartupFailure);
}

// Modül değerlendirmesi dışında, sonradan fırlayan ölümcül hataları da yakala.
if (global.ErrorUtils && typeof global.ErrorUtils.setGlobalHandler === "function") {
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (isFatal) showStartupFailure(error);
  });
}

try {
  require("expo-router/entry");
} catch (error) {
  showStartupFailure(error);
}
