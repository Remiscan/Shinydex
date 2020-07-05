String.prototype.pad = function(long) {
  let chaine = this;
  while (chaine.length < long)
    chaine = `0${chaine}`;
  return chaine;
}

class Pokemon {
  constructor(pkmn) {
    this.dexid = pkmn.dexid;
    this.name = pkmn.name;
    this.namefr = pkmn.namefr;
    this.formes = pkmn.formes;
  }

  getSprite(forme, options = {})
  {
    const shiny = (typeof options.shiny != 'undefined') ? options.shiny : false;
    const shinySuffix = shiny ? 'r' : 'n';
    const big = (typeof options.big != 'undefined') ? options.big : false;
    const size = big ? 'big' : 'small';
    const sizePrefix = big ? 'capture' : 'icon';

    const side = (typeof forme.hasBackside != 'undefined' && typeof options.backside != 'undefined' && options.backside) ? 'b' : 'f';

    const formToConsider = (shiny && this.dexid == 869) ? 0 : forme.form;

    const spriteCaracs = [
      `./sprites-home/${size}/poke`,
      sizePrefix,
      this.dexid.toString().pad(4),
      formToConsider.toString().pad(3),
      forme.gender,
      forme.gigamax ? 'g' : 'n',
      forme.candy.toString().pad(8),
      side,
      shinySuffix
    ];

    let spriteUrl = spriteCaracs.join('_');

    if (typeof forme.noShiny != 'undefined' && forme.noShiny == true && shiny)
      spriteUrl = this.getSprite(forme, {shiny: false, big: options.big, backside: options.backside});

    return spriteUrl;
  }

  static async namesfr() {
    const allNames = [];
    await pokemonData.ready();
    const pkmnNumber = await pokemonData.length();
    for (let i = 0; i < pkmnNumber; i++) {
      const pkmn = await pokemonData.getItem(String(i));
      allNames.push(pkmn.namefr);
    }
    return allNames;
  }

  static get jeux() {
    const allGames = [
      { nom: 'Bleue', gen: 1, id: 'rb' },
      { nom: 'Rouge', gen: 1, id: 'rb' },
      { nom: 'Jaune', gen: 1, id: 'yellow' },
      { nom: 'Or', gen: 2, id: 'gs' },
      { nom: 'Argent', gen: 2, id: 'gs' },
      { nom: 'Cristal', gen: 2, id: 'crystal' },
      { nom: 'Saphir', gen: 3, id: 'rs' },
      { nom: 'Rubis', gen: 3, id: 'rs' },
      { nom: 'Emeraude', gen: 3, id: 'emerald' },
      { nom: 'Rouge Feu', gen: 3, id: 'frlg' },
      { nom: 'Vert Feuille', gen: 3, id: 'frlg' },
      { nom: 'Diamant', gen: 4, id: 'dp' },
      { nom: 'Perle', gen: 4, id: 'dp' },
      { nom: 'Platine', gen: 4, id: 'platinum' },
      { nom: 'Or HeartGold', gen: 4, id: 'hgss' },
      { nom: 'Argent SoulSilver', gen: 4, id: 'hgss' },
      { nom: 'Noire', gen: 5, id: 'bw' },
      { nom: 'Noire 2', gen: 5, id: 'bw2' },
      { nom: 'X', gen: 6, id: 'xy' },
      { nom: 'Y', gen: 6, id: 'xy' },
      { nom: 'Rubis Oméga', gen: 6, id: 'oras' },
      { nom: 'Saphir Alpha', gen: 6, id: 'oras' },
      { nom: 'Soleil', gen: 7, id: 'sm' },
      { nom: 'Lune', gen: 7, id: 'sm' },
      { nom: 'Ultra Soleil', gen: 7, id: 'usum' },
      { nom: 'Ultra Lune', gen: 7, id: 'usum' },
      { nom: 'GO', gen: 0, id: 'go' },
      { nom: 'Lets Go Pikachu', gen: 7.1, id: 'lgpe' },
      { nom: 'Lets Go Evoli', gen: 7.1, id: 'lgpe' },
      { nom: 'Epee', gen: 8, id: 'swsh' },
      { nom: 'Bouclier', gen: 8, id: 'swsh' },
      { nom: 'Home', gen: 8, id: 'home' }
    ];
    return allGames;
  }
}

class Shiny {
  constructor(shiny, pokemon) {
    this.dexid = pokemon.dexid;
    this.dbid = shiny.id;

    let k = pokemon.formes.findIndex(p => p.dbid == shiny.forme);
    if (k == -1)
      throw `La forme de ce Shiny est invalide (${pokemon.surnom} / ${pokemon.namefr} / ${shiny.forme})`;
    this.forme = pokemon.formes[k];

    this.espece = pokemon.namefr;
    this.surnom = shiny.surnom;
    this.methode = shiny.methode;
    this.compteur = shiny.compteur;
    this.date = shiny.date;
    this.jeu = shiny.jeu;
    this.ball = shiny.ball;
    this.description = shiny.description;
    this.checkmark = shiny.origin;
    this.monjeu = shiny.monjeu;
    this.charm = shiny.charm;
    this.hacked = shiny.hacked;
    this.random = shiny.aupif;
  }

  static async build(shiny) {
    const dexid = shiny['numero_national'];
    let pokemon;
    try {
      pokemon = await pokemonData.getItem(dexid);
      if (pokemon == null) throw 'Aucun Pokémon ne correspond à ce Shiny';
      return new Shiny(shiny, pokemon);
    } catch(error) {
      console.error(error);
    }
  }

  get mine() {
    let k = Shiny.methodes('notmine').findIndex(m => m.nom == this.methode);
    if (k == -1) return true;
    else return false;
  }

  static get allMethodes() {
    const allGames = Pokemon.jeux;
    const allMethodes = [
      { nom: 'Sauvage', jeux: allGames, mine: true, charm: true },
      { nom: 'Œuf', jeux: allGames.filter(g => ![1, 7.1, 0].includes(g.gen)), mine: true, charm: true },
      { nom: 'Masuda', jeux: allGames.filter(g => g.gen >= 4 && g.gen != 7.1), mine: true, charm: true },
      { nom: 'Reset', jeux: allGames.filter(g => g.gen >= 2), mine: true, charm: true },
      { nom: 'Pokéradar', jeux: allGames.filter(g => [4, 6].includes(g.gen)), mine: true, charm: true },
      { nom: 'Pêche à la chaîne', jeux: allGames.filter(g => g.gen == 6), mine: true, charm: true },
      { nom: 'Sauvage (horde)', jeux: allGames.filter(g => g.id == 'xy'), mine: true, charm: true },
      { nom: 'Safari des Amis', jeux: allGames.filter(g => g.id == 'xy'), mine: true, charm: true },
      { nom: 'Chaîne au Navi-Dex', jeux: allGames.filter(g => g.id == 'oras'), mine: true, charm: true },
      { nom: 'Chaîne SOS', jeux: allGames.filter(g => g.gen == 7), mine: true, charm: true },
      { nom: 'Ultra-Brèche', jeux: allGames.filter(g => g.gen == 7), mine: true, charm: false },
      { nom: 'Chaîne de captures', jeux: allGames.filter(g => g.gen == 7.1), mine: true, charm: true },
      { nom: 'Bonus de combats', jeux: allGames.filter(g => g.gen == 8), mine: true, charm: true },
      { nom: 'Raid Dynamax', jeux: allGames.filter(g => g.gen == 8), mine: true, charm: false },
      { nom: 'Sauvage (évènement)', jeux: allGames.filter(g => g.gen == 0), mine: true, charm: false },
      { nom: 'Sauvage (garanti)', jeux: allGames.filter(g => ['gs', 'hgss', 'bw2'].includes(g.id)), mine: true, charm: false },
      { nom: 'Glitch', jeux: allGames.filter(g => [1, 2].includes(g.gen)), mine: true, charm: false },
      { nom: 'Distribution', jeux: allGames, mine: false, charm: false },
      { nom: 'Échangé', jeux: allGames, mine: false, charm: false },
      { nom: 'Échangé (GTS)', jeux: allGames.filter(g => g.gen >= 4 && g.gen != 7.1), mine: false, charm: false },
      { nom: 'Échange miracle', jeux: allGames.filter(g => g.gen >= 6 && g.gen != 7.1), mine: false, charm: false },
      { nom: 'Échangé (œuf)', jeux: allGames.filter(g => g.gen >= 2 && g.gen != 7.1), mine: false, charm: false }
    ];
    return allMethodes;
  }

  get Jeu() {
    let k = Pokemon.jeux.findIndex(p => p.nom == this.jeu);
    if (k == -1)
      throw `Jeu invalide (${this.jeu})`;

    return Pokemon.jeux[k];
  }

  static methodes(option) {
    const allMethodes = Shiny.allMethodes;
    switch (option)
    {
      case 'charmless':
        return allMethodes.filter(m => m.charm == false);
      case 'mine':
        return allMethodes.filter(m => m.mine == true);
      case 'notmine':
        return allMethodes.filter(m => m.mine == false);
      default:
        return allMethodes;
    }
  }

  get shinyRate() {
    // Taux de base
    const game = this.Jeu;
    const baseRate = (game.gen == 0) ? 450 : 
      ((game.gen < 6) ? 8192 : 4096);

    const methodes = Shiny.methodes();

    let k = methodes.findIndex(p => p.nom == this.methode);
    if (k == -1)
      throw `Méthode invalide (${this.methode})`;

    const methode = methodes[k];
    let rolls;
    let rate;
    let useRolls = true;
    let bonusRolls = 0;
    let charmRolls = this.charm * 2;
    let chain, compteur, chainRolls, lureRolls, bugChance, chainCoeff;

    switch (methode.nom)
    {
      case 'Glitch':
      case 'Sauvage (garanti)':
        bonusRolls = baseRate;
        break;
      case 'Masuda':
        bonusRolls = (game.gen >= 5) ? 5 : 4;
        break;
      case 'Pokéradar':
        useRolls = false;
        chain = Math.min(40, Math.max(0, this.compteur));
        rate = 65536 / Math.ceil(65535 / (8200 - chain * 200));
        rate = Math.round(rate);
        break;
      case 'Pêche à la chaîne':
        chain = Math.min(20, this.compteur);
        bonusRolls = 2 * chain;
        break;
      case 'Chaîne au Navi-Dex':
        useRolls = false;
        // compliqué...
        break;
      case 'Safari des Amis':
        bonusRolls = 4;
        break;
      case 'Chaîne SOS':
        chainCoeff = (this.compteur >= 31) ? 3
                      : (this.compteur >= 21) ? 2
                      : (this.compteur >= 11) ? 1
                      : 0;
        bonusRolls = 4 * chainCoeff;
        break;
      case 'Ultra-Brèche':
        useRolls = false;
        // this.compteur == au format { "distance": 30, "rings": 2 }
        compteur = (this.compteur == 0) ? { distance: 0, rings: 0 }
                        : JSON.parse(this.compteur);
        let d = Math.min(9, Math.floor(compteur.distance) / 500 - 1);
        rate = (compteur.rings == 3) ? (4 * d)
                : (compteur.rings == 2) ? ((1 + 2 * d))
                : (compteur.rings == 1) ? ((1 + d))
                : 1;
        rate = Math.round(100 / rate);
        break;
      case 'Sauvage (évènement)':
        useRolls = false;
        rate = this.compteur;
        break;
      case 'Chaîne de captures':
        // this.compteur == au format { "chain": 20, "lure": true }
        compteur = (this.compteur == 0) ? { chain: 0, lure: false }
                        : JSON.parse(this.compteur);
        lureRolls = (compteur.lure) ? 1 : 0;
        chainRolls = (compteur.chain >= 31) ? 11
                      : (compteur.chain >= 21) ? 7
                      : (compteur.chain >= 11) ? 3
                      : 0
        bonusRolls = lureRolls + chainRolls;
        break;
      case 'Bonus de combats':
        useRolls = false; // tant que le bug n'est pas corrigé
        chainRolls = (this.compteur >= 500) ? 5
                      : (this.compteur >= 300) ? 4
                      : (this.compteur >= 200) ? 3
                      : (this.compteur >= 100) ? 2
                      : (this.compteur >= 50) ? 1
                      : 0;
        bugChance = (this.compteur >= 500) ? 3
                     : (this.compteur >= 300) ? 3
                     : (this.compteur >= 200) ? 2.5
                     : (this.compteur >= 100) ? 2
                     : (this.compteur >= 50) ? 1.5
                     : 0;
        rolls = 1 + charmRolls + chainRolls;
        rate = Math.round(baseRate / rolls);
        rate = (bugChance / 100) * rate + ((100 - bugChance) / 100) * baseRate;
        rate = Math.round(rate);
        break;
      case 'Raid Dynamax':
        useRolls = false;
        rate = '???';
        break;
      default:
        bonusRolls = 0;
    }

    rolls = 1 + charmRolls + bonusRolls;
    rate = useRolls ? Math.round(baseRate / rolls) : rate;

    return rate;
  }
}

export { Pokemon, Shiny };