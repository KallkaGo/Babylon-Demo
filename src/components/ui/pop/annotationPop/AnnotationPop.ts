import El from '@utils/El';
import Pop from '../../Pop';
import './style.css';
import Res from './RES';
import $ from 'jquery';
import gsap from 'gsap';

export default class AnnotationPop extends Pop<'annotation'> {
  constructor() {
    super('annotation');
    Res.forEach((res) => this._assets.push(res));
  }

  public show(): Promise<this> {
    const { el } = this;

    $(el).addClass(['abs']);

    const wrapper = El.create('div');

    $(wrapper).addClass('wrapper').appendTo(el);

    const container = El.create('div');
    $(container).addClass('container').css('background-color', '#1E1E1E').appendTo(wrapper);

    const titleContainer = El.create('div');

    $(titleContainer).addClass('title-container').appendTo(container);

    const titleInput = El.create('input');

    $(titleInput).attr('placeholder', 'Title *').addClass('title-input').appendTo(titleContainer);

    const descriptionContainer = El.create('div');

    $(descriptionContainer).addClass('description-container').appendTo(container);

    const descriptionTextarea = El.create('textarea');

    $(descriptionTextarea)
      .attr('placeholder', 'Description (add links, images and other formatting with Markdown)')
      .addClass('description-textarea')
      .appendTo(descriptionContainer);

    const okButton = El.create('button');
    $(okButton).addClass('ok-button').text('OK').appendTo(container);

    $(okButton).on('click', () => {});

    return new Promise((ok, no) => {
      gsap.set(wrapper, { opacity: 0 });
      gsap.to(wrapper, {
        opacity: 1,
        duration: 0.34,
        ease: 'power1.inOut',
        onComplete: () => {},
      });

      ok(this);
    });
  }
  public hide(): Promise<this> {
    return new Promise((ok, no) => {
      ok(this);
    });
  }
}
