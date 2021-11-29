// Thank you https://infrequently.org/2020/12/resize-resilient-deferred-rendering/

const loaded = new WeakMap();

function isRectSame(r1: DOMRect, r2: DOMRect): boolean {
  const closeEnough = (a: number, b: number) => Math.abs(a - b) <= 2;
  return (closeEnough(r1.width, r2.width) && closeEnough(r1.height, r2.height));
}

function computeSize(element: Element, rect: DOMRect = element.getBoundingClientRect()): void {
  const oldRect = loaded.get(element);
  if (!oldRect || !isRectSame(oldRect, rect)) {
    loaded.set(element, rect);
    (element as HTMLElement).style.setProperty('contain-intrinsic-size', `${rect.width}px ${rect.height}px`);
  }
}

const intersector = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
  for (const entry of entries) {
    computeSize(entry.target, entry.boundingClientRect);
  }
}, {
  rootMargin: '504px 0px 504px 0px'
});

const resizor = new ResizeObserver((entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    computeSize(entry.target, entry.contentRect);
  }
});

export function lazyLoad(element: Element) {
  intersector.observe(element);
  resizor.observe(element);
}

export function enableLazyLoad(element: Element) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      (element as HTMLElement).style.setProperty('content-visibility', 'auto');
    })
  });
}

export function disableLazyLoad(element: Element) {
  (element as HTMLElement).style.setProperty('content-visibility', 'visible');
}