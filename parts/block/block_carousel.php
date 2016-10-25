<?php
global $asdbblock;
$thumb ='thumb-300';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}
?>

<div class="mod66 mod_wrap carousel">

    <?php echo get__thumb($thumb);?>

    <div class="item-details">
      <?php echo get_blocks_title();?>
    </div>
</div>
