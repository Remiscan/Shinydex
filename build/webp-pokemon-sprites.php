<?php
function buildWebpSprites(int $size = 512, bool $logs = true) {
  // Get sprites
  $spriteDir = __DIR__.'/../images/pokemon-sprites/home';
  $spriteFiles = array_filter(scandir($spriteDir), function($file) use ($spriteDir) {
    return !is_dir("$spriteDir/$file");
  });

  $outDir = __DIR__."/../images/pokemon-sprites/webp/$size";
  if (!is_dir($outDir)) mkdir($outDir, recursive: true);

  // For each sprite, resize it and save it as webp
  foreach ($spriteFiles as $file) {
    $webpSprite = imagecreatetruecolor($size, $size);
    $transparentImg = imagecolorallocatealpha($webpSprite, 0, 0, 0, 127);
    imagefill($webpSprite, 0, 0, $transparentImg);
    imagesavealpha($webpSprite, true);

    $srcPath = __DIR__."/../images/pokemon-sprites/home/$file";
    $pngSprite = imagecreatefrompng($srcPath);

    // Copy (and resize) the sprite onto the sheet
    $startSize = getimagesize($srcPath);
    imagecopyresampled($webpSprite, $pngSprite, 0, 0, 0, 0, $size, $size, $startSize[0], $startSize[1]);

    $filename = str_replace('.png', '.webp', $file);
    $outPath = "$outDir/$filename";
    imagewebp($webpSprite, $outPath, 100);

    if ($logs) echo "Sprite $file resized ($size)\n";
  }

  if ($logs) echo date('Y-m-d H:i:s') . " sprites resized!\n";
}



buildWebpSprites(112);
buildWebpSprites(512);