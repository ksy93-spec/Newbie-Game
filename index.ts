import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

/* Skia는 웹에서 CanvasKit(wasm)을 먼저 불러야 한다. 네이티브에서는 바로 뜬다. */
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { LoadSkiaWeb } = require('@shopify/react-native-skia/lib/module/web');
  LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }).then(() => {
    registerRootComponent(require('./App').default);
  });
} else {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  registerRootComponent(require('./App').default);
}
