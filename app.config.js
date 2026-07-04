require("dotenv/config");

const appJson = require("./app.json");

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

module.exports = () => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo.ios,
      config: {
        ...appJson.expo.ios.config,
        googleMapsApiKey,
      },
    },
    android: {
      ...appJson.expo.android,
      config: {
        ...appJson.expo.android.config,
        googleMaps: {
          ...appJson.expo.android.config.googleMaps,
          apiKey: googleMapsApiKey,
        },
      },
    },
  },
});
