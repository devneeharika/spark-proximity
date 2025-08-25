import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f4b39e433e7f4cffa10948a4ba0aae38',
  appName: 'spark-proximity',
  webDir: 'dist',
  server: {
    url: 'https://f4b39e43-3e7f-4cff-a109-48a4ba0aae38.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;