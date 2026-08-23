/**
 * Uygulamanın giriş noktası.
 *
 * Normalde `expo-router/entry` doğrudan `main` alanından yükleniyordu. Araya
 * girmemizin sebebi şu: açılış sırasında bir modül hata fırlatırsa React
 * Native bunu ölümcül sayıp süreci `abort()` ile kapatıyor ve geriye yalnızca
 * "abort() called" yazan bir çökme kaydı kalıyor — hatanın kendisi hiçbir
 * yerde görünmüyor. iOS cihaz logu bu makineden okunamadığı için tek
 * okunabilir yer ekranın kendisi.
 *
 * Dosya bilerek CommonJS: `import` ifadeleri dosyanın en üstüne kaldırılır ve
 * `try` bloğunun dışında kalırdı, dolayısıyla `react-native`'in kendi
 * başlatılması sırasında fırlayan hatayı yakalayamazdık. `require` ile sıra
 * bizim denetimimizde kalıyor.
 *
 * Bu bir teşhis aracıdır; açılış çökmesi anlaşıldığında geri alınmalı.
 */
"use strict";

var failure = null;
var stage = "baslangic";
var React = null;
var ReactNative = null;

function describe(error) {
  if (error === null || error === undefined) return "(bos hata)";
  if (typeof error === "string") return error;
  var parts = [error.name, error.message, error.stack];
  var text = "";
  for (var i = 0; i < parts.length; i += 1) {
    if (typeof parts[i] === "string" && parts[i].length > 0) {
      text += (text ? "\n\n" : "") + parts[i];
    }
  }
  return text || String(error);
}

/**
 * Hatayı uygulamanın kendi ekranında gösterir.
 *
 * `react-native` yüklenememişse çatı modüller doğrudan derin yollarından
 * istenir; ana giriş başarısız olsa bile bunlar çoğu zaman ayrı ayrı yüklenir.
 */
function renderFailure() {
  var RN = ReactNative;
  if (!RN) {
    try {
      RN = {
        AppRegistry: require("react-native/Libraries/ReactNative/AppRegistry"),
        Text: require("react-native/Libraries/Text/Text"),
        ScrollView: require("react-native/Libraries/Components/ScrollView/ScrollView"),
      };
    } catch (error) {
      return; // Gösterecek bir şey kalmadı.
    }
  }
  if (!React) {
    try {
      React = require("react");
    } catch (error) {
      return;
    }
  }

  var detail = "ASAMA: " + stage + "\n\n" + describe(failure);

  function StartupFailure() {
    return React.createElement(
      RN.ScrollView,
      {
        style: { flex: 1, backgroundColor: "#0B1B2E" },
        contentContainerStyle: { padding: 24, paddingTop: 72 },
      },
      React.createElement(
        RN.Text,
        { style: { color: "#F97316", fontSize: 18, fontWeight: "700", marginBottom: 4 } },
        "Açılış hatası",
      ),
      React.createElement(
        RN.Text,
        { style: { color: "#A1A1AA", fontSize: 12, marginBottom: 20 } },
        "Bu ekranın fotoğrafını çekip geliştiriciye gönderin.",
      ),
      React.createElement(
        RN.Text,
        { selectable: true, style: { color: "#FAFAFA", fontSize: 12, lineHeight: 18 } },
        detail,
      ),
    );
  }

  RN.AppRegistry.registerComponent("main", function () {
    return StartupFailure;
  });
}

function capture(error, failedStage) {
  if (failure === null) {
    failure = error;
    stage = failedStage;
  }
}

try {
  stage = "react";
  React = require("react");
} catch (error) {
  capture(error, "react");
}

if (failure === null) {
  try {
    stage = "react-native";
    ReactNative = require("react-native");
  } catch (error) {
    capture(error, "react-native");
  }
}

if (failure === null) {
  // Modül değerlendirmesi dışında, sonradan fırlayan ölümcül hataları da yakala.
  if (global.ErrorUtils && typeof global.ErrorUtils.setGlobalHandler === "function") {
    global.ErrorUtils.setGlobalHandler(function (error, isFatal) {
      if (!isFatal) return;
      capture(error, "calisma-zamani");
      renderFailure();
    });
  }

  try {
    stage = "expo-router/entry";
    require("expo-router/entry");
  } catch (error) {
    capture(error, "expo-router/entry");
  }
}

if (failure !== null) {
  renderFailure();
}
