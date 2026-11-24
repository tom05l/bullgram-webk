/*
 * Originally from:
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

import type {TrueDcId} from '@types';
import {BASE_DC_ID} from '@lib/accounts/authKeyFingerprint';

export const MAIN_DOMAINS = ['webk.duckdns.org'];
export const DEFAULT_BACKGROUND_SLUG = 'pattern';

const threads = Math.min(4, navigator.hardwareConcurrency ?? 4);

const App = {
  id: 2040,
  hash: 'bullgram-private-network',
  pushServerKey: import.meta.env.VITE_PUSH_SERVER_KEY,
  version: import.meta.env.VITE_VERSION,
  versionFull: import.meta.env.VITE_VERSION_FULL,
  build: +import.meta.env.VITE_BUILD,
  langPackVersion: +import.meta.env.VITE_LANG_PACK_VERSION,
  langPack: 'webk',
  langPackCode: 'en',
  domains: MAIN_DOMAINS,
  baseDcId: BASE_DC_ID as TrueDcId,
  isMainDomain: MAIN_DOMAINS.includes(location.hostname),
  suffix: 'K',
  threads,
  lottieWorkers: threads,
  cryptoWorkers: threads,
  interclientBroadcastChannel: 'tgweb'
};

// * "Telegram WebK 2.2 (681)" - how the app names itself, in the main menu and under Settings
export function getAppVersionText() {
  return `Bullgram Web${App.suffix} ${App.version} (${App.build})`;
}


export default App;
