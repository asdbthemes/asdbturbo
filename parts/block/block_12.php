<?php
global $asdbblock;
$thumb ='thumb-medium';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}
?>
<div class="mod1 mod_wrap">
    <?php echo get_blocks_title();?>
    <?php echo get_blocks_image($thumb);?>
    <div class="entry-excerpt excerpt">
        <?php echo get_blocks_excerpt(18);?>
    </div>
</div>
