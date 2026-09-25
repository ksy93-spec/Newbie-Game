const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// 도트 스프라이트는 확대해도 뭉개지면 안 되므로 에셋 그대로 둔다
config.resolver.assetExts.push('ttf');
// 효과음은 tools/make-sfx.py가 구운 WAV다. 짧아서 압축할 이유가 없다.
if (config.resolver.assetExts.indexOf('wav') < 0) config.resolver.assetExts.push('wav');
module.exports = config;
