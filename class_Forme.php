<?php
require_once 'class_Sprite.php';

class Forme extends Sprite
{
  public $dbid = '';
  public $nom = '';

  function __construct(Sprite $sprite)
  {
    // Formes à ne pas compter
    if (
      ($sprite->dexid == 25 && $sprite->form == 8) // Pikachu starter
      || ($sprite->dexid == 25 && $sprite->form == 9) // Pikachu casquette World
      || ($sprite->dexid == 20 && $sprite->form == 2) // Rattatac totem
      || ($sprite->dexid == 105 && $sprite->form == 2) // Ossatueur totem
      || ($sprite->dexid == 133 && $sprite->form == 1) // Évoli starter
      || ($sprite->dexid == 414 && $sprite->form > 0) // Papilord (formes capes de Cheniti)
      || ($sprite->dexid == 664 && $sprite->form > 0) // Lépidonille (formes de Prismillon)
      || ($sprite->dexid == 665 && $sprite->form > 0) // Pérégrain (formes de Prismillon)
      || ($sprite->dexid == 670 && $sprite->form == 5) // Floette de AZ
      || ($sprite->dexid == 735 && $sprite->form == 1) // Argouste totem
      || ($sprite->dexid == 738 && $sprite->form == 1) // Lucanon totem
      || ($sprite->dexid == 743 && $sprite->form == 1) // Rubombelle totem
      || ($sprite->dexid == 744 && $sprite->form == 1) // Rocabot (évolue en crépusculaire)
      || ($sprite->dexid == 752 && $sprite->form == 1) // Tarenbulle totem
      || ($sprite->dexid == 754 && $sprite->form == 1) // Floramantis totem
      || ($sprite->dexid == 758 && $sprite->form == 1) // Malamandre totem
      || ($sprite->dexid == 777 && $sprite->form == 1) // Togedemaru totem
      || ($sprite->dexid == 784 && $sprite->form == 1) // Ékaïser totem
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
      switch($sprite->dexid)
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
      switch ($sprite->dexid)
      {
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
          $ids = ['red', 'blue'];
          $noms = ['Rouge', 'Bleu'];
        break;
        case 555: // Darumacho
          $ids = ['', 'zen', 'galar', 'galar-zen'];
          $noms = ['Normal', 'Transe', 'de Galar', 'de Galar - Transe'];
        break;
        case 585: // Vivaldaim
        case 586: // Haydaim
          $ids = ['spring', 'summer', 'autumn', 'winter'];
          $noms = ['Printemps', 'Été', 'Automne', 'Hiver'];
        break;
        case 641: // Boréas
        case 642: // Fulguris
        case 645: // Démétéros
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
        default:
          $done = false;
      }

      // Charmilly
      if ($sprite->dexid == 869)
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
        // Classification de certains Pokémon
        $hasMega = [3, 9, 15, 18, 65, 80, 94, 115, 127, 130, 142, 181, 208, 212, 214, 229, 248, 254, 257, 260, 282, 302, 303, 306, 308, 310, 319, 323, 334, 354, 359, 362, 373, 376, 380, 381, 384, 428, 445, 448, 460, 475, 531, 719];
        $hasMegaX = [6, 150];
        $hasPrimal = [382, 383];
        $hasAlolan = [19, 20, 26, 27, 28, 37, 38, 50, 51, 52, 53, 74, 75, 76, 88, 89, 103, 105];
        $hasGalarian = [52, 77, 78, 79, 80, 83, 110, 122, 222, 263, 264, 554, 555, 562, 618];

        if (in_array($spriteid, ['mf', 'uk', 'mo', 'fo']))
        {
          $this->dbid = '';
          $this->nom = '';
        }
        else if ($spriteid == 'md')
        {
          $this->dbid = '';
          $this->nom = 'Mâle';
        }
        else if ($spriteid == 'fd')
        {
          $this->dbid = 'female';
          $this->nom = 'Femelle';
        }
        // Méga-évolutions
        else if (in_array($sprite->dexid, $hasMega) && $sprite->form == 1)
        {
          $this->dbid = 'mega';
          $this->nom = 'Méga';
        }
        // Méga-évolutions X et Y
        else if (in_array($sprite->dexid, $hasMegaX) && in_array($sprite->form, [1, 2]))
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
        else if (in_array($sprite->dexid, $hasPrimal) && $sprite->form == 1)
        {
          $this->dbid = 'primal';
          $this->nom = 'Primo';
        }
        // Formes d'Alola
        else if (in_array($sprite->dexid, $hasAlolan) && $sprite->form == 1)
        {
          $this->dbid = 'alola';
          $this->nom = 'd\'Alola';
        }
        // Formes de Galar
        else if (
          (in_array($sprite->dexid, $hasGalarian) && !in_array($sprite->dexid, $hasAlolan) && !in_array($sprite->dexid, $hasMega) && $sprite->form == 1)
          || (in_array($sprite->dexid, $hasGalarian) && in_array($sprite->dexid, $hasAlolan) && !in_array($sprite->dexid, $hasMega) && $sprite->form == 2)
          || (in_array($sprite->dexid, $hasGalarian) && !in_array($sprite->dexid, $hasAlolan) && in_array($sprite->dexid, $hasMega) && $sprite->form == 2)
        )
        {
          $this->dbid = 'galar';
          $this->nom = 'de Galar';
        }
        // Pikachu
        else if ($sprite->dexid == 25)
        {
          switch ($sprite->form)
          {
            case 1:
              $this->nom = 'Casquette Originale';
            break;
            case 2:
              $this->nom = 'Casquette de Hoenn';
            break;
            case 3:
              $this->nom = 'Casquette de Sinnoh';
            break;
            case 4:
              $this->nom = 'Casquette d\'Unys';
            break;
            case 5:
              $this->nom = 'Casquette de Kalos';
            break;
            case 6:
              $this->nom = 'Casquette d\'Alola';
            break;
            case 7:
              $this->nom = 'Casquette Partenaire';
            break;
          }
        }
        else
        {
          $this->dbid = 'unknown';
          $this->nom = 'Forme inconnue';
        }
      }
    }
  }
}