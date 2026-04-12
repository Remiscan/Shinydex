<?php
require_once __DIR__.'/class_Sprite.php';



class Forme extends Sprite {
	public static array $FORMS_DATA = [];

	public static function getFormsData() {
		$IGNORED = '"IGNORED"';
		$BASE = fn() => <<<JSON
			{
				"dbid": "",
				"name": {
					"fr": "",
					"en": ""
				},
				"catchable": true
			}
		JSON;
		$MEGA = fn () => <<<JSON
			{
				"dbid": "mega",
				"name": {
					"fr": "Méga-{{name}}",
					"en": "Mega {{name}}"
				},
				"catchable": false
			}
		JSON;
		$MEGAX = fn () => <<<JSON
			{
				"dbid": "xmega",
				"name": {
					"fr": "Méga-{{name}} X",
					"en": "Mega {{name}} X"
				},
				"catchable": false
			}
		JSON;
		$MEGAY = fn () => <<<JSON
			{
				"dbid": "ymega",
				"name": {
					"fr": "Méga-{{name}} Y",
					"en": "Mega {{name}} Y"
				},
				"catchable": false
			}
		JSON;
		$MEGAZ = fn () => <<<JSON
			{
				"dbid": "zmega",
				"name": {
					"fr": "Méga-{{name}} Z",
					"en": "Mega {{name}} Z"
				},
				"catchable": false
			}
		JSON;
		$PRIMAL = fn () => <<<JSON
			{
				"dbid": "primal",
				"name": {
					"fr": "Primo-{{name}}",
					"en": "Primal {{name}}"
				},
				"catchable": false
			}
		JSON;
		$ALOLA = fn () => <<<JSON
			{
				"dbid": "alola",
				"name": {
					"fr": "{{name}} d'Alola",
					"en": "Alolan {{name}}"
				},
				"catchable": true
			}
		JSON;
		$GALAR = fn () => <<<JSON
			{
				"dbid": "galar",
				"name": {
					"fr": "{{name}} de Galar",
					"en": "Galarian {{name}}"
				},
				"catchable": true
			}
		JSON;
		$HISUI = fn () => <<<JSON
			{
				"dbid": "hisui",
				"name": {
					"fr": "{{name}} de Hisui",
					"en": "Hisuian {{name}}"
				},
				"catchable": true
			}
		JSON;
		$PALDEA = fn () => <<<JSON
			{
				"dbid": "paldea",
				"name": {
					"fr": "{{name}} de Paldea",
					"en": "Paldean {{name}}"
				},
				"catchable": true
			}
		JSON;

		return json_decode(<<<JSON
			{
				"0": [
					{
						"dbid": "",
						"name": {
							"fr": "Œuf",
							"en": "Egg"
						},
						"catchable": false
					},
					{
						"dbid": "manaphy",
						"name": {
							"fr": "Œuf de Manaphy",
							"en": "Manaphy Egg"
						},
						"catchable": false
					}
				],
				"3": [
					{$BASE()},
					{$MEGA()}
				],
				"6": [
					{$BASE()},
					{$MEGAX()},
					{$MEGAY()}
				],
				"9": [
					{$BASE()},
					{$MEGA()}
				],
				"15": [
					{$BASE()},
					{$MEGA()}
				],
				"18": [
					{$BASE()},
					{$MEGA()}
				],
				"19": [
					{$BASE()},
					{$ALOLA()}
				],
				"20": [
					{$BASE()},
					{$ALOLA()}
				],
				"25": [
					{$BASE()},
					{
						"dbid": "original-cap",
						"name": {
							"fr": "{{name}} Casquette Originale",
							"en": "Original Cap {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "hoenn-cap",
						"name": {
							"fr": "{{name}} Casquette de Hoenn",
							"en": "Hoenn Cap {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "sinnoh-cap",
						"name": {
							"fr": "{{name}} Casquette de Sinnoh",
							"en": "Sinnoh Cap {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "unys-cap",
						"name": {
							"fr": "{{name}} Casquette d'Unys",
							"en": "Unova Cap {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "kalos-cap",
						"name": {
							"fr": "{{name}} Casquette de Kalos",
							"en": "Kalos Cap {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "alola-cap",
						"name": {
							"fr": "{{name}} Casquette d'Alola",
							"en": "Alola Cap {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "partner-cap",
						"name": {
							"fr": "{{name}} Casquette de Partenaire",
							"en": "Partner Cap {{name}}"
						},
						"catchable": false
					},
					{$IGNORED},
					{
						"dbid": "world-cap",
						"name": {
							"fr": "{{name}} Casquette Monde",
							"en": "World Cap {{name}}"
						},
						"catchable": false
					}
				],
				"26": [
					{$BASE()},
					{$ALOLA()},
					{$MEGAX()},
					{$MEGAY()}
				],
				"27": [
					{$BASE()},
					{$ALOLA()}
				],
				"28": [
					{$BASE()},
					{$ALOLA()}
				],
				"36": [
					{$BASE()},
					{$MEGA()}
				],
				"37": [
					{$BASE()},
					{$ALOLA()}
				],
				"38": [
					{$BASE()},
					{$ALOLA()}
				],
				"50": [
					{$BASE()},
					{$ALOLA()}
				],
				"51": [
					{$BASE()},
					{$ALOLA()}
				],
				"52": [
					{$BASE()},
					{$ALOLA()},
					{$GALAR()}
				],
				"53": [
					{$BASE()},
					{$ALOLA()}
				],
				"58": [
					{$BASE()},
					{$HISUI()}
				],
				"59": [
					{$BASE()},
					{$HISUI()}
				],
				"65": [
					{$BASE()},
					{$MEGA()}
				],
				"71": [
					{$BASE()},
					{$MEGA()}
				],
				"74": [
					{$BASE()},
					{$ALOLA()}
				],
				"75": [
					{$BASE()},
					{$ALOLA()}
				],
				"76": [
					{$BASE()},
					{$ALOLA()}
				],
				"77": [
					{$BASE()},
					{$GALAR()}
				],
				"78": [
					{$BASE()},
					{$GALAR()}
				],
				"79": [
					{$BASE()},
					{$GALAR()}
				],
				"80": [
					{$BASE()},
					{$MEGA()},
					{$GALAR()}
				],
				"83": [
					{$BASE()},
					{$GALAR()}
				],
				"88": [
					{$BASE()},
					{$ALOLA()}
				],
				"89": [
					{$BASE()},
					{$ALOLA()}
				],
				"94": [
					{$BASE()},
					{$MEGA()}
				],
				"100":[
					{$BASE()},
					{$HISUI()}
				],
				"101": [
					{$BASE()},
					{$HISUI()}
				],
				"103": [
					{$BASE()},
					{$ALOLA()}
				],
				"105": [
					{$BASE()},
					{$ALOLA()}
				],
				"110": [
					{$BASE()},
					{$GALAR()}
				],
				"115": [
					{$BASE()},
					{$MEGA()}
				],
				"121": [
					{$BASE()},
					{$MEGA()}
				],
				"122": [
					{$BASE()},
					{$GALAR()}
				],
				"127": [
					{$BASE()},
					{$MEGA()}
				],
				"128": [
					{$BASE()},
					{
						"dbid": "paldea",
						"name": {
							"fr": "{{name}} de Paldea Race Combative",
							"en": "Paldean {{name}} Combat Breed"
						},
						"catchable": true
					},
					{
						"dbid": "paldea-blaze",
						"name": {
							"fr": "{{name}} de Paldea Race Flamboyante",
							"en": "Paldean {{name}} Blaze Breed"
						},
						"catchable": true
					},
					{
						"dbid": "paldea-aqua",
						"name": {
							"fr": "{{name}} de Paldea Race Aquatique",
							"en": "Paldean {{name}} Aqua Breed"
						},
						"catchable": true
					}
				],
				"130": [
					{$BASE()},
					{$MEGA()}
				],
				"142": [
					{$BASE()},
					{$MEGA()}
				],
				"144": [
					{$BASE()},
					{$GALAR()}
				],
				"145": [
					{$BASE()},
					{$GALAR()}
				],
				"146": [
					{$BASE()},
					{$GALAR()}
				],
				"149": [
					{$BASE()},
					{$MEGA()}
				],
				"150": [
					{$BASE()},
					{$MEGAX()},
					{$MEGAY()}
				],
				"154": [
					{$BASE()},
					{$MEGA()}
				],
				"157": [
					{$BASE()},
					{$HISUI()}
				],
				"160": [
					{$BASE()},
					{$MEGA()}
				],
				"181": [
					{$BASE()},
					{$MEGA()}
				],
				"194": [
					{$BASE()},
					{$PALDEA()}
				],
				"199": [
					{$BASE()},
					{$GALAR()}
				],
				"201": [
					{
						"dbid": "a",
						"name": {
							"fr": "A",
							"en": "A"
						},
						"catchable": true
					},
					{
						"dbid": "b",
						"name": {
							"fr": "B",
							"en": "B"
						},
						"catchable": true
					},
					{
						"dbid": "c",
						"name": {
							"fr": "C",
							"en": "C"
						},
						"catchable": true
					},
					{
						"dbid": "d",
						"name": {
							"fr": "D",
							"en": "D"
						},
						"catchable": true
					},
					{
						"dbid": "e",
						"name": {
							"fr": "E",
							"en": "E"
						},
						"catchable": true
					},
					{
						"dbid": "f",
						"name": {
							"fr": "F",
							"en": "F"
						},
						"catchable": true
					},
					{
						"dbid": "g",
						"name": {
							"fr": "G",
							"en": "G"
						},
						"catchable": true
					},
					{
						"dbid": "h",
						"name": {
							"fr": "H",
							"en": "H"
						},
						"catchable": true
					},
					{
						"dbid": "i",
						"name": {
							"fr": "I",
							"en": "I"
						},
						"catchable": true
					},
					{
						"dbid": "j",
						"name": {
							"fr": "J",
							"en": "J"
						},
						"catchable": true
					},
					{
						"dbid": "k",
						"name": {
							"fr": "K",
							"en": "K"
						},
						"catchable": true
					},
					{
						"dbid": "l",
						"name": {
							"fr": "L",
							"en": "L"
						},
						"catchable": true
					},
					{
						"dbid": "m",
						"name": {
							"fr": "M",
							"en": "M"
						},
						"catchable": true
					},
					{
						"dbid": "n",
						"name": {
							"fr": "N",
							"en": "N"
						},
						"catchable": true
					},
					{
						"dbid": "o",
						"name": {
							"fr": "O",
							"en": "O"
						},
						"catchable": true
					},
					{
						"dbid": "p",
						"name": {
							"fr": "P",
							"en": "P"
						},
						"catchable": true
					},
					{
						"dbid": "q",
						"name": {
							"fr": "Q",
							"en": "Q"
						},
						"catchable": true
					},
					{
						"dbid": "r",
						"name": {
							"fr": "R",
							"en": "R"
						},
						"catchable": true
					},
					{
						"dbid": "s",
						"name": {
							"fr": "S",
							"en": "S"
						},
						"catchable": true
					},
					{
						"dbid": "t",
						"name": {
							"fr": "T",
							"en": "T"
						},
						"catchable": true
					},
					{
						"dbid": "u",
						"name": {
							"fr": "U",
							"en": "U"
						},
						"catchable": true
					},
					{
						"dbid": "v",
						"name": {
							"fr": "V",
							"en": "V"
						},
						"catchable": true
					},
					{
						"dbid": "w",
						"name": {
							"fr": "W",
							"en": "W"
						},
						"catchable": true
					},
					{
						"dbid": "x",
						"name": {
							"fr": "X",
							"en": "X"
						},
						"catchable": true
					},
					{
						"dbid": "y",
						"name": {
							"fr": "Y",
							"en": "Y"
						},
						"catchable": true
					},
					{
						"dbid": "z",
						"name": {
							"fr": "Z",
							"en": "Z"
						},
						"catchable": true
					},
					{
						"dbid": "!",
						"name": {
							"fr": "!",
							"en": "!"
						},
						"catchable": true
					},
					{
						"dbid": "?",
						"name": {
							"fr": "?",
							"en": "?"
						},
						"catchable": true
					}
				],
				"208": [
					{$BASE()},
					{$MEGA()}
				],
				"211": [
					{$BASE()},
					{$HISUI()}
				],
				"212": [
					{$BASE()},
					{$MEGA()}
				],
				"214": [
					{$BASE()},
					{$MEGA()}
				],
				"215": [
					{$BASE()},
					{$HISUI()}
				],
				"222": [
					{$BASE()},
					{$GALAR()}
				],
				"227": [
					{$BASE()},
					{$MEGA()}
				],
				"229": [
					{$BASE()},
					{$MEGA()}
				],
				"248": [
					{$BASE()},
					{$MEGA()}
				],
				"254": [
					{$BASE()},
					{$MEGA()}
				],
				"257": [
					{$BASE()},
					{$MEGA()}
				],
				"260": [
					{$BASE()},
					{$MEGA()}
				],
				"263": [
					{$BASE()},
					{$GALAR()}
				],
				"264": [
					{$BASE()},
					{$GALAR()}
				],
				"282": [
					{$BASE()},
					{$MEGA()}
				],
				"302": [
					{$BASE()},
					{$MEGA()}
				],
				"303": [
					{$BASE()},
					{$MEGA()}
				],
				"306": [
					{$BASE()},
					{$MEGA()}
				],
				"308": [
					{$BASE()},
					{$MEGA()}
				],
				"310": [
					{$BASE()},
					{$MEGA()}
				],
				"319": [
					{$BASE()},
					{$MEGA()}
				],
				"323": [
					{$BASE()},
					{$MEGA()}
				],
				"334": [
					{$BASE()},
					{$MEGA()}
				],
				"351": [
					{$BASE()},
					{
						"dbid": "sunny",
						"name": {
							"fr": "{{name}} Forme Solaire",
							"en": "Sunny Form {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "rainy",
						"name": {
							"fr": "{{name}} Forme Eau de Pluie",
							"en": "Rainy Form {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "snowy",
						"name": {
							"fr": "{{name}} Forme Blizzard",
							"en": "Snowy Form {{name}}"
						},
						"catchable": false
					}
				],
				"354": [
					{$BASE()},
					{$MEGA()}
				],
				"358": [
					{$BASE()},
					{$MEGA()}
				],
				"359": [
					{$BASE()},
					{$MEGA()},
					{$MEGAZ()}
				],
				"362":[
					{$BASE()},
					{$MEGA()}
				],
				"373": [
					{$BASE()},
					{$MEGA()}
				],
				"376": [
					{$BASE()},
					{$MEGA()}
				],
				"380": [
					{$BASE()},
					{$MEGA()}
				],
				"381": [
					{$BASE()},
					{$MEGA()}
				],
				"382": [
					{$BASE()},
					{$PRIMAL()}
				],
				"383": [
					{$BASE()},
					{$PRIMAL()}
				],
				"384": [
					{$BASE()},
					{$MEGA()}
				],
				"386": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Normale",
							"en": "Normal Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "attack",
						"name": {
							"fr": "{{name}} Forme Attaque",
							"en": "Attack Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "defense",
						"name": {
							"fr": "{{name}} Forme Défense",
							"en": "Defense Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "speed",
						"name": {
							"fr": "{{name}} Forme Vitesse",
							"en": "Speed Forme {{name}}"
						},
						"catchable": true
					}
				],
				"398": [
					{$BASE()},
					{$MEGA()}
				],
				"412": [
					{
						"dbid": "plant",
						"name": {
							"fr": "{{name}} Cape Plante",
							"en": "Plant Cloak {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "sandy",
						"name": {
							"fr": "{{name}} Cape Sable",
							"en": "Sandy Cloak {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "trash",
						"name": {
							"fr": "{{name}} Cape Déchet",
							"en": "Trash Cloak {{name}}"
						},
						"catchable": true
					}
				],
				"413": [
					{
						"dbid": "plant",
						"name": {
							"fr": "{{name}} Cape Plante",
							"en": "Plant Cloak {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "sandy",
						"name": {
							"fr": "{{name}} Cape Sable",
							"en": "Sandy Cloak {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "trash",
						"name": {
							"fr": "{{name}} Cape Déchet",
							"en": "Trash Cloak {{name}}"
						},
						"catchable": true
					}
				],
				"421": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Temps Couvert",
							"en": "Overcast Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "sunny",
						"name": {
							"fr": "{{name}} Temps Ensoleillé",
							"en": "Sunshine Form {{name}}"
						},
						"catchable": true
					}
				],
				"422": [
					{
						"dbid": "west",
						"name": {
							"fr": "{{name}} Mer Occident",
							"en": "West Sea {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "east",
						"name": {
							"fr": "{{name}} Mer Orient",
							"en": "East Sea {{name}}"
						},
						"catchable": true
					}
				],
				"423": [
					{
						"dbid": "west",
						"name": {
							"fr": "{{name}} Mer Occident",
							"en": "West Sea {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "east",
						"name": {
							"fr": "{{name}} Mer Orient",
							"en": "East Sea {{name}}"
						},
						"catchable": true
					}
				],
				"428": [
					{$BASE()},
					{$MEGA()}
				],
				"445": [
					{$BASE()},
					{$MEGA()},
					{$MEGAZ()}
				],
				"448": [
					{$BASE()},
					{$MEGA()},
					{$MEGAZ()}
				],
				"460": [
					{$BASE()},
					{$MEGA()}
				],
				"475": [
					{$BASE()},
					{$MEGA()}
				],
				"478": [
					{$BASE()},
					{$MEGA()}
				],
				"479": [
					{$BASE()},
					{
						"dbid": "heat",
						"name": {
							"fr": "{{name}} Chaleur",
							"en": "Heat {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "wash",
						"name": {
							"fr": "{{name}} Lavage",
							"en": "Wash {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "frost",
						"name": {
							"fr": "{{name}} Froid",
							"en": "Frost {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "fan",
						"name": {
							"fr": "{{name}} Hélice",
							"en": "Fan {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "mow",
						"name": {
							"fr": "{{name}} Tonte",
							"en": "Mow {{name}}"
						},
						"catchable": true
					}
				],
				"483": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Alternative",
							"en": "Altered Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "origin",
						"name": {
							"fr": "{{name}} Forme Originelle",
							"en": "Origin Forme {{name}}"
						},
						"catchable": true
					}
				],
				"484": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Alternative",
							"en": "Altered Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "origin",
						"name": {
							"fr": "{{name}} Forme Originelle",
							"en": "Origin Forme {{name}}"
						},
						"catchable": true
					}
				],
				"485": [
					{$BASE()},
					{$MEGA()}
				],
				"487": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Alternative",
							"en": "Altered Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "origin",
						"name": {
							"fr": "{{name}} Forme Originelle",
							"en": "Origin Forme {{name}}"
						},
						"catchable": true
					}
				],
				"491": [
					{$BASE()},
					{$MEGA()}
				],
				"492": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Terrestre",
							"en": "Land Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "sky",
						"name": {
							"fr": "{{name}} Forme Céleste",
							"en": "Sky Forme {{name}}"
						},
						"catchable": false
					}
				],
				"493": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Type Normal",
							"en": "Normal-type {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "fighting",
						"name": {
							"fr": "{{name}} Type Combat",
							"en": "Fighting-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "flying",
						"name": {
							"fr": "{{name}} Type Vol",
							"en": "Flying-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "poison",
						"name": {
							"fr": "{{name}} Type Poison",
							"en": "Poison-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "ground",
						"name": {
							"fr": "{{name}} Type Sol",
							"en": "Ground-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "rock",
						"name": {
							"fr": "{{name}} Type Roche",
							"en": "Rock-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "bug",
						"name": {
							"fr": "{{name}} Type Insecte",
							"en": "Bug-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "ghost",
						"name": {
							"fr": "{{name}} Type Spectre",
							"en": "Ghost-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "steel",
						"name": {
							"fr": "{{name}} Type Acier",
							"en": "Steel-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "fire",
						"name": {
							"fr": "{{name}} Type Feu",
							"en": "Fire-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "water",
						"name": {
							"fr": "{{name}} Type Eau",
							"en": "Water-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "grass",
						"name": {
							"fr": "{{name}} Type Plante",
							"en": "Grass-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "electric",
						"name": {
							"fr": "{{name}} Type Électrik",
							"en": "Electric-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "psychic",
						"name": {
							"fr": "{{name}} Type Psy",
							"en": "Psychic-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "ice",
						"name": {
							"fr": "{{name}} Type Glace",
							"en": "Ice-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "dragon",
						"name": {
							"fr": "{{name}} Type Dragon",
							"en": "Dragon-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "dark",
						"name": {
							"fr": "{{name}} Type Ténèbres",
							"en": "Dark-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "fairy",
						"name": {
							"fr": "{{name}} Type Fée",
							"en": "Fairy-type {{name}}"
						},
						"catchable": false
					},
					{$IGNORED}
				],
				"500": [
					{$BASE()},
					{$MEGA()}
				],
				"503":[
					{$BASE()},
					{$HISUI()}
				],
				"530": [
					{$BASE()},
					{$MEGA()}
				],
				"531": [
					{$BASE()},
					{$MEGA()}
				],
				"545": [
					{$BASE()},
					{$MEGA()}
				],
				"549": [
					{$BASE()},
					{$HISUI()}
				],
				"550": [
					{
						"dbid": "red",
						"name": {
							"fr": "{{name}} Motif Rouge",
							"en": "Red-Striped {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "blue",
						"name": {
							"fr": "{{name}} Motif Bleu",
							"en": "Blue-Striped {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "white",
						"name": {
							"fr": "{{name}} Motif Blanc",
							"en": "White-Striped {{name}}"
						},
						"catchable": true
					}
				],
				"554": [
					{$BASE()},
					{$GALAR()}
				],
				"555": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Mode Standard",
							"en": "Standard Mode {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "zen",
						"name": {
							"fr": "{{name}} Mode Transe",
							"en": "Zen Mode {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "galar",
						"name": {
							"fr": "{{name}} de Galar",
							"en": "Standard Mode Galarian {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "galar-zen",
						"name": {
							"fr": "{{name}} de Galar - Mode Transe",
							"en": "Zen Mode Galarian {{name}}"
						},
						"catchable": false
					}
				],
				"560": [
					{$BASE()},
					{$MEGA()}
				],
				"562": [
					{$BASE()},
					{$GALAR()}
				],
				"570": [
					{$BASE()},
					{$HISUI()}
				],
				"571": [
					{$BASE()},
					{$HISUI()}
				],
				"585": [
					{
						"dbid": "spring",
						"name": {
							"fr": "{{name}} Forme Printemps",
							"en": "Spring Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "summer",
						"name": {
							"fr": "{{name}} Forme Été",
							"en": "Summer Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "autumn",
						"name": {
							"fr": "{{name}} Forme Automne",
							"en": "Autumn Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "winter",
						"name": {
							"fr": "{{name}} Forme Hiver",
							"en": "Winter Form {{name}}"
						},
						"catchable": true
					}
				],
				"586": [
					{
						"dbid": "spring",
						"name": {
							"fr": "{{name}} Forme Printemps",
							"en": "Spring Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "summer",
						"name": {
							"fr": "{{name}} Forme Été",
							"en": "Summer Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "autumn",
						"name": {
							"fr": "{{name}} Forme Automne",
							"en": "Autumn Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "winter",
						"name": {
							"fr": "{{name}} Forme Hiver",
							"en": "Winter Form {{name}}"
						},
						"catchable": true
					}
				],
				"604": [
					{$BASE()},
					{$MEGA()}
				],
				"609":[
					{$BASE()},
					{$MEGA()}
				],
				"618": [
					{$BASE()},
					{$GALAR()}
				],
				"623": [
					{$BASE()},
					{$MEGA()}
				],
				"628": [
					{$BASE()},
					{$HISUI()}
				],
				"641": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Avatar",
							"en": "Incarnate Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "therian",
						"name": {
							"fr": "{{name}} Totémique",
							"en": "Therian Forme {{name}}"
						},
						"catchable": true
					}
				],
				"642": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Avatar",
							"en": "Incarnate Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "therian",
						"name": {
							"fr": "{{name}} Totémique",
							"en": "Therian Forme {{name}}"
						},
						"catchable": true
					}
				],
				"645": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Avatar",
							"en": "Incarnate Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "therian",
						"name": {
							"fr": "{{name}} Totémique",
							"en": "Therian Forme {{name}}"
						},
						"catchable": true
					}
				],
				"646": [
					{$BASE()},
					{
						"dbid": "white",
						"name": {
							"fr": "{{name}} Blanc",
							"en": "White {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "black",
						"name": {
							"fr": "{{name}} Noir",
							"en": "Black {{name}}"
						},
						"catchable": false
					}
				],
				"647": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Aspect Normal",
							"en": "Ordinary Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "resolute",
						"name": {
							"fr": "{{name}} Aspect Décidé",
							"en": "Resolute Form {{name}}"
						},
						"catchable": true
					}
				],
				"648": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Chant",
							"en": "Aria Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "pirouette",
						"name": {
							"fr": "{{name}} Forme Danse",
							"en": "Pirouette Forme {{name}}"
						},
						"catchable": false
					}
				],
				"649": [
					{$BASE()},
					{
						"dbid": "douse",
						"name": {
							"fr": "{{name}} Module Aqua",
							"en": "Douse Drive {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "shock",
						"name": {
							"fr": "{{name}} Module Choc",
							"en": "Shock Drive {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "burn",
						"name": {
							"fr": "{{name}} Module Pyro",
							"en": "Burn Drive {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "chill",
						"name": {
							"fr": "{{name}} Module Cryo",
							"en": "Chill Drive {{name}}"
						},
						"catchable": false
					}
				],
				"652": [
					{$BASE()},
					{$MEGA()}
				],
				"655": [
					{$BASE()},
					{$MEGA()}
				],
				"658": [
					{$BASE()},
					{$IGNORED},
					{
						"dbid": "ash",
						"name": {
							"fr": "{{name}} Forme Sacha",
							"en": "Ash-{{name}}"
						},
						"catchable": false
					},
					{$MEGA()}
				],
				"666": [
					{
						"dbid": "icysnow",
						"name": {
							"fr": "{{name}} Motif Blizzard",
							"en": "Icy Snow Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "polar",
						"name": {
							"fr": "{{name}} Motif Banquise",
							"en": "Polar Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "tundra",
						"name": {
							"fr": "{{name}} Motif Glace",
							"en": "Tundra Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "continental",
						"name": {
							"fr": "{{name}} Motif Continent",
							"en": "Continental Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "garden",
						"name": {
							"fr": "{{name}} Motif Verdure",
							"en": "Garden Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "elegant",
						"name": {
							"fr": "{{name}} Motif Monarchie",
							"en": "Elegant Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "meadow",
						"name": {
							"fr": "{{name}} Motif Floraison",
							"en": "Meadow Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "modern",
						"name": {
							"fr": "{{name}} Motif Métropole",
							"en": "Modern Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "marine",
						"name": {
							"fr": "{{name}} Motif Rivage",
							"en": "Marine Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "archipelago",
						"name": {
							"fr": "{{name}} Motif Archipel",
							"en": "Achipelago Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "highplains",
						"name": {
							"fr": "{{name}} Motif Sécheresse",
							"en": "High Plains Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "sandstorm",
						"name": {
							"fr": "{{name}} Motif Sable",
							"en": "Sandstorm Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "river",
						"name": {
							"fr": "{{name}} Motif Delta",
							"en": "River Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "monsoon",
						"name": {
							"fr": "{{name}} Motif Cyclone",
							"en": "Monsoon Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "savanna",
						"name": {
							"fr": "{{name}} Motif Mangrove",
							"en": "Savanna Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "sun",
						"name": {
							"fr": "{{name}} Motif Zénith",
							"en": "Sun Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "ocean",
						"name": {
							"fr": "{{name}} Motif Soleil Levant",
							"en": "Ocean Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "jungle",
						"name": {
							"fr": "{{name}} Motif Jungle",
							"en": "Jungle Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "fancy",
						"name": {
							"fr": "{{name}} Motif Fantaisie",
							"en": "Fancy Pattern {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "pokeball",
						"name": {
							"fr": "{{name}} Motif Poké Ball",
							"en": "Poké Ball Pattern {{name}}"
						},
						"catchable": true
					}
				],
				"668": [
					{$BASE()},
					{$MEGA()}
				],
				"669": [
					{
						"dbid": "red",
						"name": {
							"fr": "{{name}} Fleur Rouge",
							"en": "Red Flower {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "yellow",
						"name": {
							"fr": "{{name}} Fleur Jaune",
							"en": "Yellow Flower {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "orange",
						"name": {
							"fr": "{{name}} Fleur Orange",
							"en": "Orange Flower {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "blue",
						"name": {
							"fr": "{{name}} Fleur Bleue",
							"en": "Blue Flower {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "white",
						"name": {
							"fr": "{{name}} Fleur Blanche",
							"en": "White Flower {{name}}"
						},
						"catchable": true
					}
				],
				"670": [
					{
						"dbid": "red",
						"name": {
							"fr": "{{name}} Fleur Rouge",
							"en": "Red Flower {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "yellow",
						"name": {
							"fr": "{{name}} Fleur Jaune",
							"en": "Yellow Flower {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "orange",
						"name": {
							"fr": "{{name}} Fleur Orange",
							"en": "Orange Flower {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "blue",
						"name": {
							"fr": "{{name}} Fleur Bleue",
							"en": "Blue Flower {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "white",
						"name": {
							"fr": "{{name}} Fleur Blanche",
							"en": "White Flower {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "eternal",
						"name": {
							"fr": "{{name}} Fleur Éternelle",
							"en": "Eternal Flower {{name}}"
						},
						"catchable": false
					},
					{$MEGA()}
				],
				"671": [
					{
						"dbid": "red",
						"name": {
							"fr": "{{name}} Fleur Rouge",
							"en": "Red Flower {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "yellow",
						"name": {
							"fr": "{{name}} Fleur Jaune",
							"en": "Yellow Flower {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "orange",
						"name": {
							"fr": "{{name}} Fleur Orange",
							"en": "Orange Flower {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "blue",
						"name": {
							"fr": "{{name}} Fleur Bleue",
							"en": "Blue Flower {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "white",
						"name": {
							"fr": "{{name}} Fleur Blanche",
							"en": "White Flower {{name}}"
						},
						"catchable": true
					}
				],
				"676": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Sauvage",
							"en": "Natural Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "heart",
						"name": {
							"fr": "{{name}} Coupe Cœur",
							"en": "Heart Trim {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "star",
						"name": {
							"fr": "{{name}} Coupe Étoile",
							"en": "Star Trim {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "diamond",
						"name": {
							"fr": "{{name}} Coupe Diamant",
							"en": "Diamond Trim {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "debutante",
						"name": {
							"fr": "{{name}} Coupe Demoiselle",
							"en": "Debutante Trim {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "matron",
						"name": {
							"fr": "{{name}} Coupe Madame",
							"en": "Matron Trim {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "dandy",
						"name": {
							"fr": "{{name}} Coupe Monsieur",
							"en": "Dandy Trim {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "la-reine",
						"name": {
							"fr": "{{name}} Coupe Reine",
							"en": "La Reine Trim {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "kabuki",
						"name": {
							"fr": "{{name}} Coupe Kabuki",
							"en": "Kabuki Trim {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "pharaoh",
						"name": {
							"fr": "{{name}} Coupe Pharaon",
							"en": "Pharaoh Trim {{name}}"
						},
						"catchable": true
					}
				],
				"678": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} mâle",
							"en": "Male {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "female",
						"name": {
							"fr": "{{name}} femelle",
							"en": "Female {{name}}"
						},
						"catchable": true
					},
					{$MEGA()}
				],
				"681": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Parade",
							"en": "Shield Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "blade",
						"name": {
							"fr": "{{name}} Forme Assaut",
							"en": "Blade Forme {{name}}"
						},
						"catchable": false
					}
				],
				"687": [
					{$BASE()},
					{$MEGA()}
				],
				"689": [
					{$BASE()},
					{$MEGA()}
				],
				"691": [
					{$BASE()},
					{$MEGA()}
				],
				"701": [
					{$BASE()},
					{$MEGA()}
				],
				"705": [
					{$BASE()},
					{$HISUI()}
				],
				"706": [
					{$BASE()},
					{$HISUI()}
				],
				"710": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Taille Normale",
							"en": "Average Size {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "small",
						"name": {
							"fr": "{{name}} Taille Mini",
							"en": "Small Size {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "large",
						"name": {
							"fr": "{{name}} Taille Maxi",
							"en": "Large Size {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "super",
						"name": {
							"fr": "{{name}} Taille Ultra",
							"en": "Super Size {{name}}"
						},
						"catchable": true
					}
				],
				"711": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Taille Normale",
							"en": "Average Size {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "small",
						"name": {
							"fr": "{{name}} Taille Mini",
							"en": "Small Size {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "large",
						"name": {
							"fr": "{{name}} Taille Maxi",
							"en": "Large Size {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "super",
						"name": {
							"fr": "{{name}} Taille Ultra",
							"en": "Super Size {{name}}"
						},
						"catchable": true
					}
				],
				"713": [
					{$BASE()},
					{$HISUI()}
				],
				"716": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Mode Paisible",
							"en": "Neutral Mode {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "active",
						"name": {
							"fr": "{{name}} Mode Déchaîné",
							"en": "Active Mode {{name}}"
						},
						"catchable": false
					}
				],
				"718": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme 50%",
							"en": "50% Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "10",
						"name": {
							"fr": "{{name}} Forme 10%",
							"en": "10% Forme {{name}}"
						},
						"catchable": true
					},
					{$IGNORED},
					{$IGNORED},
					{
						"dbid": "100",
						"name": {
							"fr": "{{name}} Forme 100%",
							"en": "Complete Forme {{name}}"
						},
						"catchable": false
					},
					{$MEGA()}
				],
				"719": [
					{$BASE()},
					{$MEGA()}
				],
				"720": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Enchaîné",
							"en": "{{name}} Confined"
						},
						"catchable": true
					},
					{
						"dbid": "unbound",
						"name": {
							"fr": "{{name}} Forme Déchaîné",
							"en": "{{name}} Unbound"
						},
						"catchable": false
					}
				],
				"724": [
					{$BASE()},
					{$HISUI()}
				],
				"740": [
					{$BASE()},
					{$MEGA()}
				],
				"741": [
					{
						"dbid": "flamenco",
						"name": {
							"fr": "{{name}} Style Flamenco",
							"en": "Baile Style {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "pompom",
						"name": {
							"fr": "{{name}} Style Pom-pom",
							"en": "Pom-Pom Style {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "pau",
						"name": {
							"fr": "{{name}} Style Hula",
							"en": "Pa'u Style {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "sensu",
						"name": {
							"fr": "{{name}} Style Buyō",
							"en": "Sensu Style {{name}}"
						},
						"catchable": true
					}
				],
				"745": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Diurne",
							"en": "Midday Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "midnight",
						"name": {
							"fr": "{{name}} Forme Nocturne",
							"en": "Midnight Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "dusk",
						"name": {
							"fr": "{{name}} Forme Crépusculaire",
							"en": "Dusk Form {{name}}"
						},
						"catchable": true
					}
				],
				"746": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Solitaire",
							"en": "Solo Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "school",
						"name": {
							"fr": "{{name}} Forme Banc",
							"en": "School Form {{name}}"
						},
						"catchable": false
					}
				],
				"768": [
					{$BASE()},
					{$MEGA()}
				],
				"773": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Type Normal",
							"en": "Normal-type {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "fighting",
						"name": {
							"fr": "{{name}} Type Combat",
							"en": "Fighting-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "flying",
						"name": {
							"fr": "{{name}} Type Vol",
							"en": "Flying-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "poison",
						"name": {
							"fr": "{{name}} Type Poison",
							"en": "Poison-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "ground",
						"name": {
							"fr": "{{name}} Type Sol",
							"en": "Ground-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "rock",
						"name": {
							"fr": "{{name}} Type Roche",
							"en": "Rock-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "bug",
						"name": {
							"fr": "{{name}} Type Insecte",
							"en": "Bug-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "ghost",
						"name": {
							"fr": "{{name}} Type Spectre",
							"en": "Ghost-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "steel",
						"name": {
							"fr": "{{name}} Type Acier",
							"en": "Steel-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "fire",
						"name": {
							"fr": "{{name}} Type Feu",
							"en": "Fire-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "water",
						"name": {
							"fr": "{{name}} Type Eau",
							"en": "Water-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "grass",
						"name": {
							"fr": "{{name}} Type Plante",
							"en": "Grass-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "electric",
						"name": {
							"fr": "{{name}} Type Électrik",
							"en": "Electric-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "psychic",
						"name": {
							"fr": "{{name}} Type Psy",
							"en": "Psychic-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "ice",
						"name": {
							"fr": "{{name}} Type Glace",
							"en": "Ice-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "dragon",
						"name": {
							"fr": "{{name}} Type Dragon",
							"en": "Dragon-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "dark",
						"name": {
							"fr": "{{name}} Type Ténèbres",
							"en": "Dark-type {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "fairy",
						"name": {
							"fr": "{{name}} Type Fée",
							"en": "Fairy-type {{name}}"
						},
						"catchable": false
					}
				],
				"774": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Météore",
							"en": "Meteor Form {{name}}"
						},
						"catchable": false
					},
					{$IGNORED},
					{$IGNORED},
					{$IGNORED},
					{$IGNORED},
					{$IGNORED},
					{$IGNORED},
					{
						"dbid": "red",
						"name": {
							"fr": "{{name}} Forme Noyau (Rouge)",
							"en": "Red Core {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "orange",
						"name": {
							"fr": "{{name}} Forme Noyau (Orange)",
							"en": "Orange Core {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "yellow",
						"name": {
							"fr": "{{name}} Forme Noyau (Jaune)",
							"en": "Yellow Core {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "green",
						"name": {
							"fr": "{{name}} Forme Noyau (Vert)",
							"en": "Green Core {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "blue",
						"name": {
							"fr": "{{name}} Forme Noyau (Bleu)",
							"en": "Blue Core {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "indigo",
						"name": {
							"fr": "{{name}} Forme Noyau (Indigo)",
							"en": "Indigo Core {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "violet",
						"name": {
							"fr": "{{name}} Forme Noyau (Violet)",
							"en": "Violet Core {{name}}"
						},
						"catchable": true
					}
				],
				"778": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Déguisée",
							"en": "Disguised Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "busted",
						"name": {
							"fr": "{{name}} Forme Démasquée",
							"en": "Busted Form {{name}}"
						},
						"catchable": false
					},
					{$IGNORED},
					{$IGNORED}
				],
				"780": [
					{$BASE()},
					{$MEGA()}
				],
				"800": [
					{$BASE()},
					{
						"dbid": "solgaleo",
						"name": {
							"fr": "{{name}} Crinières du Couchant",
							"en": "Dusk Mane {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "lunala",
						"name": {
							"fr": "{{name}} Ailes de l'Aurore",
							"en": "Dawn Wings {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "ultra",
						"name": {
							"fr": "Ultra-{{name}}",
							"en": "Ultra {{name}}"
						},
						"catchable": false
					}
				],
				"801": [
					{$BASE()},
					{
						"dbid": "original",
						"name": {
							"fr": "{{name}} Forme Couleur du Passé",
							"en": "Original Color {{name}}"
						},
						"catchable": true
					},
					{$MEGA()},
					{
						"dbid": "original-mega",
						"name": {
							"fr": "Méga-{{name}} Forme Couleur du Passé",
							"en": "Original Color Mega {{name}}"
						},
						"catchable": false
					}
				],
				"807": [
					{$BASE()},
					{$MEGA()}
				],
				"845": [
					{$BASE()},
					{
						"dbid": "gobe",
						"name": {
							"fr": "{{name}} Forme Gobe-Tout",
							"en": "Gulping Form {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "chu",
						"name": {
							"fr": "{{name}} Forme Gobe-Chu",
							"en": "Gorging Form {{name}}"
						},
						"catchable": false
					}
				],
				"849": [
					{
						"dbid": "aigue",
						"name": {
							"fr": "{{name}} Forme Aigüe",
							"en": "Amped Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "grave",
						"name": {
							"fr": "{{name}} Forme Grave",
							"en": "Low Key Form {{name}}"
						},
						"catchable": true
					}
				],
				"854": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Contrefaçon",
							"en": "Phony Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "antique",
						"name": {
							"fr": "{{name}} Forme Authentique",
							"en": "Antique Form {{name}}"
						},
						"catchable": true
					}
				],
				"855": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Contrefaçon",
							"en": "Phony Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "antique",
						"name": {
							"fr": "{{name}} Forme Authentique",
							"en": "Antique Form {{name}}"
						},
						"catchable": true
					}
				],
				"870": [
					{$BASE()},
					{$MEGA()}
				],
				"875": [
					{
						"dbid": "gel",
						"name": {
							"fr": "{{name}} Tête de Gel",
							"en": "Ice Face {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "degel",
						"name": {
							"fr": "{{name}} Tête Dégel",
							"en": "Noice Face {{name}}"
						},
						"catchable": false
					}
				],
				"876": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} mâle",
							"en": "Male {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "female",
						"name": {
							"fr": "{{name}} femelle",
							"en": "Female {{name}}"
						},
						"catchable": true
					}
				],
				"877": [
					{
						"dbid": "full",
						"name": {
							"fr": "{{name}} Mode Rassasié",
							"en": "Full Belly Mode {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "hangry",
						"name": {
							"fr": "{{name}} Mode Affamé",
							"en": "Hangry Mode {{name}}"
						},
						"catchable": false
					}
				],
				"888": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Héros Aguerri",
							"en": "Hero of Many Battles {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "sword",
						"name": {
							"fr": "{{name}} Forme Épée Suprême",
							"en": "Crowned Sword {{name}}"
						},
						"catchable": false
					}
				],
				"889": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Héros Aguerri",
							"en": "Hero of Many Battles {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "shield",
						"name": {
							"fr": "{{name}} Forme Bouclier Suprême",
							"en": "Crowned Shield {{name}}"
						},
						"catchable": false
					}
				],
				"890": [
					{$BASE()},
					{
						"dbid": "infini",
						"name": {
							"fr": "{{name}} Infinimax",
							"en": "Eternamax {{name}}"
						},
						"catchable": false
					}
				],
				"892": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Style Poing Final",
							"en": "Single Strike Style {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "water",
						"name": {
							"fr": "{{name}} Style Mille Poings",
							"en": "Rapid Strike Style {{name}}"
						},
						"catchable": true
					}
				],
				"893": [
					{$BASE()},
					{
						"dbid": "dada",
						"name": {
							"fr": "{{name}} Forme Dada",
							"en": "Dada {{name}}"
						},
						"catchable": true
					}
				],
				"898": [
					{$BASE()},
					{
						"dbid": "ice",
						"name": {
							"fr": "{{name}}, le Cavalier du Froid",
							"en": "Ice Rider {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "ghost",
						"name": {
							"fr": "{{name}}, le Cavalier d'Effroi",
							"en": "Shadow Rider {{name}}"
						},
						"catchable": false
					}
				],
				"901": [
					{$BASE()},
					{
						"dbid": "bloodmoon",
						"name": {
							"fr": "{{name}} Lune Vermeille",
							"en": "Bloodmoon {{name}}"
						},
						"catchable": true
					}
				],
				"902": [
					{$BASE()},
					{$BASE()}
				],
				"905": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Avatar",
							"en": "Incarnate Forme {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "therian",
						"name": {
							"fr": "{{name}} Totémique",
							"en": "Therian Forme {{name}}"
						},
						"catchable": true
					}
				],
				"916": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} mâle",
							"en": "Male {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "female",
						"name": {
							"fr": "{{name}} femelle",
							"en": "Female {{name}}"
						},
						"catchable": true
					}
				],
				"925": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Famille de Trois",
							"en": "{{name}} Family of Three"
						},
						"catchable": true
					},
					{
						"dbid": "four",
						"name": {
							"fr": "{{name}} Famille de Quatre",
							"en": "{{name}} Family of Four"
						},
						"catchable": true
					}
				],
				"931": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Plumage Vert",
							"en": "Green Plumage {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "blue",
						"name": {
							"fr": "{{name}} Plumage Bleu",
							"en": "Blue Plumage {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "yellow",
						"name": {
							"fr": "{{name}} Plumage Jaune",
							"en": "Yellow Plumage {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "white",
						"name": {
							"fr": "{{name}} Plumage Blanc",
							"en": "White Plumage {{name}}"
						},
						"catchable": true
					}
				],
				"952": [
					{$BASE()},
					{$MEGA()}
				],
				"964": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Ordinaire",
							"en": "Zero Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "hero",
						"name": {
							"fr": "{{name}} Forme Super",
							"en": "Hero Form {{name}}"
						},
						"catchable": false
					}
				],
				"970": [
					{$BASE()},
					{$MEGA()}
				],
				"978": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Courbée",
							"en": "Curly Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "droopy",
						"name": {
							"fr": "{{name}} Forme Affalée",
							"en": "Droopy Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "stretch",
						"name": {
							"fr": "{{name}} Forme Raide",
							"en": "Stretchy Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "mega",
						"name": {
							"fr": "Méga-{{name}} Forme Courbée",
							"en": "Curly Form Mega {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "droopy-mega",
						"name": {
							"fr": "Méga-{{name}} Forme Affalée",
							"en": "Droopy Form Mega {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "stretch-mega",
						"name": {
							"fr": "Méga-{{name}} Forme Raide",
							"en": "Stretchy Form Mega {{name}}"
						},
						"catchable": false
					}
				],
				"982": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Double",
							"en": "Two-Segment Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "three",
						"name": {
							"fr": "{{name}} Forme Triple",
							"en": "Three-Segment Form {{name}}"
						},
						"catchable": true
					}
				],
				"998": [
					{$BASE()},
					{$MEGA()}
				],
				"999": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Coffre",
							"en": "Chest Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "roaming",
						"name": {
							"fr": "{{name}} Forme Marche",
							"en": "Roaming Form {{name}}"
						},
						"catchable": true
					}
				],
				"1012": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Imitation",
							"en": "Counterfeit Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "artisan",
						"name": {
							"fr": "{{name}} Forme Onéreuse",
							"en": "Artisan Form {{name}}"
						},
						"catchable": true
					}
				],
				"1013": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} Forme Médiocre",
							"en": "Unremarkable Form {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "masterpiece",
						"name": {
							"fr": "{{name}} Forme Exceptionnelle",
							"en": "Masterpiece Form {{name}}"
						},
						"catchable": true
					}
				],
				"1017": [
					{
						"dbid": "",
						"name": {
							"fr": "{{name}} au Masque Turquoise",
							"en": "Teal Mask {{name}}"
						},
						"catchable": true
					},
					{
						"dbid": "wellspring",
						"name": {
							"fr": "{{name}} au Masque du Puits",
							"en": "Wellspring Mask {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "hearthflame",
						"name": {
							"fr": "{{name}} au Masque du Fourneau",
							"en": "Hearthflame Mask {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "cornerstone",
						"name": {
							"fr": "{{name}} au Masque de la Pierre",
							"en": "Cornerstone Mask {{name}}"
						},
						"catchable": false
					}
				],
				"1024": [
					{$BASE()},
					{
						"dbid": "terastal",
						"name": {
							"fr": "{{name}} Forme Téracristal",
							"en": "Terastal Form {{name}}"
						},
						"catchable": false
					},
					{
						"dbid": "stellar",
						"name": {
							"fr": "{{name}} Forme Stellaire",
							"en": "Stellar Form {{name}}"
						},
						"catchable": false
					}
				]
			}
		JSON, true);
	}

	public $dbid = '';
	public $name = '';
	public $form = 0;
	public $gender = '';
	public $gigamax = false;
	public $candy = 0;
	public $noShiny = false;
	public $hasBackside = false;
	public $catchable = true; // can they be caught / evolved in that form in any game?
	public array $evolvesFrom = [];

	function __construct(Sprite $sprite, int $dexid, array $evolutions) {
		if (empty(self::$FORMS_DATA)) {
			self::$FORMS_DATA = self::getFormsData();
		}

		// Formes à ne pas compter
		if (
			//($dexid == 25 && $sprite->form == 8) // Pikachu starter
			   ($dexid == 20 && $sprite->form == 2) // Rattatac totem
			|| ($dexid == 59 && $sprite->form == 2) // Arcanin de Hisui monarque
			|| ($dexid == 101 && $sprite->form == 2) // Électrode de Hisui monarque
			|| ($dexid == 105 && $sprite->form == 2) // Ossatueur totem
			|| ($dexid == 128 && $sprite->form >= 1 && $sprite->form <= 3 && $sprite->gender == 'md') // Tauros de Paldea, formes mâle redondantes (il y a md et mo)
			|| ($dexid == 133 && $sprite->form == 1) // Évoli starter
			|| ($dexid == 414 && $sprite->form > 0) // Papilord (formes capes de Cheniti)
			//|| ($dexid == 493 && $sprite->form == 18) // Arceus avec Plaque Légende
			|| ($dexid == 549 && $sprite->form == 2) // Fragilady de Hisui monarque
			//|| ($dexid == 658 && $sprite->form == 1) // Amphinobi de Sacha forme normale
			|| ($dexid == 664 && $sprite->form > 0) // Lépidonille (formes de Prismillon)
			|| ($dexid == 665 && $sprite->form > 0) // Pérégrain (formes de Prismillon)
			//|| ($dexid == 670 && $sprite->form == 5) // Floette de AZ
			|| ($dexid == 678 && $sprite->form == 3) // Méga Mistigrix femelle (identique au mâle)
			|| ($dexid == 713 && $sprite->form == 2) // Séracrawl de Hisui monarque
			//|| ($dexid == 718 && $sprite->form == 2) // Zygarde (doublon)
			//|| ($dexid == 718 && $sprite->form == 3) // Zygarde (doublon)
			|| ($dexid == 735 && $sprite->form == 1) // Argouste totem
			|| ($dexid == 738 && $sprite->form == 1) // Lucanon totem
			|| ($dexid == 743 && $sprite->form == 1) // Rubombelle totem
			|| ($dexid == 744 && $sprite->form == 1) // Rocabot (évolue en crépusculaire)
			|| ($dexid == 752 && $sprite->form == 1) // Tarenbulle totem
			|| ($dexid == 754 && $sprite->form == 1) // Floramantis totem
			|| ($dexid == 758 && $sprite->form == 1) // Malamandre totem
			//|| ($dexid == 774 && $sprite->form >= 1 && $sprite->form <= 6) // Météno formes météories (toutes identiques)
			|| ($dexid == 777 && $sprite->form == 1) // Togedemaru totem
			|| ($dexid == 778 && $sprite->form >= 2) // Mimiqui totem
			|| ($dexid == 784 && $sprite->form == 1) // Ékaïser totem
			|| ($dexid == 849 && $sprite->form == 1 && $sprite->gigamax == 1) // Salarsen Gigamax Grave (identique au Aigu)
			|| ($dexid == 869 && $sprite->gigamax == 1 && ($sprite->form > 0 || $sprite->candy > 0)) // Charmilly Gigamax (autres friandises)
			|| ($dexid == 900 && $sprite->form == 1) // Hachécateur monarque
			|| ($dexid == 902 && ($sprite->gender == 'mo' || $sprite->gender == 'fo')) // Paragruel, formes genrées redondantes (il y a md et mo)
			|| ($dexid == 905 && $sprite->gender == 'fd') // Amovénus, formes femelles redondantes (il y a fd et fo)
			|| ($dexid == 916 && ($sprite->gender == 'md' || $sprite->gender == 'fd')) // Fragroin, formes genrées redondantes (il y a md et mo)
			|| ($dexid == 957 && $sprite->gender == 'fd') // Forgerette, formes femelles redondantes (il y a fd et fo)
			|| ($dexid == 958 && $sprite->gender == 'fd') // Forgella, formes femelles redondantes (il y a fd et fo)
			|| ($dexid == 959 && $sprite->gender == 'fd') // Forgelina, formes femelles redondantes (il y a fd et fo)
		) {
			throw new Exception('Forme ignorée');
		}
		
		$this->form = $sprite->form;
		$this->gender = $sprite->gender;
		$this->gigamax = $sprite->gigamax;
		$this->candy = $sprite->candy;

		$spriteid = ($sprite->gigamax) ? 'gigamax' : (($sprite->form !== 0) ? $sprite->form : $sprite->gender);
		
		// Cas par cas selon le Pokémon
		
		if ($spriteid == 'gigamax') {
			$this->catchable = false;
			switch($dexid) {
				case 892: // Shifours
					switch($this->form) {
						case 0:
							$this->dbid = 'gigamax';
							$this->name = [
								'fr' => '{{name}} Gigamax (Style Poing Final)',
								'en' => 'Gigantamax {{name}} (Single Strike Style)'
							];
						break;
						case 1:
							$this->dbid = 'water-gigamax';
							$this->name = [
								'fr' => '{{name}} Gigamax (Style Mille Poings)',
								'en' => 'Gigantamax {{name}} (Rapid Strike Style)'
							];
						break;
					}
				break;
				default:
					$this->dbid = 'gigamax';
					$this->name = [
						'fr' => '{{name}} Gigamax',
						'en' => 'Gigantamax {{name}}'
					];
			}
		}

		else {
			// Charmilly
			if ($dexid == 869) {
				$ids = ['vanille', 'ruby', 'matcha', 'menthe', 'citron', 'sale', 'melruby', 'caramel', 'tricolore'];
				$noms = ['{{name}} Lait Vanille', '{{name}} Lait Ruby', '{{name}} Lait Matcha', '{{name}} Lait Menthe', '{{name}} Lait Citron', '{{name}} Lait Salé', '{{name}} Mélange Ruby', '{{name}} Mélange Caramel', '{{name}} Mélange Tricolore'];
				$nomsEN = ['Vanilla Cream {{name}}', 'Ruby Cream {{name}}', 'Matcha Cream {{name}}', 'Mint Cream {{name}}', 'Lemon Cream {{name}}', 'Salted Cream {{name}}', 'Ruby Swirl {{name}}', 'Caramel Swirl {{name}}', 'Rainbow Swirl {{name}}'];

				$friandises = ['fraise', 'baie', 'coeur', 'etoile', 'trefle', 'fleur', 'ruban'];
				$friandisesNoms = ['Fraise en Sucre', 'Baie en Sucre', 'Cœur en Sucre', 'Étoile en Sucre', 'Trèfle en Sucre', 'Fleur en Sucre', 'Ruban en Sucre'];
				$friandisesNomsEN = ['Strawberry Sweet', 'Berry Sweet', 'Love Sweet', 'Star Sweet', 'Clover Sweet', 'Flower Sweet', 'Ribbon Sweet'];

				$this->dbid = $ids[$sprite->form] . '-' . $friandises[$sprite->candy];
				$this->name = [
					'fr' => $noms[$sprite->form] . ' - ' . $friandisesNoms[$sprite->candy],
					'en' => $nomsEN[$sprite->form] . ' - ' . $friandisesNomsEN[$sprite->candy]
				];
			}

			else if (isset(self::$FORMS_DATA[$dexid])) {
				$forme = self::$FORMS_DATA[$dexid][$sprite->form] ?? null;
				if ($forme) {
					if ($forme === 'IGNORED') {
						throw new Exception('Forme ignorée');
					}

					$this->dbid = $forme['dbid'];
					$this->name = [
						'fr' => $forme['name']['fr'],
						'en' => $forme['name']['en']
					];
					$this->catchable = $forme['catchable'] ?? true;
				}
				else {
					$this->dbid = 'unknown';
					$this->name = [
						'fr' => 'Forme inconnue',
						'en' => 'Unknown form'
					];
					$this->catchable = false;
				}
			}
			
			else {
				$this->dbid = '';
				$this->name = ['fr' => '', 'en' => ''];
				if (in_array($spriteid, ['mf', 'uk', 'mo', 'fo', 'md', 'fd'])) {
					$this->dbid = '';
					$this->name = ['fr' => '', 'en' => ''];
				}
				/*else if ($spriteid == 'md')
				{
					$this->dbid = '';
					$this->nom = 'Mâle';
				}
				else if ($spriteid == 'fd')
				{
					$this->dbid = 'female';
					$this->nom = 'Femelle';
				}*/
				else {
					$this->dbid = 'unknown';
					$this->name = [
						'fr' => 'Forme inconnue',
						'en' => 'Unknown form'
					];
					$this->catchable = false;
				}
			}

			// Mâles et femelles
			$ignoreGender = [];
			if (!in_array($dexid, $ignoreGender)) {
				if ($sprite->gender == 'md') {
					$this->name = [
						'fr' => ($this->name['fr'] ? $this->name['fr'] . ' mâle' : '{{name}} mâle'),
						'en' => ($this->name['en'] ? 'Male ' . $this->name['en'] : 'Male {{name}}')
					];
				} else if ($sprite->gender == 'fd') {
					$this->dbid = $this->dbid . ($this->dbid == '' ? '' : '-') . 'female';
					$this->name = [
						'fr' => ($this->name['fr'] ? $this->name['fr'] . ' femelle' : '{{name}} femelle'),
						'en' => ($this->name['en'] ? 'Female ' . $this->name['en'] : 'Female {{name}}')
					];
				}
			}

			if ($this->catchable) {
				$evolvesFrom = [];
				foreach ($evolutions as $evolution) {
					$evolvedParts = explode('-', key($evolution));
					$evolvedDexid = (int) array_shift($evolvedParts);
					$evolvedFormeDbid = implode('-', $evolvedParts);
					$baseParts = explode('-', current($evolution));
					$baseDexid = (int) array_shift($baseParts);
					$baseFormeDbid = implode('-', $baseParts);

					if ($evolvedDexid == $dexid && $evolvedFormeDbid == $this->dbid) {
						$evolvesFrom[] = [
							'dexid' => (int) $baseDexid,
							'forme' => $baseFormeDbid
						];
					}
				}
				if (count($evolvesFrom) > 0) {
					$this->evolvesFrom = $evolvesFrom;
				}
			}
		}
	}



	/* static private function has(string $formType, int $dexid): bool {
		// Classification de certains Pokémon
		$mega = [3, 9, 15, 18, 65, 80, 94, 115, 127, 130, 142, 181, 208, 212, 214, 229, 248, 254, 257, 260, 282, 302, 303, 306, 308, 310, 319, 323, 334, 354, 359, 362, 373, 376, 380, 381, 384, 428, 445, 448, 460, 475, 531, 719];
		$megaX = [6, 150];
		$primal = [382, 383];
		$alolan = [19, 20, 26, 27, 28, 37, 38, 50, 51, 52, 53, 74, 75, 76, 88, 89, 103, 105];
		$galarian = [52, 77, 78, 79, 80, 83, 110, 122, 144, 145, 146, 199, 222, 263, 264, 554, 555, 562, 618];
		$hisuian = [58, 59, 100, 101, 157, 211, 215, 503, 549, 570, 571, 628, 705, 706, 713, 724];
		$paldean = [128, 194];

		return in_array($dexid, $$formType);
	} */

	/* static private function isAlolan(Sprite $sprite, int $dexid): bool {
		$tempForm = 1;
		if (self::has('mega', $dexid)) $tempForm++;
		return $sprite->form == $tempForm;
	}

	static private function isGalarian(Sprite $sprite, int $dexid): bool {
		$tempForm = 1;
		if (self::has('alolan', $dexid)) $tempForm++;
		if (self::has('mega', $dexid)) $tempForm++;
		return $sprite->form == $tempForm;
	}

	static private function isHisuian(Sprite $sprite, int $dexid): bool {
		$tempForm = 1;
		if (self::has('alolan', $dexid)) $tempForm++;
		if (self::has('galarian', $dexid)) $tempForm++;
		if (self::has('mega', $dexid)) $tempForm++;
		return $sprite->form == $tempForm;
	}

	static private function isPaldean(Sprite $sprite, int $dexid): bool {
		$tempForm = 1;
		if (self::has('alolan', $dexid)) $tempForm++;
		if (self::has('galarian', $dexid)) $tempForm++;
		if (self::has('hisuian', $dexid)) $tempForm++;
		if (self::has('mega', $dexid)) $tempForm++;
		return $sprite->form == $tempForm;
	} */
}