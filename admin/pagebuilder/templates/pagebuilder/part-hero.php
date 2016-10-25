<?php
/**
 * Part Name: Hero
 * Description: Displays Hero.
 */


$hero_bg = wds_page_builder_get_this_part_data( 'hero_bg' );
$hero_title = wds_page_builder_get_this_part_data( 'hero_title' );
$hero_subtitle = wds_page_builder_get_this_part_data( 'hero_subtitle' );
$hero_btn = wds_page_builder_get_this_part_data( 'hero_btn' );
$hero_btnurl = wds_page_builder_get_this_part_data( 'hero_btnurl' );
?>

<div id="js-parallax-window" class="parallax-window">
  <div class="parallax-static-content">
				<span class="content-headings medium-6">
					<h2><?php echo $hero_title; ?></h2>
					<p><?php echo $hero_subtitle; ?></p>
				</span>
				<span class="content-button medium-6">
					<a href="<?php echo $hero_btnurl; ?>"><button><?php echo $hero_btn; ?></button></a>
				</span>

</div>

  <div id="js-parallax-background" class="parallax-background" style="background:url(<?php echo $hero_bg; ?>);"></div>
  <div class="overlay" style="opacity: 0.4; background-color: #000;"> </div>

</div>