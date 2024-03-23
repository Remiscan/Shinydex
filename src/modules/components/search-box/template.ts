const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form name="search-box" part="form" class="search-form">
    <input type="text" name="search" id="search" class="surface surface-container-lowest interactive body-large" part="input"
           inputmode="search" enterkeyhint="search" role="searchbox" autocomplete="off">

    <label for="search" class="search-icon" part="search-icon">
      <span class="material-icons">search</span>
    </label>

    <button type="reset" class="surface interactive icon-button only-icon reset-icon" part="reset-icon" data-label="reset-search">
      <span class="material-icons">close</span>
    </button>

    <button type="button" class="icon-button surface interactive" data-action="open-filter-menu" part="filter-icon" data-label="open-filter-menu">
      <span class="material-icons">filter_list</span>
    </button>
  </form>
`;

export default template;