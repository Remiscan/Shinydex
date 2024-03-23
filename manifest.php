<?php
$commonDir = '../_common';
require_once $commonDir.'/php/Translation.php';
$translation = new Translation(file_get_contents(__DIR__.'/dist/strings/meta.json'));
$httpLanguage = $translation->getLanguage();

header('Content-Type: application/json');
?>
{
	"name": "Shinydex",
	"short_name": "Shinydex",
	"description": "<?=$translation->get('meta-description')?>",
	"lang": "<?=$httpLanguage?>",
	"display": "standalone",
	"launch_handler": {
		"client_mode": "auto"
	},
	"start_url": "./",
	"orientation": "portrait",
	"icons": [
		{
			"src": "./images/app-icons/icon-192.png",
			"sizes": "192x192",
			"type": "image/png"
		}, {
			"src": "./images/app-icons/icon-512.png",
			"sizes": "512x512",
			"type": "image/png"
		}, {
			"src": "./images/app-icons/icon-192-maskable.png",
			"sizes": "192x192",
			"type": "image/png",
			"purpose": "maskable"
		}, {
			"src": "./images/app-icons/icon-512-maskable.png",
			"sizes": "512x512",
			"type": "image/png",
			"purpose": "maskable"
		}, {
			"src": "./images/app-icons/icon-maskable.svg",
			"sizes": "48x48 72x72 96x96 128x128 150x150 256x256 512x512 1024x1024",
			"type": "image/svg+xml",
			"purpose": "any"
		}
	],
	"theme_color": "#222222",
	"background_color": "#222222",
	"shortcuts": [
		{
			"name": "<?=$translation->get('shortcut-pokedex-name')?>",
			"short_name": "<?=$translation->get('shortcut-pokedex-short-name')?>",
			"url": "<?=$translation->get('shortcut-pokedex-url')?>",
			"description": "<?=$translation->get('shortcut-pokedex-description')?>",
			"icons": [
				{
					"src": "/shinydex/images/app-icons/shortcuts/pokedex.png",
					"sizes": "96x96"
				}
			]
		},
		{
			"name": "<?=$translation->get('shortcut-chasses-en-cours-name')?>",
			"short_name": "<?=$translation->get('shortcut-chasses-en-cours-short-name')?>",
			"url": "<?=$translation->get('shortcut-chasses-en-cours-url')?>",
			"description": "<?=$translation->get('shortcut-chasses-en-cours-description')?>",
			"icons": [
				{
					"src": "/shinydex/images/app-icons/shortcuts/chasses-en-cours.png",
					"sizes": "96x96"
				}
			]
		},
		{
			"name": "<?=$translation->get('shortcut-partage-name')?>",
			"short_name": "<?=$translation->get('shortcut-partage-short-name')?>",
			"url": "<?=$translation->get('shortcut-partage-url')?>",
			"description": "<?=$translation->get('shortcut-partage-description')?>",
			"icons": [
				{
					"src": "/shinydex/images/app-icons/shortcuts/partage.png",
					"sizes": "96x96"
				}
			]
		}
	],
	"screenshots" : [
		{
			"src": "/mon-portfolio/projets/shinydex/images/page-home.webp",
			"sizes": "720x1483",
			"type": "image/webp",
			"form_factor": "narrow",
			"label": "<?=$translation->get('shortcut-mes-chromatiques-description')?>"
		},
		{
			"src": "/mon-portfolio/projets/shinydex/images/page-pokedex.webp",
			"sizes": "720x1483",
			"type": "image/webp",
			"form_factor": "narrow",
			"label": "<?=$translation->get('shortcut-pokedex-description')?>"
		},
		{
			"src": "/mon-portfolio/projets/shinydex/images/page-hunts.webp",
			"sizes": "720x1483",
			"type": "image/webp",
			"form_factor": "narrow",
			"label": "<?=$translation->get('shortcut-chasses-en-cours-description')?>"
		},
		{
			"src": "/mon-portfolio/projets/shinydex/images/page-friends.webp",
			"sizes": "720x1483",
			"type": "image/webp",
			"form_factor": "narrow",
			"label": "<?=$translation->get('shortcut-partage-description')?>"
		},
		{
			"src": "/mon-portfolio/projets/shinydex/preview-pc.webp",
			"sizes": "1416x824",
			"type": "image/webp",
			"form_factor": "wide",
			"label": "<?=$translation->get('shortcut-mes-chromatiques-description')?>"
		}
	]
}