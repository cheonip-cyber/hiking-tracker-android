import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.samsotta.hikingtracker',
  appName: '윤섭아등산가자',
  webDir:  'dist',
  server: {
    androidScheme: 'https',
    cleartext:     true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor:   '#060b18',
    buildOptions: {
      keystorePath:        'release.keystore',
      keystoreAlias:       'hiking',
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration:  2000,
      backgroundColor:     '#060b18',
      showSpinner:         false,
      androidSpinnerStyle: 'small',
    },
    StatusBar: {
      style:           'DARK',
      backgroundColor: '#060b18',
    },
    BackgroundGeolocation: {
      // 백그라운드 GPS 핵심 설정
      locationAuthorizationRequest: 'Always',
      desiredAccuracy:              'Navigation',
      stationaryRadius:             5,
      distanceFilter:               10,
      stopTimeout:                  5,
      debug:                        false,
      logLevel:                     0,
      stopOnTerminate:              false,
      startOnBoot:                  false,
      notification: {
        title: '윤섭아등산가자',
        text:  'GPS 기록 중...',
        color: '#e8650a',
      }
    }
  }
}

export default config
