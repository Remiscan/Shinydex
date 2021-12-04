const template = document.createElement('template');
template.innerHTML = `
<div class="bg" data-loading="true"></div>
<img loading="lazy">
<svg>
  <style>
    #shiny-star {
      stroke: black;
    }
    @media (prefers-color-scheme: dark) {
      #shiny-star {
        stroke: transparent;
      }
    }
  </style>
  <defs>
    <g id="shiny-star">
      <svg viewBox="0 0 30 30" width="30" height="30">
        <path class="star" d="M 0 15 L 10.2 10.2 L 15 0 L 19.8 10.2 L 30 15 L 19.8 19.8 L 15 30 L 10.2 19.8 Z" fill="#fff6cc"/>
      </svg>
    </g>
  </defs>
  <g id="star-field">
  </g>
</svg>
`;

export default template;