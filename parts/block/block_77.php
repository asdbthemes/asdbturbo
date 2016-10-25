<?php
global $asdbblock;
$thumb ='thumb-medium';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}
?>

<div class="mod77 mod_wrap">
	<div class="hover-outer">
		<div class="hover-container">
			<div class="hover-visible">
				<?php echo get_blocks_image($thumb);?>
			<div class="hover-hidden">
				<?php echo get_blocks_title(6);?>
				<div class="entry-meta">
        		<?php echo get_blocks_date();?>
        		<?php echo get_blocks_cat(); ?>
				</div>
			</div>
			</div>
		</div>
	</div>
</div>
