// @ts-expect-error
import materialIconsSheet from '../../../ext/material_icons.css' assert { type: 'css' };
// @ts-expect-error
import themesSheet from '../../../styles/themes.css.php' assert { type: 'css' };



/**
 * Observes when a bottom sheet is fully open.
 */
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const dialog = entry.target.closest('dialog');
    if (!dialog) continue;

    const shadowRoot = dialog.getRootNode();
    if (!(shadowRoot instanceof ShadowRoot)) continue;
    const bottomSheet = shadowRoot.host;
    if (!(bottomSheet instanceof BottomSheet)) continue;

    if (entry.intersectionRatio >= 1) {
      switch (entry.target.id) {
        case 'end': bottomSheet.fullyOpen = true; break;
        case 'start': bottomSheet.fullyClosed = false; break;
      }
    } else {
      switch (entry.target.id) {
        case 'end': bottomSheet.fullyOpen = false; break;
        case 'start': bottomSheet.fullyClosed = true; break;
      }
    }
  }
}, {
  threshold: [1],
});



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <dialog class="surface surface-container-low">
    <div class="container">
      <button type="button" aria-hidden="true" class="handle"></button>
      <div part="contents">
        <slot></slot>
      </div>
      <span id="start"></span>
      <span id="end"></span>
    </div>
  </dialog>
`;



export const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  :host {
    --starting-position: 200px;
    --minimum-full-height: 400px;
  }

  :host(:not([modal])) {
	  position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }

  dialog {
    display: grid;
    grid-template-rows: 1fr;
    border: none;
    border-radius: 28px 28px 0 0;
    width: 100%;
    margin-top: 72px;
    margin-bottom: 0;
    margin-inline: auto;
    padding: 0;
    top: unset;
    bottom: 0;
    overflow: hidden;
    transition:
      transform .2s var(--easing-standard),
      display .2s var(--easing-standard) allow-discrete,
      overlay .2s var(--easing-standard) allow-discrete;
  }

  :host(:not([modal])) dialog {
    position: absolute;
  }

  @media (min-width: 641px) {
    dialog {
      width: 640px;
      margin-top: 56px;
    }
  }

  dialog::backdrop {
    opacity: 0;
    background-color: rgb(var(--surface), .5);
    transition:
      opacity .2s var(--easing-standard),
      display .2s var(--easing-standard) allow-discrete,
      overlay .2s var(--easing-standard) allow-discrete;
  }

  dialog:not([open]) {
    display: none;
    transform: translateY(100%);
  }

  dialog[open] {
    transform: translateY(
      clamp(0px, 100% - var(--starting-position) + clamp(-100%, var(--dragged-distance, 0px), 100%), 100%)
    );
  }

  dialog[open].fully-open {
    transform: translateY(
      clamp(0px, clamp(0px, var(--dragged-distance, 0px), 100%), 100%)
    );
  }

  dialog[open]::backdrop {
    opacity: 1;
  }

  @starting-style {
    dialog[open] {
      transform: translateY(100%);
    }

    dialog[open]::backdrop {
      opacity: 0;
    }
  }

  dialog.dragging {
    transition: none;
  }

  .container {
    display: grid;
    overflow: hidden;
    position: relative;
  }

  :host([drag]) .container {
    grid-template-rows: 48px 1fr;
  }

  .handle {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: grab;
    display: grid;
    place-items: center;
  }

  .handle:active {
    cursor: grabbing;
  }

  .handle::before {
    display: block;
    content: '';
    width: 32px;
    height: 4px;
    background-color: rgb(var(--on-surface-variant));
    opacity: .4;
    border-radius: 2px;
  }

  :host(:not([drag])) .handle {
    display: none;
  }

  [part="contents"] {
    padding: 24px;
    overflow-y: hidden;
    scrollbar-gutter: stable;
  }

  :host([drag]) [part="contents"] {
    padding-top: 0;
  }

  dialog.fully-open:not(.dragging) [part="contents"] {
    overflow-y: auto;
  }

  #start, #end {
    display: inline-block;
    height: 1px;
    width: 1px;
    position: absolute;
  }

  #end {
    bottom: 0;
  }

  #start {
    top: calc(var(--starting-position) - 1px);
  }
`);



export class BottomSheet extends HTMLElement {
	shadow: ShadowRoot;
  moving = false;
  startingPosition = 200;
  fullyOpen = false;
  fullyClosed = false;

  get dialog() {
    return this.shadow.querySelector('dialog');
  }

  get modal() {
    return this.getAttribute('modal') != null;
  }

  constructor() {
	  super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [materialIconsSheet, themesSheet, sheet];
  }

  show() {
    const dialog = this.dialog;
    const container = this.dialog?.querySelector('.container');
    if (dialog) {
      if (this.modal) dialog.showModal();
      else            dialog.show();

      container?.addEventListener('pointerdown', this.pointerDownHandler);
      window.addEventListener('click', this.closeHandler);
    }
  }

  close() {
    const dialog = this.dialog;
    const container = this.dialog?.querySelector('.container');

    dialog?.close();
    container?.removeEventListener('pointerdown', this.pointerDownHandler);
    window.removeEventListener('click', this.closeHandler);
  }

  closeHandler = (event: Event) => {
    const container = this.dialog?.querySelector('.container');
    const eventPath = event.composedPath();
    if (!container || !(eventPath.includes(container))) {
      this.close();
    }
  }

  pointerDownHandler = (downEvent: Event) => {
    if (this.moving) return;
    if (!(downEvent instanceof PointerEvent)) return;
    if (!(this.dialog instanceof HTMLDialogElement)) return;
    if (downEvent.button !== 0) return; // Only act on left mouse click, touch or pen contact

    const dialog = this.dialog;
    const container = this.dialog?.querySelector('.container');

    container?.setPointerCapture(downEvent.pointerId);

    dialog.style.removeProperty('--dragged-distance');
    dialog.style.removeProperty('transition-timing-function');

    const startCoords = { x: downEvent.clientX, y: downEvent.clientY };
    let lastDistance = 0;
    let lastDirection = 0;
    const maxDistance = this.dialog.offsetHeight;
    const clickSafetyMargin = 10; // px
    const minOpeningDistance = 50; // px
    let frameReady = true;
    let time = Date.now();

    const pointerMoveHandler = (moveEvent: Event) => {
      if (!frameReady) return;
      frameReady = false;

      if (!(moveEvent instanceof PointerEvent)) return;

      const currentCoords = { x: moveEvent.clientX, y: moveEvent.clientY };
      const currentDistance = currentCoords.y - startCoords.y;
      const currentDirection = Math.sign(currentDistance - lastDistance);

      // Restart timer when direction changes, to save only the inertia of the last move
      if (Math.sign(currentDirection) !== Math.sign(lastDirection)) time = Date.now();

      lastDistance = currentDistance;
      lastDirection = currentDirection;

      // Safety margin to differentiate a click and a drag
      if (!this.moving && Math.abs(currentDistance) > clickSafetyMargin) {
        this.moving = true;
        dialog.classList.add('dragging');
      }

      dialog.style.setProperty('--dragged-distance', `${currentDistance}px`);

      requestAnimationFrame(() => { frameReady = true });
    }

    const pointerUpHandler = () => {
      dialog.classList.remove('dragging');

      container?.removeEventListener('pointermove', pointerMoveHandler);
      container?.removeEventListener('pointerup', pointerUpHandler);
      container?.removeEventListener('pointercancel', pointerUpHandler);

      // If moved enough towards the top, treat as a successful opening
      if (lastDirection === -1 && Math.abs(lastDistance) > minOpeningDistance) {
        // Calculate the remaining animation time based on the current speed
        //const remainingDurationRatio = Math.round(100 * .001 * (Date.now() - time) * (1 - Math.abs(lastDistance)) / Math.abs(lastDistance)) / 100;

        dialog.style.setProperty('transition-timing-function', 'var(--easing-decelerate)');
        dialog.classList.add('fully-open');
        dialog.style.removeProperty('--dragged-distance');
      }

      // If moved enough towards the bottom, treat as a successful closing / size reset
      else if (lastDirection === +1 && Math.abs(lastDistance) > minOpeningDistance) {
        if (dialog.classList.contains('fully-open') && !this.fullyClosed) {
          dialog.classList.remove('fully-open');
          dialog.style.removeProperty('--dragged-distance');
        } else {
          this.close();
          dialog.classList.remove('fully-open');
          dialog.style.removeProperty('--dragged-distance');
        }
      }

      // If not moved enough, restore previous position
      else {
        dialog.style.removeProperty('--dragged-distance');
      }
      
      this.moving = false;
    }

    container?.addEventListener('pointermove', pointerMoveHandler);
    container?.addEventListener('pointerup', pointerUpHandler);
    container?.addEventListener('pointercancel', pointerUpHandler);
  }


  connectedCallback() {
    const startTrigger = this.shadow.querySelector('#start');
    const endTrigger = this.shadow.querySelector('#end');
    if (startTrigger) observer.observe(startTrigger);
    if (endTrigger) observer.observe(endTrigger);
  }

  disconnectedCallback() {
    const startTrigger = this.shadow.querySelector('#start');
    const endTrigger = this.shadow.querySelector('#end');
    if (startTrigger) observer.unobserve(startTrigger);
    if (endTrigger) observer.unobserve(endTrigger);
  }
}

if (!customElements.get('bottom-sheet')) customElements.define('bottom-sheet', BottomSheet);