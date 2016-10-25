<?php
global $asdbblock;
$thumb ='thumb-small';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}
?>

<div class="mod88 mod_wrap">
	<div class="item-info">
    	<?php echo get_blocks_title();?>
	</div>
		<?php echo get_blocks_image($thumb);?>
</div>
