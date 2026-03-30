import El from '@utils/El';
import Pop from '../../Pop';
import './style.css';
import Res from './RES';
import $ from 'jquery';

export default class MarkPop extends Pop<'mark'> {
  constructor() {
    super('mark');
    Res.forEach((res) => this._assets.push(res));
  }

  public show(): Promise<this> {
    const { el } = this;

    $(el).addClass(['abs']);

    const container = El.create('div');

    const randomAssets = Res[Math.floor(Math.random() * Res.length)];

    $(container)
      .addClass(['container'])
      .css({ 'background-image': `url(${randomAssets})` })
      .appendTo(el);

    return new Promise((ok, no) => {
      ok(this);
    });
  }
  public hide(): Promise<this> {
    return new Promise((ok, no) => {
      ok(this);
    });
  }
}
