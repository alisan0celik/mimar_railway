const { withPodfile } = require("expo/config-plugins");

// GoogleSignIn 9.x -> AppCheckCore, GoogleUtilities ve RecaptchaInterop'un
// modular headers ile derlenmesini ister; aksi halde pod install
// "Swift pods cannot yet be integrated as static libraries" hatasi verir.
module.exports = function withGoogleSignInModularHeaders(config) {
  return withPodfile(config, (podConfig) => {
    const podfile = podConfig.modResults;
    if (!podfile.contents.includes("GoogleUtilities', :modular_headers")) {
      podfile.contents = podfile.contents.replace(
        /use_expo_modules!/,
        [
          "use_expo_modules!",
          "  pod 'GoogleUtilities', :modular_headers => true",
          "  pod 'RecaptchaInterop', :modular_headers => true",
        ].join("\n"),
      );
    }
    return podConfig;
  });
};
