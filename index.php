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

    <script>
      window.tempsDebut = Date.now();

      // Définition du thème
      let theme;
      if (!localStorage.getItem('remidex/theme'))
        theme = 'dark';
      else
        theme = localStorage.getItem('remidex/theme');

      function setTheme(theme)
      {
        let html = document.documentElement;
        html.classList.remove('light', 'dark');
        html.classList.add(theme);
        let themeColor;
        if (theme == 'dark')
          themeColor = 'rgb(34, 34, 34)';
        else
          themeColor = 'rgb(224, 224, 224)';
        document.querySelector("meta[name=theme-color]").setAttribute('content', themeColor);
        localStorage.setItem('remidex/theme', theme);
      }
      setTheme(theme);
    </script>

    <link rel="modulepreload" href="./mod_appContent.js">
    <link rel="modulepreload" href="./mod_appLifeCycle.js">
    <link rel="modulepreload" href="./mod_DexDatalist.js">
    <link rel="modulepreload" href="./mod_easterEgg.js">
    <link rel="modulepreload" href="./mod_filtres.js">
    <link rel="modulepreload" href="./mod_Hunt.js">
    <link rel="modulepreload" href="./mod_navigate.js">
    <link rel="modulepreload" href="./mod_notification.js">
    <link rel="modulepreload" href="./mod_Params.js">
    <link rel="modulepreload" href="./mod_Pokemon.js">
    <link rel="modulepreload" href="./mod_pokemonCard.js">
    <link rel="modulepreload" href="./mod_spriteViewer.js">

    <link rel="stylesheet" href="./styles.css">
    <link rel="stylesheet" href="./pokesprite/pokesprite.css">
  </head>

  <body data-section-actuelle="mes-chromatiques">
    <!-- Écran de chargement -->
    <div id="load-screen" style="grid-row: 1 / 3; grid-column: 1 / 2; position: absolute; z-index: 1000; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: var(--bg-color);">
      <div class="spinner" id="spinner">
        <div class="spinner-wrapper">
          <div class="rotator">
            <div class="inner-spin"></div>
            <div class="inner-spin"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Barre de navigation -->
    <nav class="bottom-bar">
      <a class="nav-link lien-section" data-section="mes-chromatiques">
        <i class="material-icons">storage</i>
        <span>Chromatiques</span>
      </a>

      <a class="nav-link lien-section" data-section="pokedex">
        <i class="material-icons">language</i>
        <span>Pokédex<svg class="shinystars"><use xlink:href="shinystars.svg#stars"></use></svg></span>
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
      <div class="spinner">
        <div class="spinner-wrapper">
          <div class="rotator">
            <div class="inner-spin"></div>
            <div class="inner-spin"></div>
          </div>
        </div>
      </div>
      <a class="icone bouton-retour">
        <i class="material-icons">close</i>
      </a>
    </div>

    <!-- Contenu de l'appli -->
    <main>

      <!-- Mes chromatiques -->
      <section id="mes-chromatiques">
        <?php include './section_mes-chromatiques.html'; ?>
      </section>

      <!-- Pokédex chromatique -->
      <section id="pokedex">
        <?php include './section_pokedex.html'; ?>
      </section>

      <!-- FAB des filtres -->
      <button class="fab">
        <i class="material-icons">filter_list</i>
      </button>

      <!-- Bouton installer -->
      <div id="install-bouton">
        <i class="material-icons">get_app</i>
        <span>Installer</span>
      </div>

      <!-- Chasses en cours -->
      <section id="chasses-en-cours">
        <?php include './section_chasses-en-cours.html'; ?>
      </section>

      <!-- Paramètres -->
      <section id="parametres">
        <?php include './section_parametres.html'; ?>
      </section>

      <!-- À propos -->
      <section id="a-propos">
        <?php include './section_a-propos.html'; ?>
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

      <div class="maj-loading">
        <div class="spinner">
          <div class="spinner-wrapper">
            <div class="rotator">
              <div class="inner-spin"></div>
              <div class="inner-spin"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Menu des filtres -->
    <?php include './section_menu-filtres.html'; ?>

    <!-- Obfuscator -->
    <div class="obfuscator off"></div>

    <!-- Sprite viewer -->
    <section id="sprite-viewer">
      <?php include './section_sprite-viewer.html'; ?>
    </section>

    <!-- Mesure de la fenêtre -->
    <div id="hauteur-fenetre" style="width: 0; height: 100vh; position: absolute; padding: 0; margin: 0;"></div>
    <div id="largeur-fenetre" style="width: 100vw; height: 0; position: absolute; padding: 0; margin: 0;"></div>

    <!-- Scripts -->
    <script type="module" src="./scripts.js"></script>

  </body>
</html>