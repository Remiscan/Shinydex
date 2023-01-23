import '../../../../_common/polyfills/element-internals.js';



export default class CustomInput extends HTMLElement {
  static template: HTMLTemplateElement = document.createElement('template');
  static sheets: CSSStyleSheet[] = [];
  static defaultValue: any = '';
  static attributes: string[] = [];

  static formAssociated = true;
  #internals;
  shadow: ShadowRoot;

  inputHandler = (event: Event) => {
    this.value = this.input?.value ?? this.defaultValue;
    if (event.type === 'change') {
      this.propagateEvent(event);
    }
  };

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.shadow.appendChild((this.constructor as typeof CustomInput).template.content.cloneNode(true));
    this.shadow.adoptedStyleSheets = [...(this.constructor as typeof CustomInput).sheets];
    if ('ElementInternals' in window && 'setFormValue' in window.ElementInternals.prototype) {
      this.#internals = this.attachInternals();
    }
  }


  // Useful properties and methods for form-associated elements
  get form() { return this.#internals?.form; }
  get name() { return this.getAttribute('name'); }
  get type() { return this.localName; }
  get validity() {return this.#internals?.validity; }
  get validationMessage() {return this.#internals?.validationMessage; }
  get willValidate() {return this.#internals?.willValidate; }
  checkValidity() { return this.#internals?.checkValidity(); }
  reportValidity() {return this.#internals?.reportValidity(); }


  propagateEvent(event: Event) {
    const cloneEvent = new Event(event.type, event);
    this.dispatchEvent(cloneEvent);
  }


  get input(): any {
    const input = this.shadow.querySelector('input');
    return input;
  }


  get value(): any {
    return this.input?.value ?? this.defaultValue;
  }

  set value(val: any) {
    const input = this.input;
    if (!input) return;
    input.value = val;
    this.updateFormValue(val);
    this.dispatchEvent(new CustomEvent('valuechange', { detail: { value: val }}));
  }

  updateFormValue(val: any) {
    this.#internals?.setFormValue(String(val));
    const input = this.input;
    if (!input) return;
    this.#internals?.setValidity(input.validity, input.validationMessage);
  }

  get defaultValue() {
    return (this.constructor as typeof CustomInput).defaultValue;
  }

  get initialValue() {
    return this.getAttribute('value');
  }


  connectedCallback() {
    const initialValue = this.initialValue;
    if (initialValue) this.value = initialValue;

    const input = this.input;
    input?.addEventListener('input', this.inputHandler);
    input?.addEventListener('change', this.inputHandler);
  }


  disconnectedCallback() {
    const input = this.input;
    input?.removeEventListener('input', this.inputHandler);
    input?.removeEventListener('change', this.inputHandler);
  }


  static get globalAttributes() { return ['accesskey', 'autocapitalize', 'autofocus', 'contextmenu', 'dir', 'enterhintkey', 'inputmode', 'spellcheck', 'tabindex', 'title', 'translate', 'virtualkeyboardpolicy']; }

  static get observedAttributes() { return [...CustomInput.globalAttributes, ...this.attributes]; }
  

  attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;

    if (attr === 'type')       this.input?.setAttribute(attr, newValue ?? 'text');
    else if (newValue != null) this.input?.setAttribute(attr, newValue);
    else                       this.input?.removeAttribute(attr);
  }
}