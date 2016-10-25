<section class="featured-block">
	<div class="row">

<?php
for ($i=0; $i++<4;) {
$tag_id = get_post_meta( $post->ID, 'featured_tag_'.$i, true );

// Query featured entries

$featured = new WP_Query(
	array(
		'no_found_rows'				=> false,
		'update_post_meta_cache'	=> false,
		'update_post_term_cache'	=> false,
		'ignore_sticky_posts'		=> 1,
		'posts_per_page'			=> 1,
		'post_type'					=> 'post',
		'tag_id'					=> $tag_id,
	)
); ?>



			<?php while ( $featured->have_posts() ): $featured->the_post(); ?>
			<div class="item columns medium-6 item-<?php echo $i; ?>">
				<?php get_template_part('parts/block/block_55'); ?>
			</div><!--/.item-->
			<?php endwhile; ?>

			<?php wp_reset_postdata(); ?>

<?php } ?>
	</div>
</section>
