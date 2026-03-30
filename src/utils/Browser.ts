import { Config } from '../Config';

const dom = document as any;
let key = 'hidden';
const hiddenListeners: (() => void)[] = [];
const showListeners: (() => void)[] = [];
const onWinChange = (e: Event) => {
  Config.debug && console.log(e.type, dom[key]);
  if (dom[key] || e.type == 'focusout' || e.type == 'blur') {
    Config.debug && console.log('隐藏');
    hiddenListeners.forEach((f) => f());
  } else {
    Config.debug && console.log('显示');
    showListeners.forEach((f) => f());
  }
};

if ('hidden' in dom) {
  key = 'hidden';
  window.addEventListener('visibilitychange', onWinChange);
} else if ('onfocusin' in dom) {
  window.addEventListener('focusin', onWinChange);
  window.addEventListener('focusout', onWinChange);
} else {
  window.addEventListener('pageshow', onWinChange);
  window.addEventListener('pagehide', onWinChange);
  window.addEventListener('focus', onWinChange);
  window.addEventListener('blur', onWinChange);
}

const browser = {
  onHidden: (f: () => void) => hiddenListeners.push(f),
  onShow: (f: () => void) => showListeners.push(f),
};

export default browser;
