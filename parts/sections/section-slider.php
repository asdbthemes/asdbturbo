<?php

$cat_id = get_post_meta( $post->ID, 'featured_category', true );
$tag_id = get_post_meta( $post->ID, 'featured_tag', true );
$limit = get_post_meta( $post->ID, 'featured_limit', true );

// Query featured entries
$args =  array(
    'no_found_rows'       => false,
    'update_post_meta_cache'  => false,
    'update_post_term_cache'  => false,
    'ignore_sticky_posts'   => 1,
    'posts_per_page'      => $limit,
    'post_type'         => 'post',
    'cat'           => $cat_id,
  );
if ($tag_id ) {
$args['tag_id'] = $tag_id;
}

$featured = new WP_Query( $args ); ?>

<script>
jQuery(document).ready(function($) {
  $('.asdb-slider').slick({
    dots: false,
    infinite: true,
    speed: 300,
    slidesToShow: 1,
    adaptiveHeight: true,
    nextArrow:'<div class="slider-next"><i class="fa fa-angle-right"></i></div>',
    prevArrow:'<div class="slider-prev"><i class="fa fa-angle-left"></i></div>',
  });
});
</script>
<section class="featured-slider">
  <div class="row">
    <div class="asdb-slider">
      <?php while ( $featured->have_posts() ): $featured->the_post(); ?>
      <div class="item">
        <?php get_template_part('parts/block/block_slider'); ?>
      </div><!--/.item-->
      <?php endwhile; ?>
      <?php wp_reset_postdata(); ?>

    </div>
  </div>
</section>
