const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// 도트 스프라이트는 확대해도 뭉개지면 안 되므로 에셋 그대로 둔다
config.resolver.assetExts.push('ttf');
module.exports = config;
