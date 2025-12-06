export default {
  expo: {
    name: "SportDue",
    slug: "coachpay-mobile",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sportdue.app"
    },
    android: {
      package: "com.sportdue.app",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      },
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },
    extra: {
      apiUrl: process.env.API_URL || "http://localhost:5000/api",
      eas: {
        projectId: "93ff71c0-c489-4be4-908c-9e7d1fd19ad8"
      }
    },
    // EAS Build will automatically inject API_URL from eas.json env vars
  }
};


