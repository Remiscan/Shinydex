import '../materialButton.js';



const template = document.createElement('template');
template.innerHTML = /*html*/`
  <form name="search-box" part="form">
    <input type="text" name="search" id="search" class="surface elevation-3 interactive body-large" part="input"
           inputmode="search" enterkeyhint="search" role="searchbox" autocomplete="off">

    <label for="search" part="search-icon">
      <span class="material-icons">search</span>
    </label>

    <material-button type="reset" class="icon only-icon" part="reset-icon">
      <span slot="icon">close</span>
    </material-button>

    <a class="icon surface interactive" data-nav-section="obfuscator" data-nav-data='{ "search": true }' href="#" part="filter-icon">
      <span class="material-icons">filter_list</span>
    </a>
  </form>
`;

export default template;