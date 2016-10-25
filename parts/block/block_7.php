<?php
global $asdbblock;
$thumb ='thumb-medium';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}
?>

<div class="mod7 mod_wrap">
	<div class="hover-tile-outer">
		<div class="hover-tile-container">
			<div class="hover-tile hover-tile-visible">
			<?php echo get_blocks_image($thumb);?>
			</div>
			<div class="hover-tile hover-tile-hidden">
				<?php echo get_blocks_title(6);?>
				<div class="entry-meta">
        		<?php echo get_blocks_date();?>
        		<?php echo get_blocks_cat(); ?>
				</div>
			</div>
		</div>
	</div>
</div>
