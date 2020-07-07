const template = document.createElement('template');
template.innerHTML = `
<style>
  .rotator:before,
  .spinner-wrapper::after {
    content: '';
  }

  :host {
    backface-visibility: hidden;
    display: block;
    margin-right: auto;
    margin-left: auto;
    width: 4em;
    height: 4em;
    padding: 7px;
    border: 0 solid #ccc;
    border-radius: 50%;
    transform: scale(.7);
  }

  .spinner-wrapper {
    position: relative;
    width: 4em;
    height: 4em;
    border-radius: 100%;
    left: calc(50% - 2em);
  }

  .spinner-wrapper::after {
    background: var(--bg-color);
    border-radius: 50%;
    width: 3em;
    height: 3em;
    position: absolute;
    top: .5em;
    left: .5em;
  }

  .rotator {
    position: relative;
    width: 4em;
    border-radius: 4em;
    overflow: hidden;
    animation: rotate 2s infinite linear;
  }

  .rotator:before {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, red, red 47%, var(--bg-color) 47%, var(--bg-color) 53%, white 53%, white);
    border: 3px solid var(--bg-color);
    border-radius: 100%;
  }

  .inner-spin {
    background: var(--bg-color);
    height: 4em;
    width: 2em;
    animation: rotate-left 2.5s infinite cubic-bezier(.445, .050, .55, .95);
    border-radius: 2em 0 0 2em;
    transform-origin: 2em 2em;
  }

  .inner-spin:last-child {
    animation: rotate-right 2.5s infinite cubic-bezier(.445, .050, .55, .95);
    margin-top: -4em;
    border-radius: 0 2em 2em 0;
    float: right;
    transform-origin: 0 50%;
  }

  @keyframes rotate-left {
    100%,
    60%,
    75% { transform: rotate(360deg); }
  }

  @keyframes rotate {
    0% { transform: rotate(0); }
    100% { transform: rotate(360deg); }
  }

  @keyframes rotate-right {
    0%,
    25%,
    45% { transform: rotate(0); }
    100% { transform: rotate(360deg); }
  }
</style>

<div class="spinner-wrapper">
  <div class="rotator">
    <div class="inner-spin"></div>
    <div class="inner-spin"></div>
  </div>
</div>
`;

class loadSpinner extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
  }
}
customElements.define("load-spinner", loadSpinner);