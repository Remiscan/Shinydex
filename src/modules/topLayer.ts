type TopLayerNodeOrigin = { parent: Node | null, following: Node | null };
const topLayerNodes: Map<Node, TopLayerNodeOrigin> = new Map();

/** Promotes a node to the top-layer section. */
export function toTopLayer(element: Node) {
  const topLayer = document.querySelector('#top-layer');
  if (!(topLayer instanceof HTMLElement)) throw new Error('Expecting HTMLElement');
  const origin: TopLayerNodeOrigin = {
    parent: element.parentNode,
    following: element.nextSibling
  };
  topLayerNodes.set(element, origin);
  topLayer.appendChild(element);
}

/** Brings a node back from the top-layer section. */
export function backFromTopLayer(element: Node) {
  const topLayer = document.querySelector('#top-layer');
  if (!(topLayer instanceof HTMLElement)) throw new Error('Expecting HTMLElement');
  const origin = topLayerNodes.get(element);
  if (origin && origin.parent) {
    origin.parent.insertBefore(element, origin.following);
  }
}

function topLayerCloseHandler(event: Event) {
  const topLayer = document.querySelector('#top-layer');
  if (topLayer && event.composedPath().includes(topLayer)) return;
  closeTopLayer();
}

export function openTopLayer() {
  const sectionsActuelles = (document.body.getAttribute('data-section-actuelle') ?? '').split(' ');
  sectionsActuelles.push('top-layer');
  document.body.setAttribute('data-section-actuelle', sectionsActuelles.join(' '));
  window.addEventListener('click', topLayerCloseHandler);
  window.dispatchEvent(new Event('toplayeropen'));
}

export function closeTopLayer() {
  window.removeEventListener('click', topLayerCloseHandler);
  const sectionsActuelles = (document.body.getAttribute('data-section-actuelle') ?? '').replace('top-layer', '').split(' ');
  document.body.setAttribute('data-section-actuelle', sectionsActuelles.join(' '));
  window.dispatchEvent(new Event('toplayerclose'));
}

export function isTopLayerOpen() {
  const sectionsActuelles = (document.body.getAttribute('data-section-actuelle') ?? '').split(' ');
  return sectionsActuelles.includes('top-layer');
}