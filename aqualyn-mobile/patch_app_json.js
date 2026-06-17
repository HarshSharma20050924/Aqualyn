const fs = require('fs');
const appJsonPath = './app.json';
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

appJson.expo.android.package = "com.aqualyn.com";
appJson.expo.android.googleServicesFile = "./google-services.json";

if (!appJson.expo.plugins.includes('@react-native-firebase/app')) {
  appJson.expo.plugins.push('@react-native-firebase/app');
}
if (!appJson.expo.plugins.includes('@react-native-firebase/auth')) {
  appJson.expo.plugins.push('@react-native-firebase/auth');
}

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
console.log('Successfully patched app.json');
