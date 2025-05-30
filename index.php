<?php
$commonDir = '../_common';
require_once $commonDir.'/php/Translation.php';
$translation = new Translation(file_get_contents(__DIR__.'/dist/strings/meta.json'));
$httpLanguage = $translation->getLanguage();
?>
<!doctype html>
<html lang="<?=$httpLanguage?>">

  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, interactive-widget=resizes-content">
    <meta name="theme-color" content="#222222">
    <meta name="theme-color" id="medium-layout-theme-color" media="screen and (min-width: 720px)" content="#222222" data-forced-color="surface-container">

    <title>Shinydex</title>
    <meta name="description" content="<?=$translation->get('meta-description')?>">
    <meta property="og:title" content="Shinydex">
    <meta property="og:description" content="<?=$translation->get('meta-description')?>">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://remiscan.fr/shinydex/">
    <meta property="og:image" content="https://remiscan.fr/shinydex/images/preview.png">
    
    <link rel="icon" type="image/svg+xml" href="./images/app-icons/favicon.svg">
    <link rel="apple-touch-icon" href="./images/app-icons/apple-touch-icon.png">
    <link rel="manifest" href="./manifest.php">
    <link rel="canonical" href="https://remiscan.fr/shinydex/">
    <base href="https://<?=$_SERVER['SERVER_NAME']?>/shinydex/">

    <script type="importmap">
    {
      "imports": {
        "input-switch-styles": "../_common/components/input-switch/styles.css",
        "input-switch-template": "../_common/components/input-switch/template.js",
        "colori": "../colori/lib/dist/colori.min.js",
        "translation-observer": "../_common/js/translation-observer/mod.js",
        "remiscan-logo": "/_common/components/remiscan-logo/remiscan-logo.js",
        "remiscan-logo-svg": "/_common/components/remiscan-logo/logo.svg",
        "remiscan-logo-svg-horizontal": "/_common/components/remiscan-logo/logo-horizontal.svg",
        "remiscan-logo-svg-square": "/_common/components/remiscan-logo/logo-square.svg"
      }
    }
    </script>

    <script>window.tempsChargementDebut = performance.now();</script>
    <script defer src="../_common/polyfills/adoptedStyleSheets.min.js"></script>
    <script>window.esmsInitOptions = { polyfillEnable: ['css-modules', 'json-modules'] }</script>
    <script defer src="../_common/polyfills/es-module-shims.js"></script>
    <script defer src="../_common/polyfills/popover.min.js"></script>
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

  <body data-section-actuelle="mes-chromatiques" class="background welcome" data-anti-spoilers-pokedex="on" data-anti-spoilers-friends="on" data-anti-spoilers-public="on">
    <!-- Écran de chargement -->
    <div id="load-screen" style="grid-row: 1 / 3; grid-column: 1 / 2; position: absolute; z-index: 1000;width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background-color: var(--bg-color, rgb(34, 34, 34)); --surface-color: var(--surface);">
      <load-spinner id="spinner" style="--size: 3em;"></load-spinner>
      <p style="margin-top: 20px; display: none;" id="load-screen-message"></p>
    </div>

    <!-- Barre de navigation -->
    <nav class="bottom-bar surface surface-container">
      <search-box section="mes-chromatiques"></search-box>
      <search-box section="pokedex"></search-box>
      <search-box section="chasses-en-cours"></search-box>
      <search-box section="corbeille"></search-box>
      <search-box section="partage"></search-box>
      <search-box section="chromatiques-ami"></search-box>

      <a class="nav-link lien-section surface interactive" data-nav-section="mes-chromatiques" href="./mes-chromatiques">
        <span class="material-icons surface" aria-hidden="true">catching_pokemon</span>
        <span class="label-medium" data-string="section-mes-chromatiques-short-title"></span>
      </a>

      <a class="nav-link lien-section surface interactive" data-nav-section="pokedex" href="./pokedex">
        <span class="material-icons surface" aria-hidden="true">apps</span>
        <span class="label-medium" data-string="section-pokedex-short-title"></span>
      </a>

      <a class="nav-link lien-section surface interactive" data-nav-section="chasses-en-cours" href="./chasses-en-cours">
        <span class="material-icons surface" aria-hidden="true">add_circle</span>
        <span class="label-medium" data-string="section-chasses-en-cours-short-title"></span>
      </a>

      <a class="nav-link lien-section surface interactive only-pc" data-nav-section="corbeille" href="./corbeille">
        <span class="material-icons surface" aria-hidden="true">auto_delete</span>
        <span class="label-medium" data-string="section-corbeille-short-title"></span>
      </a>

      <a class="nav-link lien-section surface interactive" data-nav-section="partage" href="./partage">
        <span class="material-icons surface" aria-hidden="true">group</span>
        <span class="label-medium" data-string="section-partage-short-title"></span>
      </a>

      <a class="nav-link lien-section surface interactive" data-nav-section="flux" href="./flux">
        <span class="material-icons surface" aria-hidden="true">newspaper</span>
        <span class="label-medium" data-string="section-flux-short-title"></span>
      </a>

      <a class="nav-link lien-section surface interactive only-pc" data-nav-section="parametres" href="./parametres">
        <span class="material-icons surface" aria-hidden="true">settings</span>
        <sync-progress></sync-progress>
        <span class="label-medium" data-string="section-parametres-short-title"></span>
      </a>

      <a class="nav-link lien-section surface interactive only-pc" data-nav-section="a-propos" href="./a-propos">
        <span class="material-icons surface" aria-hidden="true">info</span>
        <span class="label-medium" data-string="section-a-propos-short-title"></span>
      </a>
    </nav>

    <!-- Contenu de l'appli -->
    <main class="surface surface-default">

      <!-- FAB -->
      <button type="button" id="main-fab" class="surface interactive fab elevation-3-shadow only-icon" data-label="fab-pokemon">
        <span class="material-icons" aria-hidden="true">add</span>
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
      <section id="chromatiques-ami">
        <?php include './pages/chromatiques-ami.html'; ?>
      </section>

      <!-- Flux -->
      <section id="flux" class="vide">
        <?php include './pages/flux.html'; ?>
      </section>

      <!-- Paramètres -->
      <section id="parametres">
        <?php include './pages/parametres.html'; ?>
      </section>

      <!-- À propos -->
      <section id="a-propos">
        <?php
        ob_start();
        include './images/app-icons/icon.svg';
        $icon = ob_get_clean();

        ob_start();
        include './pages/a-propos.html';
        $apropos = ob_get_clean();

        $apropos = str_replace('{{app-icon}}', $icon, $apropos);
        echo $apropos;
        ?>
      </section>

    </main>

    <!-- Sprite viewer -->
    <dialog id="sprite-viewer" class="surface">
      <sprite-viewer></sprite-viewer>
    </dialog>

    <!-- Menu de filtres -->
    <bottom-sheet id="filter-menu" drag modal>
      <filter-menu section="mes-chromatiques"></filter-menu>
      <filter-menu section="chasses-en-cours"></filter-menu>
      <filter-menu section="corbeille"></filter-menu>
      <filter-menu section="partage"></filter-menu>
      <filter-menu section="chromatiques-ami"></filter-menu>
    </bottom-sheet>

    <!-- User search -->
    <bottom-sheet id="user-search" drag modal>
      <h2 class="title-large" data-string="add-friend-hint"></h2>

      <form name="user-search" class="search-form">
        <input type="text" name="username" class="surface surface-container-high interactive body-large"
          inputmode="search" enterkeyhint="search" role="searchbox" autocomplete="off" autofocus
          minlength="1" maxlength="20"
          data-placeholder="add-friend-placeholder"
        >

        <button type="reset" class="surface interactive icon-button only-icon reset-icon" data-label="reset-search">
          <span class="material-icons" aria-hidden="true">close</span>
        </button>

        <button type="submit" class="surface interactive filled tonal only-icon" data-label="submit-search">
          <span class="material-icons" aria-hidden="true">search</span>
        </button>
      </form>
    </bottom-sheet>

    <!-- Changelog -->
    <bottom-sheet id="changelog" drag modal data-changelog-hash="<?=hash_file('crc32b', __DIR__.'/pages/changelog.html')?>">
      <h2 class="title-large" data-string="section-changelog-long-title"></h2>
      <?php include './pages/changelog.html'; ?>
    </bottom-sheet>

    <!-- Notifications -->
    <div class="notification-container"></div>
  </body>
</html>