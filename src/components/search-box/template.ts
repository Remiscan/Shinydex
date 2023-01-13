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

    <material-button class="icon only-icon" part="filter-icon">
      <span slot="icon">filter_list</span>
    </material-button>
  </form>
`;

export default template;