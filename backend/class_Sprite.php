<?php
class Sprite {
  public $form;
  public $gender;
  public $gigamax;
  public $candy;

  function __construct(string $fichier = 'poke_capture_0000_000_uk_n_00000000_f_n.png') {
    $sprite = str_replace('.png', '', $fichier);
    $sprite = explode('_', $sprite);

    // Ne pas récupérer dexid ici, cela grossira les données stockées inutilement
    // (chaque Pokémon stockerait son dexid dans chaque objet "Forme")
    $this->form = intval($sprite[3]);
    $this->gender = $sprite[4]; // uk = asexué, mf = indifférent mâle/femelle, md = mâle, fd = femelle, mo = mâle only, fo = femelle only
    $this->gigamax = ($sprite[5] == 'g') ? true : false;
    $this->candy = intval($sprite[6]); // friandise (uniquement utilisé par Charmilly)
  }
}