<?php
require_once $_SERVER['DOCUMENT_ROOT'].'/shinydex/backend/class_Pokemon.php';

$dir = "../images/pokemon-sprites/home";
$files = scandir($dir);

$pokemons = [];
forEach(Pokemon::POKEMON_NAMES_EN as $id => $name)
{
  $sprites = preg_grep('/poke_capture_([0]+)?' . intval($id) . '_.+_n\.png/', $files);
  $pokemons[] = new Pokemon($id, $sprites);
}

echo '<body style="display: grid; grid-template-columns: 3fr 1fr;">';

echo '<div>';

forEach($pokemons as $pokemon)
{
  ?>

  <div style="display: flex; flex-wrap: wrap; background-color: rgba(0, 0, 0, .02); box-shadow: 0 1px 5px rgba(0, 0, 0, .2); margin: 20px 10px; padding: 2px; border-radius: 5px;">
    <div style="flex-basis: 100%;"><?=$pokemon->dexid . ' - ' . $pokemon->name['en'] . ' - ' . $pokemon->name['fr']?><br><pre><?php //print_r($pokemon); ?></pre></div>
  <?php
  forEach($pokemon->formes as $forme)
  {
    $options = (object) ['shiny' => false, 'big' => false];
    ?>
    <div style="display: grid; border: 1px solid rgba(0, 0, 0, 1); box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .15); margin: 5px; padding: 5px; border-radius: 5px;">
      <div style="grid-row: 1 / 2;">
      <?php echo '<pre>'; print_r($forme); echo '</pre>'; ?>
        <img src="<?=$pokemon->getSprite($forme, (object) [ 'shiny' => false, 'format' => 'webp' ])?>" width="112" height="112">
        <img src="<?=$pokemon->getSprite($forme, (object) [ 'shiny' => true, 'format' => 'webp' ])?>" width="112" height="112">
      </div>
      <div style="grid-row: 2 / 3;">
        <?=($forme->name['fr'] != '') ? $forme->name['fr'] : '(Normal)'?>
      </div>
    </div>
    <?php
  }
  ?>
  </div>

  <?php
}

echo '</div><div><pre>';
echo json_encode($pokemons, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
echo '</pre></div>';