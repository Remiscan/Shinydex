<?php
require_once __DIR__.'/class_Sprite.php';



class Forme extends Sprite {
  public $dbid = '';
  public $name = '';
  public $form = 0;
  public $gender = '';
  public $gigamax = false;
  public $candy = 0;
  public $noShiny = false;
  public $hasBackside = false;
  public $catchable = true;

  function __construct(Sprite $sprite, int $dexid) {
    // Formes à ne pas compter
    if (
      ($dexid == 25 && $sprite->form == 8) // Pikachu starter
      || ($dexid == 20 && $sprite->form == 2) // Rattatac totem
      || ($dexid == 59 && $sprite->form == 2) // Arcanin de Hisui monarque
      || ($dexid == 101 && $sprite->form == 2) // Électrode de Hisui monarque
      || ($dexid == 105 && $sprite->form == 2) // Ossatueur totem
      || ($dexid == 133 && $sprite->form == 1) // Évoli starter
      || ($dexid == 414 && $sprite->form > 0) // Papilord (formes capes de Cheniti)
      || ($dexid == 493 && $sprite->form == 18) // Arceus avec Plaque Légende
      || ($dexid == 549 && $sprite->form == 2) // Fragilady de Hisui monarque
      || ($dexid == 658 && $sprite->form == 1) // Amphinobi de Sacha forme normale
      || ($dexid == 664 && $sprite->form > 0) // Lépidonille (formes de Prismillon)
      || ($dexid == 665 && $sprite->form > 0) // Pérégrain (formes de Prismillon)
      || ($dexid == 670 && $sprite->form == 5) // Floette de AZ
      || ($dexid == 713 && $sprite->form == 2) // Séracrawl de Hisui monarque
      || ($dexid == 718 && $sprite->form == 2) // Zygarde (doublon)
      || ($dexid == 718 && $sprite->form == 3) // Zygarde (doublon)
      || ($dexid == 735 && $sprite->form == 1) // Argouste totem
      || ($dexid == 738 && $sprite->form == 1) // Lucanon totem
      || ($dexid == 743 && $sprite->form == 1) // Rubombelle totem
      || ($dexid == 744 && $sprite->form == 1) // Rocabot (évolue en crépusculaire)
      || ($dexid == 752 && $sprite->form == 1) // Tarenbulle totem
      || ($dexid == 754 && $sprite->form == 1) // Floramantis totem
      || ($dexid == 758 && $sprite->form == 1) // Malamandre totem
      || ($dexid == 774 && $sprite->form >= 1 && $sprite->form <= 6) // Météno formes météories (toutes identiques)
      || ($dexid == 777 && $sprite->form == 1) // Togedemaru totem
      || ($dexid == 778 && $sprite->form >= 2) // Mimiqui totem
      || ($dexid == 784 && $sprite->form == 1) // Ékaïser totem
      || ($dexid == 849 && $sprite->form == 1 && $sprite->gigamax == 1) // Salarsen Gigamax Grave (identique au Aigu)
      || ($dexid == 869 && $sprite->gigamax == 1 && ($sprite->form > 0 || $sprite->candy > 0)) // Charmilly Gigamax (autres friandises)
      || ($dexid == 900 && $sprite->form == 1) // Hachécateur monarque
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
      $done = true;
      switch ($dexid) {
        case 0: // Œuf
          $ids = ['', 'manaphy'];
          $noms = ['Œuf', 'Œuf de Manaphy'];
          $nomsEN = ['Egg', 'Manaphy Egg'];
          $catchable = [false, false];
        break;
        case 25: // Pikachu
          $ids = ['', 'original-cap', 'hoenn-cap', 'sinnoh-cap', 'unys-cap', 'kalos-cap', 'alola-cap', 'partner-cap', '', 'world-cap'];
          $noms = ['', '{{name}} Casquette Originale', '{{name}} Casquette de Hoenn', '{{name}} Casquette de Sinnoh', '{{name}} Casquette d\'Unys', '{{name}} Casquette de Kalos', '{{name}} Casquette d\'Alola', '{{name}} Casquette de Partenaire', '', '{{name}} Casquette Monde'];
          $nomsEN = ['', 'Original Cap {{name}}', 'Hoenn Cap {{name}}', 'Sinnoh Cap {{name}}', 'Unova Cap {{name}}', 'Kalos Cap {{name}}', 'Alola Cap {{name}}', 'Partner Cap {{name}}', '', 'World Cap {{name}}'];
          $catchable = [true, false, false, false, false, false, false, false, false, false];
        break;
        case 128: // Tauros
          $ids = ['', 'paldea', 'paldea-blaze', 'paldea-aqua'];
          $noms = ['', '{{name}} de Paldea Race Combative', '{{name}} de Paldea Race Flamboyante', '{{name}} de Paldea Race Aquatique'];
          $nomsEN = ['', 'Paldean {{name}} Combat Breed', 'Paldean {{name}} Blaze Breed', 'Paldean {{name}} Aqua Breed'];
        break;
        case 201: // Zarbi
          $ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '!', '?'];
          $noms = array_map('strtoupper', $ids);
          $nomsEN = $noms;
        break;
        case 351: // Morphéo
          $ids = ['', 'sunny', 'rainy', 'snowy'];
          $noms = ['', '{{name}} Forme Solaire', '{{name}} Forme Eau de Pluie', '{{name}} Forme Blizzard'];
          $nomsEN = ['', 'Sunny Form {{name}}', 'Rainy Form {{name}}', 'Snowy Form {{name}}'];
          $catchable = [true, false, false, false];
        break;
        case 386: //Deoxys
          $ids = ['', 'attack', 'defense', 'speed'];
          $noms = ['{{name}} Forme Normale', '{{name}} Forme Attaque', '{{name}} Forme Défense', '{{name}} Forme Vitesse'];
          $nomsEN = ['Normal Forme {{name}}', 'Attack Forme {{name}}', 'Defense Forme {{name}}', 'Speed Forme {{name}}'];
          $catchable = [true, false, false, false];
        break;
        case 412: // Cheniti
        case 413: // Cheniselle
          $ids = ['plant', 'sandy', 'trash'];
          $noms = ['{{name}} Cape Plante', '{{name}} Cape Sable', '{{name}} Cape Déchet'];
          $nomsEN = ['Plant Cloak {{name}}', 'Sandy Cloak {{name}}', 'Trash Cloak {{name}}'];
        break;
        case 421: // Ceriflor
          $ids = ['', 'sunny'];
          $noms = ['{{name}} Temps Couvert', '{{name}} Temps Ensoleillé'];
          $nomsEN = ['Overcast Form {{name}}', 'Sunshine Form {{name}}'];
          $catchable = [true, false];
        break;
        case 422: // Sancoki
        case 423: // Tritosor
          $ids = ['west', 'east'];
          $noms = ['{{name}} Mer Occident', '{{name}} Mer Orient'];
          $nomsEN = ['West Sea {{name}}', 'East Sea {{name}}'];
        break;
        case 479: // Motisma
          $ids = ['', 'heat', 'wash', 'frost', 'fan', 'mow'];
          $noms = ['', '{{name}} Chaleur', '{{name}} Lavage', '{{name}} Froid', '{{name}} Hélice', '{{name}} Tonte'];
          $nomsEN = ['', 'Heat {{name}}', 'Wash {{name}}', 'Frost {{name}}', 'Fan {{name}}', 'Mow {{name}}'];
          $catchable = [true, false, false, false, false, false];
        break;
        case 483: // Dialga
        case 484: // Palkia
        case 487: // Giratina
          $ids = ['', 'origin'];
          $noms = ['{{name}} Forme Alternative', '{{name}} Forme Originelle'];
          $nomsEN = ['Altered Forme {{name}}', 'Origin Forme {{name}}'];
          $catchable = [true, false];
        break;
        case 492: // Shaymin
          $ids = ['', 'sky'];
          $noms = ['{{name}} Forme Terrestre', '{{name}} Forme Céleste'];
          $nomsEN = ['Land Forme {{name}}', 'Sky Forme {{name}}'];
          $catchable = [true, false];
        break;
        case 493: // Arceus
        case 773: // Silvallié
          $ids = ['', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'];
          $noms = ['{{name}} Type Normal', '{{name}} Type Combat', '{{name}} Type Vol', '{{name}} Type Poison', '{{name}} Type Sol', '{{name}} Type Roche', '{{name}} Type Insecte', '{{name}} Type Spectre', '{{name}} Type Acier', '{{name}} Type Feu', '{{name}} Type Eau', '{{name}} Type Plante', '{{name}} Type Électrik', '{{name}} Type Psy', '{{name}} Type Glace', '{{name}} Type Dragon', '{{name}} Type Ténèbres', '{{name}} Type Fée'];
          $nomsEN = ['Normal-type {{name}}', 'Fighting-type {{name}}', 'Flying-type {{name}}', 'Poison-type {{name}}', 'Ground-type {{name}}', 'Rock-type {{name}}', 'Bug-type {{name}}', 'Ghost-type {{name}}', 'Steel-type {{name}}', 'Fire-type {{name}}', 'Water-type {{name}}', 'Grass-type {{name}}', 'Electric-type {{name}}', 'Psychic-type {{name}}', 'Ice-type {{name}}', 'Dragon-type {{name}}', 'Dark-type {{name}}', 'Fairy-type {{name}}'];
          $catchable = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
        break;
        case 550: // Bargantua
          $ids = ['red', 'blue', 'white'];
          $noms = ['{{name}} Motif Rouge', '{{name}} Motif Bleu', '{{name}} Motif Blanc'];
          $nomsEN = ['Red-Striped {{name}}', 'Blue-Striped {{name}}', 'White-Striped {{name}}'];
        break;
        case 555: // Darumacho
          $ids = ['', 'zen', 'galar', 'galar-zen'];
          $noms = ['{{name}} Mode Standard', '{{name}} Mode Transe', '{{name}} de Galar', '{{name}} de Galar - Mode Transe'];
          $nomsEN = ['Standard Mode {{name}}', 'Zen Mode {{name}}', 'Standard Mode Galarian {{name}}', 'Zen Mode Galarian {{name}}'];
          $catchable = [true, false, true, false];
        break;
        case 585: // Vivaldaim
        case 586: // Haydaim
          $ids = ['spring', 'summer', 'autumn', 'winter'];
          $noms = ['{{name}} Forme Printemps', '{{name}} Forme Été', '{{name}} Forme Automne', '{{name}} Forme Hiver'];
          $nomsEN = ['Spring Form {{name}}', 'Summer Form {{name}}', 'Autumn Form {{name}}', 'Winter Form {{name}}'];
        break;
        case 641: // Boréas
        case 642: // Fulguris
        case 645: // Démétéros
        case 905: // Amovénus
          $ids = ['', 'therian'];
          $noms = ['{{name}} Avatar', '{{name}} Totémique'];
          $nomsEN = ['Incarnate Forme {{name}}', 'Therian Forme {{name}}'];
          $catchable = [true, false];
        break;
        case 646: // Kyurem
          $ids = ['', 'white', 'black'];
          $noms = ['', '{{name}} Blanc', '{{name}} Noir'];
          $nomsEN = ['', 'White {{name}}', 'Black {{name}}'];
          $catchable = [true, false, false];
        break;
        case 647: // Keldeo
          $ids = ['', 'resolute'];
          $noms = ['{{name}} Aspect Normal', '{{name}} Aspect Décidé'];
          $nomsEN = ['Ordinary Form {{name}}', 'Resolute Form {{name}}'];
          $catchable = [true, false];
        break;
        case 648: // Meloetta
          $ids = ['', 'pirouette'];
          $noms = ['{{name}} Forme Chant', '{{name}} Forme Danse'];
          $nomsEN = ['Aria Forme {{name}}', 'Pirouette Forme {{name}}'];
          $catchable = [true, false];
        break;
        case 649: // Genesect
          $ids = ['', 'douse', 'shock', 'burn', 'chill'];
          $noms = ['', '{{name}} Module Aqua', '{{name}} Module Choc', '{{name}} Module Pyro', '{{name}} Module Cryo'];
          $nomsEN = ['', 'Douse Drive {{name}}', 'Shock Drive {{name}}', 'Burn Drive {{name}}', 'Chill Drive {{name}}'];
          $catchable = [true, false, false, false, false];
        break;
        case 658: // Amphinobi
          $ids = ['', '', 'ash'];
          $noms = ['', '', '{{name}} Forme Sacha'];
          $nomsEN = ['', '', 'Ash-{{name}}'];
          $catchable = [true, false, false];
        break;
        case 666: // Prismillon
          $ids = ['icysnow', 'polar', 'tundra', 'continental', 'garden', 'elegant', 'meadow', 'modern', 'marine', 'archipelago', 'highplains', 'sandstorm', 'river', 'monsoon', 'savanna', 'sun', 'ocean', 'jungle', 'fancy', 'pokeball'];
          $noms = ['{{name}} Motif Blizzard', '{{name}} Motif Banquise', '{{name}} Motif Glace', '{{name}} Motif Continent', '{{name}} Motif Verdure', '{{name}} Motif Monarchie', '{{name}} Motif Floraison', '{{name}} Motif Métropole', '{{name}} Motif Rivage', '{{name}} Motif Archipel', '{{name}} Motif Sécheresse', '{{name}} Motif Sable', '{{name}} Motif Delta', '{{name}} Motif Cyclone', '{{name}} Motif Mangrove', '{{name}} Motif Zénith', '{{name}} Motif Soleil Levant', '{{name}} Motif Jungle', '{{name}} Motif Fantaisie', '{{name}} Motif Poké Ball'];
          $nomsEN = ['Icy Snow Pattern {{name}}', 'Polar Pattern {{name}}', 'Tundra Pattern {{name}}', 'Continental Pattern {{name}}', 'Garden Pattern {{name}}', 'Elegant Pattern {{name}}', 'Meadow Pattern {{name}}', 'Modern Pattern {{name}}', 'Marine Pattern {{name}}', 'Achipelago Pattern {{name}}', 'High Plains Pattern {{name}}', 'Sandstorm Pattern {{name}}', 'River Pattern {{name}}', 'Monsoon Pattern {{name}}', 'Savanna Pattern {{name}}', 'Sun Pattern {{name}}', 'Ocean Pattern {{name}}', 'Jungle Pattern {{name}}', 'Fancy Pattern {{name}}', 'Poké Ball Pattern {{name}}'];
        break;
        case 669: // Flabébé
        case 670: // Floette
        case 671: // Florges
          $ids = ['red', 'yellow', 'orange', 'blue', 'white'];
          $noms = ['{{name}} Fleur Rouge', '{{name}} Fleur Jaune', '{{name}} Fleur Orange', '{{name}} Fleur Bleue', '{{name}} Fleur Blanche'];
          $nomsEN = ['Red Flower {{name}}', 'Yellow Flower {{name}}', 'Orange Flower {{name}}', 'Blue Flower {{name}}', 'White Flower {{name}}'];
        break;
        case 676: // Couafarel
          $ids = ['', 'heart', 'star', 'diamond', 'debutante', 'matron', 'dandy', 'la-reine', 'kabuki', 'pharaoh'];
          $noms = ['{{name}} Forme Sauvage', '{{name}} Coupe Cœur', '{{name}} Coupe Étoile', '{{name}} Coupe Diamant', '{{name}} Coupe Demoiselle', '{{name}} Coupe Madame', '{{name}} Coupe Monsieur', '{{name}} Coupe Reine', '{{name}} Coupe Kabuki', '{{name}} Coupe Pharaon'];
          $nomsEN = ['Natural Form {{name}}', 'Heart Trim {{name}}', 'Star Trim {{name}}', 'Diamond Trim {{name}}', 'Debutante Trim {{name}}', 'Matron Trim {{name}}', 'Dandy Trim {{name}}', 'La Reine Trim {{name}}', 'Kabuki Trim {{name}}', 'Pharaoh Trim {{name}}'];
        break;
        case 678: // Mistigrix
        case 876: // Wimessir
        case 916: // Fragroin
          $ids = ['', 'female'];
          $noms = ['{{name}} mâle', '{{name}} femelle'];
          $nomsEN = ['Male {{name}}', 'Female {{name}}'];
        break;
        case 681: // Exagide
          $ids = ['', 'blade'];
          $noms = ['{{name}} Forme Parade', '{{name}} Forme Assaut'];
          $nomsEN = ['Shield Forme {{name}}', 'Blade Forme {{name}}'];
          $catchable = [true, false];
        break;
        case 710: // Pitrouille
        case 711: // Banshitrouye
          $ids = ['', 'small', 'large', 'super'];
          $noms = ['{{name}} Taille Normale', '{{name}} Taille Mini', '{{name}} Taille Maxi', '{{name}} Taille Ultra'];
          $nomsEN = ['Average Size {{name}}', 'Small Size {{name}}', 'Large Size {{name}}', 'Super Size {{name}}'];
        break;
        case 716: // Xerneas
          $ids = ['', 'active'];
          $noms = ['{{name}} Mode Paisible', '{{name}} Mode Déchaîné'];
          $nomsEN = ['Neutral Mode {{name}}', 'Active Mode {{name}}'];
          $catchable = [true, false];
        break;
        case 718: // Zygarde
          $ids = ['', '10', '', '', '100'];
          $noms = ['{{name}} Forme 50%', '{{name}} Forme 10%', '', '', '{{name}} Forme 100%'];
          $nomsEN = ['50% Forme {{name}}', '10% Forme {{name}}', '', '', '100% Forme {{name}}'];
          $catchable = [true, false];
        break;
        case 720: // Hoopa
          $ids = ['', 'unbound'];
          $noms = ['{{name}} Forme Enchaîné', '{{name}} Forme Déchaîné'];
          $nomsEN = ['{{name}} Confined', '{{name}} Unbound'];
          $catchable = [true, false];
        break;
        case 741: // Plumeline
          $ids = ['flamenco', 'pau', 'pompom', 'sensu'];
          $noms = ['{{name}} Style Flamenco', '{{name}} Style Hula', '{{name}} Style Pom-pom', '{{name}} Style Buyō'];
          $nomsEN = ['Baile Style {{name}}', "Pa'u Style {{name}}", 'Pom-Pom Style {{name}}', 'Sensu Style {{name}}'];
        break;
        case 745: // Lougaroc
          $ids = ['', 'midnight', 'dusk'];
          $noms = ['{{name}} Forme Diurne', '{{name}} Forme Nocturne', '{{name}} Forme Crépusculaire'];
          $nomsEN = ['Midday Form {{name}}', 'Midnight Form{{name}}', 'Dusk Form {{name}}'];
        break;
        case 746: // Froussardine
          $ids = ['', 'school'];
          $noms = ['{{name}} Forme Solitaire', '{{name}} Forme Banc'];
          $nomsEN = ['Solo Form {{name}}', 'School Form {{name}}'];
          $catchable = [true, false];
        break;
        case 774: // Météno
          $ids = ['', '', '', '', '', '', '', 'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
          $noms = ['{{name}} Forme Météore', '', '', '', '', '', '', '{{name}} Forme Noyau (Rouge)', '{{name}} Forme Noyau (Orange)', '{{name}} Forme Noyau (Jaune)', '{{name}} Forme Noyau (Vert)', '{{name}} Forme Noyau (Bleu)', '{{name}} Forme Noyau (Indigo)', '{{name}} Forme Noyau (Violet)'];
          $nomsEN = ['Meteor Form {{name}}', '', '', '', '', '', '', 'Red Core {{name}}', 'Orange Core {{name}}', 'Yellow Core {{name}}', 'Green Core {{name}}', 'Blue Core {{name}}', 'Indigo Core {{name}}', 'Violet Core {{name}}'];
        break;
        case 778: // Mimiqui
          $ids = ['', 'busted'];
          $noms = ['{{name}} Forme Déguisée', '{{name}} Forme Démasquée'];
          $nomsEN = ['Disguised Form {{name}}', 'Busted Form {{name}}'];
          $catchable = [true, false];
        break;
        case 800: // Necrozma
          $ids = ['', 'solgaleo', 'lunala', 'ultra'];
          $noms = ['', '{{name}} Crinières du Couchant', '{{name}} Ailes de l\'Aurore', 'Ultra-{{name}}'];
          $nomsEN = ['', 'Dusk Mane {{name}}', 'Dawn Wings {{name}}', 'Ultra {{name}}'];
          $catchable = [true, false, false, false];
        break;
        case 801: // Magearna
          $ids = ['', 'original'];
          $noms = ['', '{{name}} Forme Couleur du Passé'];
          $nomsEN = ['', 'Original Color {{name}}'];
        break;
        case 845: // Nigosier
          $ids = ['', 'gobe', 'chu'];
          $noms = ['', '{{name}} Forme Gobe-Tout', '{{name}} Forme Gobe-Chu'];
          $nomsEN = ['', 'Gulping Form {{name}}', 'Gorging Form {{name}}'];
          $catchable = [true, false, false];
        break;
        case 849: // Salarsen
          $ids = ['aigue', 'grave'];
          $noms = ['{{name}} Forme Aigüe', '{{name}} Forme Grave'];
          $nomsEN = ['Amped Form {{name}}', 'Low Key Form {{name}}'];
        break;
        case 854: // Théffroi
        case 855: // Polthégeist
          $ids = ['', 'antique'];
          $noms = ['{{name}} Forme Contrefaçon', '{{name}} Forme Authentique'];
          $nomsEN = ['Phony Form {{name}}', 'Antique Form {{name}}'];
        break;
        case 875: // Bekaglaçon
          $ids = ['gel', 'degel'];
          $noms = ['{{name}} Tête de Gel', '{{name}} Tête Dégel'];
          $nomsEN = ['Ice Face {{name}}', 'Noice Face {{name}}'];
          $catchable = [true, false];
        break;
        case 877: // Morpeko
          $ids = ['full', 'hangry'];
          $noms = ['{{name}} Mode Rassasié', '{{name}} Mode Affamé'];
          $nomsEN = ['Full Belly Mode {{name}}', 'Hangry Mode {{name}}'];
          $catchable = [true, false];
        break;
        case 888: // Zacian
          $ids = ['', 'sword'];
          $noms = ['{{name}} Forme Héros Aguerri', '{{name}} Forme Épée Suprême'];
          $nomsEN = ['Hero of Many Battles {{name}}', 'Crowned Sword {{name}}'];
          $catchable = [true, false];
        break;
        case 889: // Zamazenta
          $ids = ['', 'shield'];
          $noms = ['{{name}} Forme Héros Aguerri', '{{name}} Forme Bouclier Suprême'];
          $nomsEN = ['Hero of Many Battles {{name}}', 'Crowned Shield {{name}}'];
          $catchable = [true, false];
        break;
        case 890: // Éthernatos
          $ids = ['', 'infini'];
          $noms = ['', '{{name}} Infinimax'];
          $nomsEN = ['', 'Eternamax {{name}}'];
          $catchable = [true, false];
        break;
        case 892: // Shifours
          $ids = ['', 'water'];
          $noms = ['{{name}} Style Poing Final', '{{name}} Style Mille Poings'];
          $nomsEN = ['Single Strike Style {{name}}', 'Rapid Strike Style {{name}}'];
        break;
        case 893: // Zarude
          $ids = ['', 'dada'];
          $noms = ['', '{{name}} Forme Dada'];
          $nomsEN = ['', 'Dada {{name}}'];
        break;
        case 898: // Sylveroy
          $ids = ['', 'ice', 'ghost'];
          $noms = ['', '{{name}}, le Cavalier du Froid', '{{name}}, le Cavalier d\'Effroi'];
          $nomsEN = ['', 'Ice Rider {{name}}', 'Shadow Rider {{name}}'];
          $catchable = [true, false, false];
        break;
        case 901: // Ursaking
          $ids = ['', 'bloodmoon'];
          $noms = ['', '{{name}} Lune Vermeille'];
          $nomsEN = ['', 'Bloodmoon {{name}}'];
        break;
        case 902: // Paragruel
          $ids = ['', ''];
          $noms = ['', ''];
          $nomsEN = ['', ''];
        break;
        case 925: // Famignol
          $ids = ['', 'four'];
          $noms = ['{{name}} Famille de Trois', '{{name}} Famille de Quatre'];
          $nomsEN = ['{{name}} Family of Three', '{{name}} Family of Four'];
        break;
        case 931: // Tapatoès
          $ids = ['', 'blue', 'yellow', 'white'];
          $noms = ['{{name}} Plumage Vert', '{{name}} Plumage Bleu', '{{name}} Plumage Jaune', '{{name}} Plumage Blanc'];
          $nomsEN = ['Green Plumage {{name}}', 'Blue Plumage {{name}}', 'Yellow Plumage {{name}}', 'White Plumage {{name}}'];
        break;
        case 964: // Superdofin
          $ids = ['', 'hero'];
          $noms = ['{{name}} Forme Ordinaire', '{{name}} Forme Super'];
          $nomsEN = ['Zero Form {{name}}', 'Hero Form {{name}}'];
          $catchable = [true, false];
        break;
        case 978: // Nigirigon
          $ids = ['', 'droopy', 'stretch'];
          $noms = ['{{name}} Forme Courbée', '{{name}} Forme Affalée', '{{name}} Forme Raide'];
          $nomsEN = ['Curly Form {{name}}', 'Droopy Form {{name}}', 'Stretchy Form {{name}}'];
        break;
        case 982: // Deusolourdo
          $ids = ['', 'three'];
          $noms = ['{{name}} Forme Double', '{{name}} Forme Triple'];
          $nomsEN = ['Two-Segment Form {{name}}', 'Three-Segment Form {{name}}'];
        break;
        case 999: // Mordudor
          $ids = ['', 'roaming'];
          $noms = ['{{name}} Forme Coffre', '{{name}} Forme Marche'];
          $nomsEN = ['Chest Form {{name}}', 'Roaming Form {{name}}'];
        break;
        case 1012: // Poltchageist
          $ids = ['', 'artisan'];
          $noms = ['{{name}} Forme Imitation', '{{name}} Forme Onéreuse'];
          $nomsEN = ['Counterfeit Form {{name}}', 'Artisan Form {{name}}'];
        break;
        case 1013: // Théffroyable
          $ids = ['', 'masterpiece'];
          $noms = ['{{name}} Forme Médiocre', '{{name}} Forme Exceptionnelle'];
          $nomsEN = ['Unremarkable Form {{name}}', 'Masterpiece Form {{name}}'];
        break;
        case 1017: // Ogerpon
          $ids = ['', 'wellspring', 'hearthflame', 'cornerstone'];
          $noms = ['{{name}} au Masque Turquoise', '{{name}} au Masque du Puits', '{{name}} au Masque du Fourneau', '{{name}} au Masque de la Pierre'];
          $nomsEN = ['Teal Mask {{name}}', 'Wellspring Mask {{name}}', 'Hearthflame Mask {{name}}', 'Cornerstone Mask {{name}}'];
          $catchable = [true, false, false, false];
        break;
        default:
          $done = false;
      }

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

      else if ($done) {
        $this->dbid = $ids[$sprite->form];
        $this->name = [
          'fr' => $noms[$sprite->form],
          'en' => $nomsEN[$sprite->form]
        ];
        if (isset($catchable)) $this->catchable = $catchable[$sprite->form] ?? true;
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
        // Méga-évolutions
        else if (self::has('mega', $dexid) && $sprite->form == 1) {
          $this->dbid = 'mega';
          $this->name = [
            'fr' => 'Méga-{{name}}',
            'en' => 'Mega {{name}}'
          ];
          $this->catchable = false;
        }
        // Méga-évolutions X et Y
        else if (self::has('megaX', $dexid) && in_array($sprite->form, [1, 2])) {
          if ($sprite->form == 1) {
            $this->dbid = 'xmega';
            $this->name = [
              'fr' => 'Méga-{{name}} X',
              'en' => 'Mega {{name}} X'
            ];
          }
          else if ($sprite->form == 2) {
            $this->dbid = 'ymega';
            $this->name = [
              'fr' => 'Méga-{{name}} Y',
              'en' => 'Mega {{name}} Y'
            ];
          }
          $this->catchable = false;
        }
        // Primo-résurgences
        else if (self::has('primal', $dexid) && $sprite->form == 1) {
          $this->dbid = 'primal';
          $this->name = [
            'fr' => 'Primo-{{name}}',
            'en' => 'Primal {{name}}'
          ];
          $this->catchable = false;
        }
        // Formes d'Alola
        else if (self::has('alolan', $dexid) && self::isAlolan($sprite, $dexid)) {
          $this->dbid = 'alola';
          $this->name = [
            'fr' => "{{name}} d'Alola",
            'en' => "Alolan {{name}}"
          ];
        }
        // Formes de Galar
        else if (self::has('galarian', $dexid) && self::isGalarian($sprite, $dexid)) {
          $this->dbid = 'galar';
          $this->name = [
            'fr' => "{{name}} de Galar",
            'en' => "Galarian {{name}}"
          ];
        }
        // Formes de Hisui
        else if (self::has('hisuian', $dexid) && self::isHisuian($sprite, $dexid)) {
          $this->dbid = 'hisui';
          $this->name = [
            'fr' => "{{name}} de Hisui",
            'en' => "Hisuian {{name}}"
          ];
        }
        // Formes de Paldea
        else if (self::has('paldean', $dexid) && self::isPaldean($sprite, $dexid)) {
          $this->dbid = 'paldea';
          $this->name = [
            'fr' => "{{name}} de Paldea",
            'en' => "Paldean {{name}}"
          ];
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

      // Mâles et femelles
      $ignoreGender = [905]; // Amovénus
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
    }
  }



  static private function has(string $formType, int $dexid): bool {
    // Classification de certains Pokémon
    $mega = [3, 9, 15, 18, 65, 80, 94, 115, 127, 130, 142, 181, 208, 212, 214, 229, 248, 254, 257, 260, 282, 302, 303, 306, 308, 310, 319, 323, 334, 354, 359, 362, 373, 376, 380, 381, 384, 428, 445, 448, 460, 475, 531, 719];
    $megaX = [6, 150];
    $primal = [382, 383];
    $alolan = [19, 20, 26, 27, 28, 37, 38, 50, 51, 52, 53, 74, 75, 76, 88, 89, 103, 105];
    $galarian = [52, 77, 78, 79, 80, 83, 110, 122, 144, 145, 146, 199, 222, 263, 264, 554, 555, 562, 618];
    $hisuian = [58, 59, 100, 101, 157, 211, 215, 503, 549, 570, 571, 628, 705, 706, 713, 724];
    $paldean = [128, 194];

    return in_array($dexid, $$formType);
  }

  static private function isAlolan(Sprite $sprite, int $dexid): bool {
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
  }
}