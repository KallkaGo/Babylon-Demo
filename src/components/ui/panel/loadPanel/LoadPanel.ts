import El from '@utils/El.ts';
import Panel from '../../Panel';
import $ from 'jquery';
import { gsap } from 'gsap';
import Res from './RES.ts';
import './style.css';

/**
 * 加载界面
 */
export default class LoadPanel extends Panel<'load'> {
  constructor() {
    super('load');
    Res.forEach((res) => this._assets.push(res));
  }

  public show(): Promise<this> {
    return new Promise((ok, no) => {
      const { el } = this;
      $(el).addClass(['abs', 'full ']);

      const loader = El.create('div');
      $(loader).addClass('Loader').attr('data-text', 'Loading').appendTo(el);

      for (let i = 0; i < 4; i++) {
        const circle = El.create('span');
        $(circle).addClass('Loader__Circle').appendTo(loader);
      }

      ok(this);
    });
  }
  public hide(): Promise<this> {
    return new Promise((ok, no) => {
      gsap.to(this.el, {
        opacity: 0,
        duration: 0.5,
        ease: 'power1.inOut',
        onComplete: () => {
          ok(this);
        },
      });
    });
  }
}
