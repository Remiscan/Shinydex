const template = document.createElement('template');
template.innerHTML = `
<img loading="lazy" width="512" height="512" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=">
<svg width="512" height="512" viewBox="0 0 512 512">
  <style>
    #shiny-star {
      fill: #ffd400;
    }
    @media (prefers-color-scheme: dark) {
      #shiny-star {
        fill: #fff6cc;
      }
    }
  </style>
  <defs>
    <g id="shiny-star">
      <svg viewBox="0 0 30 30" width="30" height="30">
        <path class="star" d="M 0 15 L 10.2 10.2 L 15 0 L 19.8 10.2 L 30 15 L 19.8 19.8 L 15 30 L 10.2 19.8 Z"/>
      </svg>
    </g>
  </defs>
  <g id="star-field">
  </g>
</svg>
`;

export default template;