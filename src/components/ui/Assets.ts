import El from '@utils/El';

// 用于记录资源是否加载完毕
const Assets: Map<string, boolean> = new Map();

const Load = (srcArr: string[]): Promise<void> => {
  return new Promise((ok, no) => {
    const loadQueue: string[] = [];
    for (let i = 0; i < srcArr.length; i++) {
      const src = srcArr[i];
      if (!Assets.has(src)) {
        loadQueue.push(src);
      }
    }

    if (loadQueue.length > 0) {
      let n = 0;
      let cnt = 0;
      const max = 5; // 同时可加载的最大数
      const next = () => {
        if (n >= loadQueue.length) return;
        if (cnt >= max) return;

        const src = loadQueue[n];
        Assets.set(src, false);
        const img = El.create('img');
        img.src = src;
        img.onload = () => {
          // Config.debug && console.log("加载完成", img.src)
          img.onload = null;
          img.src = '';
          Assets.set(src, true);
          img.remove();
          cnt--;
          if (check()) {
            ok();
          } else {
            next();
          }
        };
        n++;
        cnt++;
        if (cnt < max) {
          next();
        }
      };

      const check = () => {
        for (let i = 0; i < loadQueue.length; i++) {
          const src = loadQueue[i];
          if (!Assets.has(src)) {
            return false;
          }

          if (!Assets.get(src)) {
            return false;
          }
        }
        return true;
      };

      next();
    } else {
      ok();
    }
  });
};

export { Assets, Load };
