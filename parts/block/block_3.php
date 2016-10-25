<?php
global $asdbblock;
$thumb ='thumb-medium';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}
?>

<div class="mod3 mod_wrap">

    <?php echo get_blocks_image($thumb);?>

    <div class="entry-meta">
        <?php echo get_blocks_date();?>
        <?php echo get_blocks_cat(); ?>
        <?php //echo get_blocks_views(); ?>
    </div>

    <?php echo get_blocks_title();?>
    <div class="entry-excerpt excerpt">
        <?php echo get_blocks_excerpt(24);?>
    </div>


</div>
