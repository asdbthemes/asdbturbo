<?php
global $asdbblock;
$thumb ='thumb-medium';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}
?>

<div class="mod4 mod_wrap">
    <?php echo get_blocks_title();?>
    <?php echo get_blocks_image($thumb);?>
</div>
