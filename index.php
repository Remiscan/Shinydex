<!doctype html>
<html lang="fr">

  <head>
    <title>Rémidex</title>
    <meta name="description" content="Pokédex recensant les Pokémon chromatiques possédés par Rémi.">
    <meta property="og:title" content="Rémidex">
    <meta property="og:description" content="Pokédex recensant les Pokémon chromatiques possédés par Rémi.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://remiscan.fr/remidex/">
    <meta property="og:image" content="https://remiscan.fr/remidex/preview.png">

    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, user-scalable=no">
    <meta name="theme-color" content="#222222">
    
    <link rel="icon" type="image/png" href="./icons/icon-192.png">
    <link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">
    <link rel="manifest" href="./manifest.json">

    <link rel="preconnect" href="https://remiscan.fr">

    <script src="./ext/localforage.min.js"></script>
    <script>
      window.tempsDebut = Date.now();

      // Stockage de données
      //// Pokédex
      const pokemonData = localforage.createInstance({
        name: 'remidex',
        storeName: 'pokemon-data',
        driver: localforage.INDEXEDDB
      });
      //// Liste de shiny
      const shinyStorage = localforage.createInstance({
        name: 'remidex',
        storeName: 'shiny-list',
        driver: localforage.INDEXEDDB
      });
      //// Données diverses
      const dataStorage = localforage.createInstance({
        name: 'remidex',
        storeName: 'misc',
        driver: localforage.INDEXEDDB
      });
      // Chasses en cours
      const huntStorage = localforage.createInstance({
        name: 'remidex',
        storeName: 'hunts',
        driver: localforage.INDEXEDDB
      });

      // Définition du thème
      async function setTheme(askedTheme = false)
      {
        // Thème sélectionné par l'utilisateur
        await dataStorage.ready();
        const userTheme = await dataStorage.getItem('theme');

        // Thème préféré selon l'OS
        let osTheme;
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) osTheme = 'dark';
        else if (window.matchMedia('(prefers-color-scheme: light)').matches) osTheme = 'light';

        // Thème exigé par la fonction
        const forcedTheme = (askedTheme == 'system') ? osTheme : askedTheme;

        // Thème par défaut
        const defaultTheme = 'dark';

        // On applique le thème (forcedTheme > userTheme > osTheme > defaultTheme)
        const theme = forcedTheme || userTheme || osTheme || defaultTheme;
        const storedTheme = (askedTheme == 'system') ? null : (forcedTheme || userTheme);

        let html = document.documentElement;
        html.classList.remove('light', 'dark');
        html.classList.add(theme);
        
        let themeColor = (theme == 'dark') ? 'rgb(34, 34, 34)' : 'rgb(224, 224, 224)';
        document.querySelector("meta[name=theme-color]").setAttribute('content', themeColor);

        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));

        return await dataStorage.setItem('theme', storedTheme);
      }

      Promise.all([dataStorage.ready(), shinyStorage.ready(), pokemonData.ready()])
      .then(() => setTheme());

      window.matchMedia('(prefers-color-scheme: dark)').addListener(event => setTheme());
      window.matchMedia('(prefers-color-scheme: light)').addListener(event => setTheme());
    </script>

    <?php $mods = preg_filter('/(.+).js/', '$1', scandir(__DIR__.'/modules'));
    foreach($mods as $mod) { ?>
    <link rel="modulepreload" href="./modules/<?=$mod?>.js">
    <?php } ?>

    <link rel="stylesheet" href="./styles.css">
  </head>

  <body data-section-actuelle="mes-chromatiques">
    <!-- Écran de chargement -->
    <div id="load-screen" style="grid-row: 1 / 3; grid-column: 1 / 2; position: absolute; z-index: 1000;width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background-color: var(--bg-color, rgb(34, 34, 34));">
      <load-spinner id="spinner" style="--size: 3em;"></load-spinner>
      <p style="margin-top: 20px; display: none;" id="load-screen-message"></p>
    </div>

    <!-- Barre de navigation -->
    <nav class="bottom-bar">
      <a class="nav-link lien-section" data-section="mes-chromatiques">
        <i class="material-icons">storage</i>
        <span>Chromatiques</span>
      </a>

      <a class="nav-link lien-section" data-section="pokedex">
        <i class="material-icons">language</i>
        <span>Pokédex<svg class="shinystars"><use xlink:href="./images/shinystars.svg#stars"></use></svg></span>
      </a>

      <a class="nav-link lien-section" data-section="chasses-en-cours">
        <i class="material-icons">add_circle</i>
        <span>Chasses</span>
      </a>

      <!-- Seulement sur PC -->
      <a class="nav-link lien-section only-pc" data-section="parametres">
        <i class="material-icons">settings</i>
        <span>Paramètres</span>
      </a>
    </nav>

    <!-- Barre de chargement (superposé à nav) -->
    <div class="loading-bar">
      <load-spinner></load-spinner>
      <a class="icone bouton-retour">
        <i class="material-icons">close</i>
      </a>
    </div>

    <!-- Contenu de l'appli -->
    <main>

      <!-- Mes chromatiques -->
      <section id="mes-chromatiques">
        <?php include './pages/mes-chromatiques.html'; ?>
      </section>

      <!-- Pokédex chromatique -->
      <section id="pokedex">
        <?php include './pages/pokedex.html'; ?>
      </section>

      <!-- FAB des filtres -->
      <button class="fab">
        <i class="material-icons"></i>
      </button>

      <!-- Bouton installer -->
      <div id="install-bouton">
        <i class="material-icons">get_app</i>
        <span>Installer</span>
      </div>

      <!-- Chasses en cours -->
      <section id="chasses-en-cours">
        <?php include './pages/chasses-en-cours.html'; ?>
      </section>

      <!-- Paramètres -->
      <section id="parametres">
        <?php include './pages/parametres.html'; ?>
      </section>

      <!-- À propos -->
      <section id="a-propos">
        <?php include './pages/a-propos.html'; ?>
      </section>

    </main>

    <!-- Notification -->
    <div class="notification bottom-bar off" id="notification">
      <span class="notif-texte">Mise à jour disponible...</span>
      <div class="notif-bouton">
        <span>Installer</span>
        <i class="material-icons">update</i>
      </div>

      <div class="progression-maj"></div>

      <load-spinner></load-spinner>
    </div>

    <!-- Menu des filtres -->
    <?php include './pages/menu-filtres.html'; ?>

    <!-- Obfuscator -->
    <div class="obfuscator off"></div>

    <!-- Sprite viewer -->
    <section id="sprite-viewer">
      <?php include './pages/sprite-viewer.html'; ?>
    </section>

    <!-- Mesure de la fenêtre -->
    <div id="hauteur-fenetre" style="width: 0; height: 100vh; position: absolute;"></div>
    <div id="largeur-fenetre" style="width: 100vw; height: 0; position: absolute;"></div>

    <!-- Scripts -->
    <script type="module" src="./scripts.js"></script>

  </body>
</html>