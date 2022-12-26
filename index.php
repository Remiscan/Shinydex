<!doctype html>
<html lang="fr">

  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, user-scalable=no">
    <meta name="theme-color" content="#222222">

    <title>Shinydex</title>
    <meta name="description" content="Pokédex recensant les Pokémon chromatiques possédés par Rémi.">
    <meta property="og:title" content="Shinydex">
    <meta property="og:description" content="Pokédex recensant les Pokémon chromatiques possédés par Rémi.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://remiscan.fr/shinydex/">
    <meta property="og:image" content="https://remiscan.fr/shinydex/images/preview.png">
    
    <link rel="icon" type="image/svg+xml" href="./images/app-icons/favicon.svg">
    <link rel="apple-touch-icon" href="./images/app-icons/apple-touch-icon.png">
    <link rel="manifest" href="./manifest.json">

    <link rel="preconnect" href="https://remiscan.fr">

    <script>window.tempsChargementDebut = performance.now();</script>
    <script defer src="../_common/polyfills/inert.min.js"></script>
    <script defer src="../_common/polyfills/adoptedStyleSheets.min.js"></script>
    <script>window.esmsInitOptions = { polyfillEnable: ['css-modules', 'json-modules'] }</script>
    <script defer src="../_common/polyfills/es-module-shims.js"></script>
    <script type="importmap">
    {
      "imports": {
        "input-switch-styles": "../_common/components/input-switch/styles.css",
        "input-switch-template": "../_common/components/input-switch/template.js"
      }
    }
    </script>
    <script defer src="./ext/localforage.min.js"></script>
    <script type="module" src="./modules/main.js"></script>

    <?php
    $modules = new RecursiveIteratorIterator(
      new RecursiveDirectoryIterator(
        __DIR__.'/modules',
        RecursiveDirectoryIterator::SKIP_DOTS
      ),
      RecursiveIteratorIterator::SELF_FIRST
    );
    foreach($modules as $mod => $obj) {
      if (is_dir($mod)) continue;
      else if (str_ends_with($mod, '.html')) continue;
      else if (str_ends_with($mod, '.css')) continue; // can't preload css modules yet
      else                                  { $rel = 'modulepreload'; $as = null; }
      ?>
    <link rel="<?=$rel?>" <?=($as ? 'as="'.$as.'"' : '')?> href="<?=str_replace(__DIR__, '.', $mod)?>">
      <?php
    } ?>

    <link rel="preload" as="image" href="./images/pokemonsheet.webp">
    <link rel="preload" as="image" href="./images/iconsheet.webp">

    <link rel="stylesheet" href="./ext/material_icons.css">
    <link rel="stylesheet" href="./images/pokemonsheet.css">
    <link rel="stylesheet" href="./images/iconsheet.css">
    <link rel="stylesheet" href="./styles/themes.css.php">
    <link rel="stylesheet" href="./styles/common.css">
    <link rel="stylesheet" href="./styles/app.css">
  </head>

  <body data-section-actuelle="mes-chromatiques">
    <!-- Écran de chargement -->
    <div id="load-screen" style="grid-row: 1 / 3; grid-column: 1 / 2; position: absolute; z-index: 1000;width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background-color: var(--bg-color, rgb(34, 34, 34));">
      <load-spinner id="spinner" style="--size: 3em;"></load-spinner>
      <p style="margin-top: 20px; display: none;" id="load-screen-message"></p>
    </div>

    <!-- Barre de navigation -->
    <nav class="bottom-bar">
      <a class="nav-link lien-section search-button" data-section="obfuscator" data-nav-data='{ "search": true }' href="#">
        <i class="material-icons">search</i>
      </a>

      <a class="nav-link lien-section" data-section="mes-chromatiques" href="./mes-chromatiques">
        <i class="material-icons">catching_pokemon</i>
        <span>Pokémon <shiny-stars></shiny-stars></span>
      </a>

      <a class="nav-link lien-section" data-section="pokedex" href="./pokedex">
        <i class="material-icons">language</i>
        <span>Pokédex <shiny-stars></shiny-stars></span>
      </a>

      <a class="nav-link lien-section" data-section="chasses-en-cours" href="./chasses-en-cours">
        <i class="material-icons">add_circle</i>
        <span>Chasses</span>
      </a>

      <a class="nav-link lien-section" data-section="partage" href="./partage">
        <i class="material-icons">group</i>
        <span>Amis</span>
      </a>

      <!-- Seulement sur PC -->
      <a class="nav-link lien-section only-pc" data-section="parametres" href="./parametres">
        <i class="material-icons">settings</i>
        <span>Paramètres</span>
      </a>
    </nav>

    <!-- Contenu de l'appli -->
    <main>

      <!-- Mes chromatiques -->
      <section id="mes-chromatiques" class="vide loading">
        <?php include './pages/mes-chromatiques.html'; ?>
      </section>

      <!-- Pokédex chromatique -->
      <section id="pokedex" class="loading">
        <?php include './pages/pokedex.html'; ?>
      </section>

      <!-- Chasses en cours -->
      <section id="chasses-en-cours" class="vide loading">
        <?php include './pages/chasses-en-cours.html'; ?>
      </section>

      <!-- Corbeille -->
      <section id="corbeille" class="vide loading">
        <?php include './pages/corbeille.html'; ?>
      </section>

      <!-- Liste d'amis -->
      <section id="partage" class="vide">
        <?php include './pages/partage.html'; ?>
      </section>

      <!-- Chromatiques d'un ami -->
      <section id="chromatiques-ami" class="vide">
        <?php include './pages/chromatiques-ami.html'; ?>
      </section>

      <!-- Paramètres -->
      <section id="parametres">
        <?php include './pages/parametres.html'; ?>
      </section>

      <!-- À propos -->
      <section id="a-propos">
        <?php
        ob_start();
        include './pages/politique-confidentialite.html';
        $politique = ob_get_clean();
        ob_start();
        include './pages/a-propos.html';
        $apropos = ob_get_clean();
        echo str_replace('{{polconf}}', $politique, $apropos);
        ?>
      </section>

      <!-- FAB -->
      <button type="button" class="fab">
        <i class="material-icons">add</i>
      </button>

    </main>

    <!-- Sprite viewer -->
    <section id="sprite-viewer">
      <sprite-viewer></sprite-viewer>
    </section>

    <!-- Obfuscator -->
    <section id="obfuscator"></section>

    <!-- Barre de recherches -->
    <search-bar></search-bar>

    <!-- Notification -->
    <div class="notification bottom-bar" id="notification">
      <span class="notif-texte"></span>
      <button type="button" class="notif-bouton text">
        <span></span>
        <i class="material-icons"></i>
      </button>

      <div class="progression-maj"></div>

      <load-spinner></load-spinner>
    </div>
  </body>
</html>