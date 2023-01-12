const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form name="search-box" part="form">
    <input type="text" name="search" id="search" class="surface elevation-3 interactive body-large" part="input"
           inputmode="search" enterkeyhint="search" role="searchbox" autocomplete="off">

    <label for="search" part="search-icon">
      <span class="material-icons">search</span>
    </label>
    
    <button type="reset" part="reset-icon">
      <span class="material-icons">close</span>
    </button>

    <button type="button" part="filter-icon">
      <span class="material-icons">filter_list</span>
    </button>
  </form>
`;

export default template;