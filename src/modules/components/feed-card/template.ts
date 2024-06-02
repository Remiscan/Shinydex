const template = document.createElement('template');
template.innerHTML = /*html*/`
	<h2 class="title-small">
		<slot name="relative-date"></slot>
	</h2>

	<h3 class="title-medium" data-string="titre-flux-singulier">
		<slot name="username">
			<span data-string="an-anonymous-user"></span>
		</slot>
	</h3>

	<div class="shiny-list">
		<slot></slot>
	</div>

	<span class="how-many-more body-medium" data-string="how-many-more-message"></span>

	<a href="#" class="surface interactive label-large user-link" data-nav-section="chromatiques-ami" data-string="see-friends-pokemon"></a>

	<button type="button" class="surface interactive filled tonal" data-action="feliciter">
		<span class="material-icons" aria-hidden="true">celebration</span>
		<span class="label-large" data-string="feliciter"></span>
	</button>

	<wavy-divider scroll-animated part="wavy-divider"></wavy-divider>
`;

export default template;