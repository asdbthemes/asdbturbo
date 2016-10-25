<?php
global $asdbblock;
$thumb ='thumb-medium';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}

?>

<div class="mod2 mod_wrap">

    <div class="item-details">
    <?php echo get_blocks_image($thumb);?>
    <div class="entry-meta">
        <?php echo get_blocks_date();?>
    </div>
    <?php echo get_blocks_title(8);?>
    </div>

    <div class="entry-excerpt excerpt">
        <?php echo get_blocks_excerpt(18);?>
    </div>

</div>
