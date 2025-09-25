import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'react-native-svg': 'react-native-svg/lib/commonjs/ReactNativeSVG.web.js',
    },
    extensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx', '.json'],
  },
  define: {
    global: 'globalThis',
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths()
  ],
})
