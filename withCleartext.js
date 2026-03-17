const { withAndroidManifest } = require('expo/config-plugins');
const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');

module.exports = function withCleartext(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application[0];
    app.$['android:usesCleartextTraffic'] = 'true';
    app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    
    // Write network security config
    const xmlDir = join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    mkdirSync(xmlDir, { recursive: true });
    writeFileSync(join(xmlDir, 'network_security_config.xml'), 
      '<?xml version="1.0" encoding="utf-8"?>\n<network-security-config>\n  <base-config cleartextTrafficPermitted="true">\n    <trust-anchors>\n      <certificates src="system" />\n    </trust-anchors>\n  </base-config>\n</network-security-config>');
    
    return config;
  });
};
