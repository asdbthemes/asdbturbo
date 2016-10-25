<?php
global $asdbblock;
$thumb ='thumb-300';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}
?>

<div class="mod5 mod_wrap">

    <?php echo get__thumb($thumb);?>

    <div class="item-details">
    	<?php echo get_blocks_title();?>
    <div class="entry-meta">
        <?php //echo get_blocks_author();?>
        <?php echo get_blocks_date();?>
        <?php echo get_blocks_comments(); ?>
        <?php //echo get_blocks_views(); ?>
    </div>
    </div>
</div>
