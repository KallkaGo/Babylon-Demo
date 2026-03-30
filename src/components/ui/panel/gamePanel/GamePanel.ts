import El from '@utils/El.ts';
import Panel from '../../Panel';
import $ from 'jquery';
import { gsap } from 'gsap';
import Res from './RES.ts';
import './style.css';
import { easeInOut } from '@utils/tools.ts';

interface IContainer {
  canvas: HTMLCanvasElement;
  copyCanvas: HTMLCanvasElement;
  transitionCanvas: HTMLCanvasElement;
  span: HTMLSpanElement;
}

/**
 * 加载界面
 */
export default class GamePanel extends Panel<'game'> {
  constructor() {
    super('game');
    this.containerMap = new Map();
    Res.forEach((res) => this._assets.push(res));
  }

  private containerMap: Map<string, IContainer>;

  private fadeTransition(oldCanvas: HTMLCanvasElement, newCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, sizes: { width: number; height: number }) {
    let progress = 0; // 用于控制渐变进度

    const animate = () => {
      ctx.clearRect(0, 0, sizes.width, sizes.height); // 清空画布

      const easedProgress = easeInOut(progress); // 应用缓入缓出效果

      // 设置旧画布透明度并绘制
      ctx.globalAlpha = 1 - easedProgress; // 旧画布逐渐透明
      ctx.drawImage(oldCanvas, 0, 0); // 绘制旧内容

      // 设置新画布透明度并绘制
      ctx.globalAlpha = easedProgress; // 新画布逐渐不透明
      ctx.drawImage(newCanvas, 0, 0); // 绘制新内容

      progress += 1 / 120; // 更新进度，速度可以按需调整

      if (progress < 1) {
        requestAnimationFrame(animate); // 继续动画
      } else {
        ctx.globalAlpha = 1; // 确保结束时透明度为 1
      }
    };

    requestAnimationFrame(animate); // 启动过渡动画
  }

  public lerpUpdate(data?: { [name: string]: any }) {
    const { containerMap } = this;
    if (data) {
      Object.assign(this.userData, data);
    }

    containerMap.forEach((value, key) => {
      const materialItem = this.userData.materialList.find((item: any) => item.name === key);

      if (materialItem) {
        const { name, sizes, data } = materialItem;
        const canvas = value.canvas; // 当前的 canvas
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

        // 使用传入的过渡画布
        const copyCanvas = value.copyCanvas; // 复用旧画布
        const copyCtx = copyCanvas.getContext('2d')!;
        const transitionCanvas = value.transitionCanvas; // 新的画布，或者图像数据
        const transitionCtx = transitionCanvas.getContext('2d')!;

        // 从当前 canvas 复制内容到 copyCanvas
        copyCtx.clearRect(0, 0, sizes.width, sizes.height); // 清空旧画布
        copyCtx.drawImage(canvas, 0, 0);

        // 在 transitionCanvas 上绘制新图像
        transitionCtx.clearRect(0, 0, sizes.width, sizes.height); // 清空新画布
        transitionCtx.putImageData(data, 0, 0);

        // 启动过渡动画
        this.fadeTransition(copyCanvas, transitionCanvas, ctx, sizes);

        // 更新标签
        if (value.span) {
          value.span.innerText = name;
        }
      }
    });
  }

  public update(data?: { [name: string]: any }) {
    const { containerMap } = this;
    if (data) {
      Object.assign(this.userData, data);
    }
    containerMap.forEach((value, key) => {
      // /* update Canvas */
      const { name, data, sizes } = this.userData.materialList.find((item: any) => item.name === key)!;
      const canvas = value.canvas;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, sizes.width, sizes.height);
      ctx?.putImageData(data, 0, 0);

      /* update label */
      value.span.innerText = name;
    });
  }

  public show(): Promise<this> {
    return new Promise((ok, no) => {
      const { el } = this;
      $(el).addClass(['abs', 'full ']);

      const container = El.create('div');
      $(container).addClass('container').appendTo(el);

      const materialList = this.userData.materialList;

      if (materialList && materialList.length > 0) {
        for (let i = 0; i < materialList.length; i++) {
          const { name, data, sizes } = materialList[i];
          const showContainer = El.create('div');
          $(showContainer).addClass('show-container').appendTo(container);
          const canvas = El.create('canvas');
          $(canvas).addClass(['show-canvas', name]).appendTo(showContainer);
          canvas.width = sizes.width;
          canvas.height = sizes.height;
          const ctx = canvas.getContext('2d')!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx?.putImageData(data, 0, 0);

          const copyCanvas = El.create('canvas');
          copyCanvas.width = sizes.width;
          copyCanvas.height = sizes.height;

          const transitionCanvas = El.create('canvas');

          transitionCanvas.width = sizes.width;
          transitionCanvas.height = sizes.height;

          /* label */
          const span = El.create('span');
          $(span).addClass('label').appendTo(showContainer);
          $(span).text(name);

          this.containerMap.set(name, { canvas, span, copyCanvas, transitionCanvas });
        }
      }
      gsap.set(this.el, { opacity: 0 });
      gsap.to(this.el, {
        opacity: 1,
        duration: 0.34,
        ease: 'none',
        onComplete: () => {
          ok(this);
        },
      });
    });
  }
  public hide(): Promise<this> {
    return new Promise((ok, no) => {
      gsap.to(this.el, {
        opacity: 0,
        duration: 0.34,
        ease: 'none',
        onComplete: () => {
          ok(this);
        },
      });
    });
  }
}
