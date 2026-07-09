import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pragyan.pischeduler',
  appName: 'PI Scheduler',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
