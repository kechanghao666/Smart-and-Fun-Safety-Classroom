const { AndroidConfig, withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidCleartextTraffic(config) {
  return withAndroidManifest(config, (configWithManifest) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
      configWithManifest.modResults,
    );

    mainApplication.$["android:usesCleartextTraffic"] = "true";

    return configWithManifest;
  });
};
