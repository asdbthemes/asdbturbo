<?php
// Query featured entries

$cat = get_post_meta( $post->ID, '_carousel', true );
$featured = new WP_Query(
	array(
		'no_found_rows'				=> false,
		'update_post_meta_cache'	=> false,
		'update_post_term_cache'	=> false,
		'ignore_sticky_posts'		=> 1,
		'posts_per_page'			=> 18,
		'post_type'					=> 'post',
		'cat'						=> $cat,
	)
); ?>

<script type="text/javascript">
jQuery(document).ready(function(){
  var owl = jQuery("#carousel");
  owl.owlCarousel({
      itemsCustom : [
        [0, 2],
        [450, 2],
        [600, 2],
        [700, 3],
        [1000, 4],
        [1200, 4],
        [1400, 4],
        [1600, 5],
        [2000, 6]
      ],
      scrollPerPage : true,
      navigationText : ['<i class="fa  fa-2x fa-angle-left "></i>','<i class="fa fa-2x fa-angle-right "></i>'],
      navigation : true
  });
});
</script>

<section class="carousel">
<div class="container">
	<div class="row">
		<h4><i class="fa fa-newspaper-o">&nbsp;</i><?php echo get_the_category_by_ID( $cat ); ?></h4>
		<div class="hr"></div>
	</div>
</div>
		<div class="owl-carousel owl-theme" id="carousel">
			<?php while ( $featured->have_posts() ): $featured->the_post(); ?>
			<div class="item">
				<?php get_template_part('parts/post-templates/content-carusel'); ?>
			</div><!--/.item-->
			<?php endwhile; ?>
		</div><!--/.carousel-->
<?php wp_reset_postdata(); ?>
</section>