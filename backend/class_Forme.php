<?php
require_once 'class_Sprite.php';



class Forme extends Sprite
{
  public $dbid = '';
  public $nom = '';

  function __construct(Sprite $sprite, int $dexid)
  {
    // Formes à ne pas compter
    if (
      ($dexid == 25 && $sprite->form == 8) // Pikachu starter
      || ($dexid == 20 && $sprite->form == 2) // Rattatac totem
      || ($dexid == 105 && $sprite->form == 2) // Ossatueur totem
      || ($dexid == 133 && $sprite->form == 1) // Évoli starter
      || ($dexid == 414 && $sprite->form > 0) // Papilord (formes capes de Cheniti)
      || ($dexid == 658 && $sprite->form == 1) // Amphinobi de Sacha forme normale
      || ($dexid == 664 && $sprite->form > 0) // Lépidonille (formes de Prismillon)
      || ($dexid == 665 && $sprite->form > 0) // Pérégrain (formes de Prismillon)
      || ($dexid == 670 && $sprite->form == 5) // Floette de AZ
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
    )
      throw new Exception('Forme ignorée');
    
    $this->form = $sprite->form;
    $this->gender = $sprite->gender;
    $this->gigamax = $sprite->gigamax;
    $this->candy = $sprite->candy;

    $spriteid = ($sprite->gigamax) ? 'gigamax' : (($sprite->form !== 0) ? $sprite->form : $sprite->gender);
    
    // Cas par cas selon le Pokémon
    
    if ($spriteid == 'gigamax')
    {
      switch($dexid)
      {
        case 892: // Shifours
          switch($this->form)
          {
            case 0:
              $this->dbid = 'gigamax';
              $this->nom = 'Poing Final - Gigamax';
            break;
            case 1:
              $this->dbid = 'water-gigamax';
              $this->nom = 'Mille Poings - Gigamax';
            break;
          }
        break;
        default:
          $this->dbid = 'gigamax';
          $this->nom = 'Gigamax';
      }
    }

    else
    {
      $done = true;
      switch ($dexid)
      {
        case 0: // Œuf
          $ids = ['', 'manaphy'];
          $noms = ['Œuf', 'Œuf de Manaphy'];
        break;
        case 25: // Pikachu
          $ids = ['', 'original-cap', 'hoenn-cap', 'sinnoh-cap', 'unys-cap', 'kalos-cap', 'alola-cap', 'partner-cap', '', 'world-cap'];
          $noms = ['', 'Casquette Originale', 'Casquette de Hoenn', 'Casquette de Sinnoh', 'Casquette d\'Unys', 'Casquette de Kalos', 'Casquette d\'Alola', 'Casquette de Partenaire', '', 'Casquette Monde'];
        break;
        case 201: // Zarbi
          $ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '!', '?'];
          $noms = array_map('strtoupper', $ids);
        break;
        case 351: // Morphéo
          $ids = ['', 'sunny', 'rainy', 'snowy'];
          $noms = ['', 'Solaire', 'Eau de Pluie', 'Blizzard'];
        break;
        case 386: //Deoxys
          $ids = ['', 'attack', 'defense', 'speed'];
          $noms = ['Normal', 'Attaque', 'Défense', 'Vitesse'];
        break;
        case 412: // Cheniti
        case 413: // Cheniselle
          $ids = ['plant', 'sandy', 'trash'];
          $noms = ['Plante', 'Sable', 'Déchet'];
        break;
        case 421: // Ceriflor
          $ids = ['', 'sunny'];
          $noms = ['Couvert', 'Ensoleillé'];
        break;
        case 422: // Sancoki
        case 423: // Tritosor
          $ids = ['west', 'east'];
          $noms = ['Mer Occident', 'Mer Orient'];
        break;
        case 479: // Motisma
          $ids = ['', 'heat', 'wash', 'frost', 'fan', 'mow'];
          $noms = ['', 'Chaleur', 'Lavage', 'Froid', 'Hélice', 'Tonte'];
        break;
        case 483: // Dialga
        case 484: // Palkia
        case 487: // Giratina
          $ids = ['', 'origin'];
          $noms = ['Alternative', 'Originelle'];
        break;
        case 492: // Shaymin
          $ids = ['', 'sky'];
          $noms = ['Terrestre', 'Céleste'];
        break;
        case 493: // Arceus
        case 773: // Silvallié
          $ids = ['', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'];
          $noms = ['Normal', 'Combat', 'Vol', 'Poison', 'Sol', 'Roche', 'Insecte', 'Spectre', 'Acier', 'Feu', 'Eau', 'Plante', 'Électrik', 'Psy', 'Glace', 'Dragon', 'Ténèbres', 'Fée'];
        break;
        case 550: // Bargantua
          $ids = ['red', 'blue', 'white'];
          $noms = ['Motif Rouge', 'Motif Bleu', 'Motif Blanc'];
        break;
        case 555: // Darumacho
          $ids = ['', 'zen', 'galar', 'galar-zen'];
          $noms = ['', 'Mode Transe', 'de Galar', 'de Galar - Mode Transe'];
        break;
        case 585: // Vivaldaim
        case 586: // Haydaim
          $ids = ['spring', 'summer', 'autumn', 'winter'];
          $noms = ['Printemps', 'Été', 'Automne', 'Hiver'];
        break;
        case 641: // Boréas
        case 642: // Fulguris
        case 645: // Démétéros
        case 905: // Amovénus
          $ids = ['', 'therian'];
          $noms = ['Avatar', 'Totémique'];
        break;
        case 646: // Kyurem
          $ids = ['', 'white', 'black'];
          $noms = ['', 'Blanc', 'Noir'];
        break;
        case 647: // Keldeo
          $ids = ['', 'resolute'];
          $noms = ['Normal', 'Décidé'];
        break;
        case 648: // Meloetta
          $ids = ['', 'pirouette'];
          $noms = ['Chant', 'Danse'];
        break;
        case 649: // Genesect
          $ids = ['', 'douse', 'shock', 'burn', 'chill'];
          $noms = ['', 'Aqua', 'Choc', 'Pyro', 'Cryo'];
        break;
        case 658: // Amphinobi
          $ids = ['', '', 'ash'];
          $noms = ['', '', 'de Sacha'];
        break;
        case 666: // Prismillon
          $ids = ['icysnow', 'polar', 'tundra', 'continental', 'garden', 'elegant', 'meadow', 'modern', 'marine', 'archipelago', 'highplains', 'sandstorm', 'river', 'monsoon', 'savanna', 'sun', 'ocean', 'jungle', 'fancy', 'pokeball'];
          $noms = ['Blizzard', 'Banquise', 'Glace', 'Continent', 'Verdure', 'Monarchie', 'Floraison', 'Métropole', 'Rivage', 'Archipel', 'Sécheresse', 'Sable', 'Delta', 'Cyclone', 'Mangrove', 'Zénith', 'Soleil Levant', 'Jungle', 'Fantaisie', 'Poké Ball'];
        break;
        case 669: // Flabébé
        case 670: // Floette
        case 671: // Florges
          $ids = ['red', 'yellow', 'orange', 'blue', 'white'];
          $noms = ['Rouge', 'Jaune', 'Orange', 'Bleue', 'Blanche'];
        break;
        case 676: // Couafarel
          $ids = ['', 'heart', 'star', 'diamond', 'debutante', 'matron', 'dandy', 'la-reine', 'kabuki', 'pharaoh'];
          $noms = ['Sauvage', 'Cœur', 'Étoile', 'Diamant', 'Demoiselle', 'Madame', 'Monsieur', 'Reine', 'Kabuki', 'Pharaon'];
        break;
        case 678: // Mistigrix
        case 876: // Wimessir
          $ids = ['', 'female'];
          $noms = ['Mâle', 'Femelle'];
        break;
        case 681: // Exagide
          $ids = ['', 'blade'];
          $noms = ['Parade', 'Assaut'];
        break;
        case 710: // Pitrouille
        case 711: // Banshitrouye
          $ids = ['', 'small', 'large', 'super'];
          $noms = ['Normale', 'Mini', 'Maxi', 'Ultra'];
        break;
        case 716: // Xerneas
          $ids = ['', 'active'];
          $noms = ['Paisible', 'Déchaîné'];
        break;
        case 718: // Zygarde
          $ids = ['', '10', '', '', '100'];
          $noms = ['50%', '10%', '', '', '100%'];
        break;
        case 720: // Hoopa
          $ids = ['', 'unbound'];
          $noms = ['Enchaîné', 'Déchaîné'];
        break;
        case 741: // Plumeline
          $ids = ['flamenco', 'pau', 'pompom', 'sensu'];
          $noms = ['Flamenco', 'Hula', 'Pom-pom', 'Buyō'];
        break;
        case 745: // Lougaroc
          $ids = ['', 'midnight', 'dusk'];
          $noms = ['Diurne', 'Nocturne', 'Crépusculaire'];
        break;
        case 746: // Froussardine
          $ids = ['', 'school'];
          $noms = ['Solitaire', 'Banc'];
        break;
        case 774: // Météno
          $ids = ['', '', '', '', '', '', '', 'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
          $noms = ['Météore', '', '', '', '', '', '', 'Rouge', 'Orange', 'Jaune', 'Vert', 'Bleu', 'Indigo', 'Violet'];
        break;
        case 778: // Mimiqui
          $ids = ['', 'busted'];
          $noms = ['Déguisée', 'Démasquée'];
        break;
        case 800: // Necrozma
          $ids = ['', 'solgaleo', 'lunala', 'ultra'];
          $noms = ['', 'Crinières du Couchant', 'Ailes de l\'Aurore', 'Ultra'];
        break;
        case 801: // Magearna
          $ids = ['', 'original'];
          $noms = ['', 'Couleur du Passé'];
        break;
        case 845: // Nigosier
          $ids = ['', 'gobe', 'chu'];
          $noms = ['', 'Gobe-Tout', 'Gobe-Chu'];
        break;
        case 849: // Salarsen
          $ids = ['aigue', 'grave'];
          $noms = ['Aigüe', 'Grave'];
        break;
        case 854: // Théffroi
        case 855: // Polthégeist
          $ids = ['', 'antique'];
          $noms = ['Contrefaçon', 'Authentique'];
        break;
        case 875: // Bekaglaçon
          $ids = ['gel', 'degel'];
          $noms = ['Tête de Gel', 'Tête Dégel'];
        break;
        case 877: // Morpeko
          $ids = ['full', 'hangry'];
          $noms = ['Rassasié', 'Affamé'];
        break;
        case 888: // Zacian
          $ids = ['', 'sword'];
          $noms = ['Héros Aguerri', 'Épée Suprême'];
        break;
        case 889: // Zamazenta
          $ids = ['', 'shield'];
          $noms = ['Héros Aguerri', 'Bouclier Suprême'];
        break;
        case 890: // Éthernatos
          $ids = ['', 'infini'];
          $noms = ['', 'Infinimax'];
        break;
        case 892: // Shifours
          $ids = ['', 'water'];
          $noms = ['Poing Final', 'Mille Poings'];
        break;
        case 893: // Zarude
          $ids = ['', 'dada'];
          $noms = ['', 'Dada'];
        break;
        case 898: // Sylveroy
          $ids = ['', 'ice', 'ghost'];
          $noms = ['', 'Cavalier du Froid', 'Cavalier d\'Effroi'];
        break;
        case 902: // Paragruel
          $ids = ['', ''];
          $noms = ['', ''];
        break;
        default:
          $done = false;
      }

      // Charmilly
      if ($dexid == 869)
      {
        $ids = ['vanille', 'ruby', 'matcha', 'menthe', 'citron', 'sale', 'melruby', 'caramel', 'tricolore'];
        $noms = ['Lait Vanille', 'Lait Ruby', 'Lait Matcha', 'Lait Menthe', 'Lait Citron', 'Lait Salé', 'Mélange Ruby', 'Mélange Caramel', 'Mélange Tricolore'];

        $friandises = ['fraise', 'baie', 'coeur', 'etoile', 'trefle', 'fleur', 'ruban'];
        $friandisesNoms = ['Fraise', 'Baie', 'Cœur', 'Étoile', 'Trèfle', 'Fleur', 'Ruban'];

        $this->dbid = $ids[$sprite->form] . '-' . $friandises[$sprite->candy];
        $this->nom = $noms[$sprite->form] . ' - ' . $friandisesNoms[$sprite->candy];
      }

      else if ($done)
      {
        $this->dbid = $ids[$sprite->form];
        $this->nom = $noms[$sprite->form];
      }
      else
      {
        $this->dbid = '';
        $this->nom = '';
        if (in_array($spriteid, ['mf', 'uk', 'mo', 'fo', 'md', 'fd']))
        {
          $this->dbid = '';
          $this->nom = '';
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
        else if (self::has('mega', $dexid) && $sprite->form == 1)
        {
          $this->dbid = 'mega';
          $this->nom = 'Méga';
        }
        // Méga-évolutions X et Y
        else if (self::has('megaX', $dexid) && in_array($sprite->form, [1, 2]))
        {
          if ($sprite->form == 1)
          {
            $this->dbid = 'xmega';
            $this->nom = 'Méga (X)';
          }
          else if ($sprite->form == 2)
          {
            $this->dbid = 'ymega';
            $this->nom = 'Méga (Y)';
          }
        }
        // Primo-résurgences
        else if (self::has('primal', $dexid) && $sprite->form == 1)
        {
          $this->dbid = 'primal';
          $this->nom = 'Primo';
        }
        // Formes d'Alola
        else if (self::has('alolan', $dexid) && self::isAlolan($sprite, $dexid))
        {
          $this->dbid = 'alola';
          $this->nom = 'd\'Alola';
        }
        // Formes de Galar
        else if (self::has('galarian', $dexid) && self::isGalarian($sprite, $dexid))
        {
          $this->dbid = 'galar';
          $this->nom = 'de Galar';
        }
        // Formes de Hisui
        else if (self::has('hisuian', $dexid) && self::isHisuian($sprite, $dexid))
        {
          $this->dbid = 'hisui';
          $this->nom = 'de Hisui';
        }
        else
        {
          $this->dbid = 'unknown';
          $this->nom = 'Forme inconnue';
        }
      }

      // Mâles et femelles
      $ignoreGender = [905]; // Amovénus
      if (!in_array($dexid, $ignoreGender)) // Amovénus
      {
        if ($sprite->gender == 'md') {
          $this->nom = 'Mâle' . ($this->nom == '' ? '' : ' ' . $this->nom);
        } else if ($sprite->gender == 'fd') {
          $this->dbid = $this->dbid . ($this->dbid == '' ? '' : '-') . 'female';
          $this->nom = 'Femelle' . ($this->nom == '' ? '' : ' ' . $this->nom);
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
}