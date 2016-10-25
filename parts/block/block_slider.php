<?php
global $asdbblock;
$thumb ='thumb-slider';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}
?>

<div class="mod5 mod_wrap asdbslider">

    <?php echo get__thumb($thumb);?>

    <div class="item-details">
    <div class="entry-meta">
        <?php echo get_blocks_date();?>
        <?php echo get_blocks_comments(); ?>
    </div>
      <?php echo get_blocks_title();?>

    <div class="entry-excerpt excerpt">
        <?php echo get_blocks_excerpt(18);?>
    </div>
		<span class="meta-category">
		<?php echo get_the_category_list( '',  $post->ID ); ?>
		</span>
    </div>
</div>
