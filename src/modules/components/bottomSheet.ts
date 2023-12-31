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
        case 'content-top': {
          bottomSheet.contentAtTop = true;
          dialog.classList.add('at-top');
        } break;
      }
    } else {
      switch (entry.target.id) {
        case 'end': bottomSheet.fullyOpen = false; break;
        case 'start': bottomSheet.fullyClosed = true; break;
        case 'content-top': {
          bottomSheet.contentAtTop = false;
          dialog.classList.remove('at-top');
        } break;
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
        <span class="flag" id="content-top"></span>
        <slot></slot>
      </div>
      <span class="flag" id="start"></span>
      <span class="flag" id="end"></span>
    </div>
  </dialog>
`;



export const sheet = new CSSStyleSheet();
sheet.replaceSync(/*css*/`
  :host {
    --starting-position: 200px;
    --minimum-full-height: 400px;
    --duration-enter: 500ms;
    --duration-exit: 200ms;
    --easing: var(--easing-emphasized-decelerate);
    --margin-top: 72px;
    touch-action: none;
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
    max-width: 100%;
    max-height: calc(100% - var(--margin-top));
    margin-top: var(--margin-top);
    margin-bottom: 0;
    margin-inline: auto;
    padding: 0;
    top: unset;
    bottom: 0;
    overflow: hidden;
    --_easing: var(--easing, var(--easing-emphasized-accelerate));
    --_duration: var(--duration, var(--duration-exit));
    transition:
      transform var(--_duration) var(--easing),
      display var(--_duration) var(--easing) allow-discrete,
      overlay var(--_duration) var(--easing) allow-discrete;
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
    background: rgb(0, 0, 0, .33);
    --duration-enter: 500ms;
    --duration-exit: 200ms;
    --duration: var(--duration-exit);
    --easing: var(--easing-emphasized-standard);
    transition:
      opacity var(--duration) var(--easing),
      display var(--duration) var(--easing) allow-discrete,
      overlay var(--duration) var(--easing) allow-discrete;
  }

  dialog:not([open]) {
    display: none;
    transform: translateY(100%);
  }

  dialog:not([open]),
  dialog:not([open])::backdrop {
    pointer-events: none;
  }

  dialog[open] {
    --_duration: var(--duration, var(--duration-enter));
    var(--easing, var(--easing-emphasized-decelerate));
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
    --duration: var(--duration-enter);
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
    overflow: hidden;
    touch-action: none;
    scrollbar-gutter: stable;
    position: relative;
  }

  :host([drag]) [part="contents"] {
    padding-top: 0;
  }

  dialog.fully-open:not(.dragging) [part="contents"] {
    overflow-y: auto;
  }

  dialog.fully-open:not(.dragging).at-top [part="contents"] {
    touch-action: pan-down;
  }

  dialog.fully-open:not(.dragging):not(.at-top) [part="contents"] {
    touch-action: pan-y;
  }

  .flag {
    display: inline-block;
    height: 1px;
    width: 1px;
    position: absolute;
  }

  #content-top {
    top: 0;
  }

  #start {
    top: calc(var(--starting-position) - 1px);
  }

  #end {
    bottom: 0;
  }
`);



export class BottomSheet extends HTMLElement {
	shadow: ShadowRoot;
  moving = false;
  startingPosition = 200;
  fullyOpen = false;
  fullyClosed = false;
  contentAtTop = true;

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
    this.shadow.adoptedStyleSheets = [themesSheet, sheet];
  }

  show() {
    const dialog = this.dialog;
    const container = dialog?.querySelector('.container');
    const contents = dialog?.querySelector('[part="contents"]');
    if (dialog) {
      dialog.style.removeProperty('--dragged-distance');
      dialog.style.removeProperty('--duration');
      dialog.style.removeProperty('--easing');
      contents?.scrollTo(0, 0);

      if (this.modal) dialog.showModal();
      else            dialog.show();

      container?.addEventListener('pointerdown', this.pointerDownHandler);
      window.addEventListener('click', this.closeRequestHandler);
    }
  }

  close() {
    this.dialog?.close();
  }

  closeEventHandler = () => {
    const dialog = this.dialog;
    const container = this.dialog?.querySelector('.container');
    
    dialog?.classList.remove('fully-open');
    container?.removeEventListener('pointerdown', this.pointerDownHandler);
    window.removeEventListener('click', this.closeRequestHandler);
  }

  closeRequestHandler = (event: Event) => {
    const container = this.dialog?.querySelector('.container');
    const eventPath = event.composedPath();
    if (!container || !(eventPath.includes(container))) {
      this.dialog?.style.removeProperty('--dragged-distance');
      this.dialog?.style.removeProperty('--duration');
      this.dialog?.style.removeProperty('--easing');
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

    dialog.style.removeProperty('--dragged-distance');
    dialog.style.removeProperty('--duration');
    dialog.style.removeProperty('--easing');

    const startCoords = { x: downEvent.clientX, y: downEvent.clientY };
    let lastDistance = 0;
    let lastDirection = 0;

    const dialogRect = dialog.getBoundingClientRect();
    const maxDistance = dialogRect.height;
    const startRect = dialog.querySelector('#start')?.getBoundingClientRect();
    const startDistance = (startRect?.bottom ?? dialogRect.top) - dialogRect.top;
    
    const clickSafetyMargin = 10; // px
    const minOpeningDistance = 50; // px
    let frameReady = true;
    let time = Date.now();

    const pointerMoveHandler = (moveEvent: Event) => {
      if (!frameReady) return;
      frameReady = false;

      if (!(moveEvent instanceof PointerEvent)) return;

      moveEvent.preventDefault();
      if (!this.moving) container?.setPointerCapture(downEvent.pointerId);

      const currentCoords = { x: moveEvent.clientX, y: moveEvent.clientY };
      const currentDistance = currentCoords.y - startCoords.y;
      const currentDirection = Math.sign(currentDistance - lastDistance);

      // Restart timer when direction changes, to save only the inertia of the last move
      if (Math.sign(currentDirection) !== Math.sign(lastDirection)) time = Date.now();

      lastDistance = currentDistance;
      lastDirection = currentDirection;

      const fullyOpen = dialog.classList.contains('fully-open');

      const ignoreCondition = (fullyOpen && !this.contentAtTop && currentDirection === 1)
                            ||(fullyOpen && currentDirection === -1);

      if (!ignoreCondition) {
        // Safety margin to differentiate a click and a drag
        if (!this.moving && Math.abs(currentDistance) > clickSafetyMargin) {
          this.moving = true;
          dialog.classList.add('dragging');
        }

        dialog.style.setProperty('--dragged-distance', `${currentDistance}px`);
      }

      requestAnimationFrame(() => { frameReady = true });
    }

    const pointerUpHandler = (upEvent: Event) => {
      dialog.classList.remove('dragging');

      container?.removeEventListener('pointermove', pointerMoveHandler);
      container?.removeEventListener('pointerup', pointerUpHandler);
      container?.removeEventListener('pointercancel', pointerUpHandler);
      container?.releasePointerCapture(downEvent.pointerId);

      let totalDistance = maxDistance;
      let remainingDistance =  maxDistance;
      let duration = null;
      let easing = 'var(--easing-decelerate)';

      const dragDuration = Date.now() - time;
      const violentDrag = dragDuration < 100 && Math.abs(lastDistance) > 2 * minOpeningDistance;

      // If moved enough towards the top, treat as a successful opening
      if (lastDirection === -1 && Math.abs(lastDistance) > minOpeningDistance) {
        // Calculate the remaining animation time based on the current speed
        //const remainingDurationRatio = Math.round(100 * .001 * (Date.now() - time) * (1 - Math.abs(lastDistance)) / Math.abs(lastDistance)) / 100;
        totalDistance = maxDistance - startDistance;
        remainingDistance = totalDistance - Math.abs(lastDistance);

        dialog.classList.add('fully-open');
      }

      // If moved enough towards the bottom, treat as a successful closing / size reset
      else if (lastDirection === +1 && Math.abs(lastDistance) > minOpeningDistance) {
        // If we're going from fully open to partially open
        if (dialog.classList.contains('fully-open') && !this.fullyClosed) {
          totalDistance = maxDistance - startDistance;
          remainingDistance = totalDistance - Math.abs(lastDistance);
          if (violentDrag) this.close();
        }

        // If we're going from fully open to fully closed
        else if (dialog.classList.contains('fully-open') && this.fullyClosed) {
          totalDistance = maxDistance;
          remainingDistance = totalDistance - Math.abs(lastDistance);
          easing = 'linear';
          this.close();
        }
        
        // If we're going from partially open to fully closed
        else {
          totalDistance = startDistance;
          remainingDistance = totalDistance - Math.abs(lastDistance);
          easing = 'linear';
          this.close();
        }

        dialog.classList.remove('fully-open');
      }

      // If not moved enough, restore previous position
      else {
        duration = 500;
      }

      dialog.style.removeProperty('--dragged-distance');
      dialog.style.setProperty('--duration', `${
        duration ?? Math.min(750, 
          (Date.now() - time) * Math.abs(remainingDistance / lastDistance)
        )
      }ms`);
      dialog.style.setProperty('--easing', easing);
      
      this.moving = false;
    }

    container?.addEventListener('pointermove', pointerMoveHandler);
    container?.addEventListener('pointerup', pointerUpHandler);
    container?.addEventListener('pointercancel', pointerUpHandler);
  }


  connectedCallback() {
    const topTrigger = this.shadow.querySelector('#content-top');
    if (topTrigger) observer.observe(topTrigger);

    const startTrigger = this.shadow.querySelector('#start');
    if (startTrigger) observer.observe(startTrigger);

    const endTrigger = this.shadow.querySelector('#end');
    if (endTrigger) observer.observe(endTrigger);

    this.dialog?.addEventListener('close', this.closeEventHandler);
  }

  disconnectedCallback() {
    const topTrigger = this.shadow.querySelector('#content-top');
    if (topTrigger) observer.unobserve(topTrigger);

    const startTrigger = this.shadow.querySelector('#start');
    if (startTrigger) observer.unobserve(startTrigger);

    const endTrigger = this.shadow.querySelector('#end');
    if (endTrigger) observer.unobserve(endTrigger);

    this.dialog?.removeEventListener('close', this.closeEventHandler);
  }
}

if (!customElements.get('bottom-sheet')) customElements.define('bottom-sheet', BottomSheet);