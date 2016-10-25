<?php
global $asdbblock;
$thumb ='thumb-small';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}
?>

<div class="mod6 mod_wrap">

    <?php echo get_blocks_image($thumb);?>

<div class="item-info">
    <?php echo get_blocks_title(6);?>
    <div class="entry-excerpt excerpt">
        <?php echo get_blocks_excerpt(18);?>
    </div>
</div>

</div>
