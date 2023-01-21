// Thank you https://infrequently.org/2020/12/resize-resilient-deferred-rendering/

const loaded = new WeakMap();

function isRectSame(r1: DOMRect, r2: DOMRect): boolean {
  const closeEnough = (a: number, b: number) => Math.abs(a - b) <= 2;
  return (closeEnough(r1.width, r2.width) && closeEnough(r1.height, r2.height));
}

function computeSize(element: HTMLElement, rect: DOMRect = element.getBoundingClientRect()): void {
  const oldRect = loaded.get(element);
  if ((!oldRect || !isRectSame(oldRect, rect)) && (rect.width > 0 && rect.height > 0)) {
    loaded.set(element, rect);
    element.style.setProperty('contain-intrinsic-size', `100px ${rect.height}px`);
  }
}

const intersector = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
  for (const entry of entries) {
    if (!(entry.target instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
    computeSize(entry.target, entry.boundingClientRect);
  }
}, {
  rootMargin: '252px 0px 252px 0px'
});

const resizor = new ResizeObserver((entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    if (!(entry.target instanceof HTMLElement)) throw new TypeError(`Expecting HTMLElement`);
    computeSize(entry.target, entry.contentRect);
  }
});

/** Computes an element's size whenever it changes, and set it as its contain-intrinsic-size. */
export function lazyLoad(element: HTMLElement) {
  intersector.observe(element);
  resizor.observe(element);
}

export function enableLazyLoad(element: HTMLElement) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      element.style.setProperty('content-visibility', 'auto');
    })
  });
}

export function disableLazyLoad(element: HTMLElement) {
  element.style.setProperty('content-visibility', 'visible');
}