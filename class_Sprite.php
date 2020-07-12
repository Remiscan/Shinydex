<?php
class Sprite
{
  public $form;
  public $gender;
  public $gigamax;
  public $candy;

  function __construct($fichier = 'poke_capture_0000_000_uk_n_00000000_f_n.png')
  {
    $sprite = str_replace('.png', '', $fichier);
    $sprite = explode('_', $sprite);

    $this->form = intval($sprite[3]);
    $this->gender = $sprite[4]; // uk = asexué, mf = indifférent mâle/femelle, md = mâle, fd = femelle, mo = mâle only, fo = femelle only
    $this->gigamax = ($sprite[5] == 'g') ? true : false;
    $this->candy = intval($sprite[6]); // friandise (uniquement utilisé par Charmilly)
  }
}