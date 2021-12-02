const template = document.createElement('template');
template.innerHTML = `
<svg>
  <circle class="progress-dots" cx="50%" cy="50%" r="50%"/>
  <circle class="progress-line" cx="50%" cy="50%" r="50%"/>
</svg>
`;

export default template;