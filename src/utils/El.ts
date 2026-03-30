const El = {
  get: <T extends keyof IElementClassName>(className: T) => document.querySelector(`.${className}`) as IElementClassName[T],
  create: <T extends keyof HTMLElementTagNameMap>(tagName: T) => document.createElement(tagName),
};

interface IElementClassName {
  [className: string]: HTMLElement;
  app: HTMLDivElement;
  webgl: HTMLCanvasElement;
  iframebox: HTMLDivElement;
  panel: HTMLDivElement;
  pop: HTMLDivElement;
}

export default El;
