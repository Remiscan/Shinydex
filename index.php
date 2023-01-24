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
        "input-switch-template": "../_common/components/input-switch/template.js",
        "colori": "../colori/lib/dist/colori.min.js"
      }
    }
    </script>
    <script defer src="./ext/localforage.min.js"></script>
    <script type="module" src="./dist/modules/main.js"></script>

    <?php
    $modules = new RecursiveIteratorIterator(
      new RecursiveDirectoryIterator(
        __DIR__.'/dist/modules',
        RecursiveDirectoryIterator::SKIP_DOTS
      ),
      RecursiveIteratorIterator::SELF_FIRST
    );
    foreach($modules as $mod => $obj) {
      if (is_dir($mod)) continue;
      else if (str_ends_with($mod, '.html')) continue;
      else if (str_ends_with($mod, '.css')) continue; // can't preload css modules yet
      else { $rel = 'modulepreload'; $as = null; }
      $path = str_replace(__DIR__, '.', $obj->getPath()) . '/' . $obj->getFilename();
      ?>
    <link rel="<?=$rel?>" <?=($as ? 'as="'.$as.'"' : '')?> href="<?=$path?>">
      <?php
    } ?>

    <link rel="preload" as="image" href="./images/pokemonsheet.webp">
    <link rel="preload" as="image" href="./images/iconsheet.webp">

    <style id="palette"></style>

    <link rel="stylesheet" href="./ext/material_icons.css">
    <link rel="stylesheet" href="./images/pokemonsheet.css">
    <link rel="stylesheet" href="./images/iconsheet.css">
    <link rel="stylesheet" href="./styles/themes.css.php">
    <link rel="stylesheet" href="./styles/common.css">

    <link rel="stylesheet" href="./styles/app.css">
    <link rel="stylesheet" href="./styles/app-medium.css" media="screen and (min-width: 720px)">
    <link rel="stylesheet" href="./styles/app-large.css" media="screen and (min-width: 1140px)">
  </head>

  <body data-section-actuelle="mes-chromatiques" class="background">
    <!-- Écran de chargement -->
    <div id="load-screen" style="grid-row: 1 / 3; grid-column: 1 / 2; position: absolute; z-index: 1000;width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background-color: var(--bg-color, rgb(34, 34, 34));">
      <load-spinner id="spinner" style="--size: 3em;"></load-spinner>
      <p style="margin-top: 20px; display: none;" id="load-screen-message"></p>
    </div>

    <!-- Barre de navigation -->
    <nav class="bottom-bar surface primary elevation-2">
      <search-box section="mes-chromatiques"></search-box>
      <search-box section="pokedex"></search-box>
      <search-box section="chasses-en-cours"></search-box>
      <search-box section="corbeille"></search-box>
      <search-box section="partage"></search-box>
      <search-box section="chromatiques-ami"></search-box>
      
      <a class="nav-link lien-section search-button" data-nav-section="obfuscator" data-nav-data='{ "search": true }' href="#" style="display: none">
        <span class="material-icons">search</span>
      </a>

      <a class="nav-link lien-section surface interactive" data-nav-section="mes-chromatiques" href="./mes-chromatiques">
        <span class="material-icons surface" aria-hidden="true">catching_pokemon</span>
        <span class="label-medium">Pokémon <shiny-stars></shiny-stars></span>
      </a>

      <a class="nav-link lien-section surface interactive" data-nav-section="pokedex" href="./pokedex">
        <span class="material-icons surface" aria-hidden="true">apps</span>
        <span class="label-medium">Pokédex <shiny-stars></shiny-stars></span>
      </a>

      <a class="nav-link lien-section surface interactive" data-nav-section="chasses-en-cours" href="./chasses-en-cours">
        <span class="material-icons surface" aria-hidden="true">add_circle</span>
        <span class="label-medium">Chasses</span>
      </a>

      <a class="nav-link lien-section surface interactive only-pc" data-nav-section="corbeille" href="./corbeille">
        <span class="material-icons surface" aria-hidden="true">auto_delete</span>
        <span class="label-medium">Corbeille</span>
      </a>

      <a class="nav-link lien-section surface interactive" data-nav-section="partage" href="./partage">
        <span class="material-icons surface" aria-hidden="true">group</span>
        <span class="label-medium">Amis</span>
      </a>

      <a class="nav-link lien-section surface interactive only-pc" data-nav-section="parametres" href="./parametres">
        <span class="material-icons surface" aria-hidden="true">settings</span>
        <span class="label-medium">Paramètres</span>
      </a>

      <a class="nav-link lien-section surface interactive only-pc" data-nav-section="a-propos" href="./a-propos">
        <span class="material-icons surface" aria-hidden="true">info</span>
        <span class="label-medium">À propos</span>
      </a>
    </nav>

    <!-- Contenu de l'appli -->
    <main class="surface primary">

      <!-- FAB -->
      <button type="button" class="surface interactive fab shadow only-icon">
        <span class="material-icons">add</span>
      </button>

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
        include './images/app-icons/icon.svg';
        $icon = ob_get_clean();

        ob_start();
        include './pages/a-propos.html';
        $apropos = ob_get_clean();

        $apropos = str_replace('{{polconf}}', $politique, $apropos);
        $apropos = str_replace('{{app-icon}}', $icon, $apropos);
        echo $apropos;
        ?>
      </section>

    </main>

    <!-- Sprite viewer -->
    <section id="sprite-viewer" class="background">
      <sprite-viewer></sprite-viewer>
    </section>

    <!-- Obfuscator -->
    <section id="obfuscator" class="background"></section>

    <!-- Menu de filtres -->
    <section id="filter-menu">
      <filter-menu data-section="mes-chromatiques" class="surface variant primary shadow elevation-2"></filter-menu>
      <filter-menu data-section="chasses-en-cours" class="surface variant primary shadow elevation-2"></filter-menu>
      <filter-menu data-section="corbeille" class="surface variant primary shadow elevation-2"></filter-menu>
      <filter-menu data-section="partage" class="surface variant primary shadow elevation-2"></filter-menu>
      <filter-menu data-section="chromatiques-ami" class="surface variant primary shadow elevation-2"></filter-menu>
    </section>

    <!-- Misc top layer -->
    <section id="top-layer"></section>

    <!-- Notifications -->
    <div class="notification-container"></div>
  </body>
</html>