<?php
global $asdbblock;
$thumb ='thumb-medium';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}
?>

<div class="mod1 mod_wrap">
    <?php echo get__thumb($thumb);?>
    <?php echo get_blocks_title();?>
</div>
