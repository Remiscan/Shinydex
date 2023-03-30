/** Structure d'un Pokémon shiny tel que stocké dans la BDD en ligne. */
interface BackendShiny {
  id: number,
  huntid: string,
  userid: string,
  creationTime: string,
  lastUpdate: string,

  dexid: number,
  forme: string,
  game: string,
  method: string,
  count: string,
  charm: number,

  catchTime: string,
  name: string,
  ball: string,
  gene: string,

  notes: string,
};

/** Structure d'un Pokémon shiny tel que stocké dans la BDD locale. */
export interface feShiny extends Omit<BackendShiny, 'id' | 'userid' | 'creationTime' | 'lastUpdate' | 'count' | 'charm' | 'catchTime' | 'deleted'> {
  creationTime: number,
  lastUpdate: number,
  count: Count,
  charm: boolean,
  catchTime: number,
}



export class Count {
  'encounters'?: number = 0;
  'usum-distance'?: number;
  'usum-rings'?: number;
  'lgpe-catchCombo'?: number;
  'lgpe-lure'?: number;
  'lgpe-nextSpawn'?: number;
  'swsh-dexKo'?: number;
  'pla-dexResearch'?: number;
  'sv-outbreakCleared'?: number;
  'sv-sparklingPower'?: number;

  constructor(obj: object = {}) {
    if ('encounters' in obj) this['encounters'] = Number(obj['encounters']) || 0;
    if ('usum-distance' in obj) this['usum-distance'] = Number(obj['usum-distance']) || 0;
    if ('usum-rings' in obj) this['usum-rings'] = Number(obj['usum-rings']) || 0;
    if ('lgpe-catchCombo' in obj) this['lgpe-catchCombo'] = Number(obj['lgpe-catchCombo']) || 0;
    if ('lgpe-lure' in obj) this['lgpe-lure'] = Number(obj['lgpe-lure']) || 0;
    if ('lgpe-nextSpawn' in obj) this['lgpe-nextSpawn'] = Number(obj['lgpe-nextSpawn']) || 0;
    if ('swsh-dexKo' in obj) this['swsh-dexKo'] = Number(obj['swsh-dexKo']) || 0;
    if ('pla-dexResearch' in obj) this['pla-dexResearch'] = Number(obj['pla-dexResearch']) || 0;
    if ('sv-outbreakCleared' in obj) this['sv-outbreakCleared'] = Number(obj['sv-outbreakCleared']) || 0;
    if ('sv-sparklingPower' in obj) this['sv-sparklingPower'] = Number(obj['sv-sparklingPower']) || 0;
  }
};



export class FrontendShiny implements feShiny {
  // frontendShiny fields
  readonly huntid: string = crypto.randomUUID();
  readonly creationTime: number = Date.now();
  lastUpdate: number = 0;

  dexid: number = 0;
  forme: string = '';
  game: string = '';
  method: string = '';
  count: Count = new Count({ encounters: 0 });
  charm: boolean = false;

  catchTime: number = 0;
  name: string = '';
  ball: string = '';
  gene: string = '';
  
  notes: string = '';

  constructor(shiny: object = {}) {
    if (typeof shiny !== 'object') throw new Error('Invalid argument');

    if ('huntid' in shiny) this.huntid = String(shiny.huntid);
    if ('creationTime' in shiny) this.creationTime = Number(shiny.creationTime) || this.creationTime;
    if ('lastUpdate' in shiny) this.lastUpdate = Number(shiny.lastUpdate) || 0;

    if ('dexid' in shiny) this.dexid = Number(shiny.dexid) || 0;
    if ('forme' in shiny) this.forme = String(shiny.forme);
    if ('game' in shiny) this.game = String(shiny.game);
    if ('method' in shiny) this.method = String(shiny.method);
    if ('count' in shiny) {
      let count = shiny.count;
      if (typeof count === 'string') count = JSON.parse(count);
      if (typeof count === 'object' && count != null) this.count = new Count(count);
    }
    if ('charm' in shiny) this.charm = Boolean(shiny.charm);

    if ('catchTime' in shiny) this.catchTime = Number(shiny.catchTime) || 0;
    if ('name' in shiny) this.name = String(shiny.name);
    if ('ball' in shiny) this.ball = String(shiny.ball);
    if ('gene' in shiny) this.gene = String(shiny.gene);

    if ('notes' in shiny) this.notes = String(shiny.notes);
  }


  get countWithoutNulls(): Count {
    const entries = Object.entries(this.count);
    return Object.fromEntries(
      entries.filter(entry => entry[1])
    );
  }


  toBackend(): Omit<BackendShiny, 'id' | 'userid'> {
    return {
      huntid: this.huntid,
      creationTime: String(this.creationTime),
      lastUpdate: String(this.lastUpdate),

      dexid: this.dexid,
      forme: this.forme,
      game: this.game,
      method: this.method,
      count: JSON.stringify(this.countWithoutNulls),
      charm: Number(this.charm),

      catchTime: String(this.catchTime),
      name: this.name,
      ball: this.ball,
      gene: this.gene,

      notes: this.notes
    };
  }
}