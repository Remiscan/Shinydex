const template = document.createElement('template');
template.innerHTML = /*html*/`
	<h2 class="title-small">
		<slot name="relative-date"></slot>
	</h2>

	<div class="user-list">
		<slot></slot>
	</div>
`;

export default template;