<?php

$cat_id = get_post_meta( $post->ID, '_carousel_category', true );
$limit = 12;

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

$featured = new WP_Query( $args ); ?>

<script>
jQuery(document).ready(function($) {
  $('.asdb-carousel').slick({
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 4,
    centerPadding: '40px',
    adaptiveHeight: false,
    nextArrow:'<div class="slider-next"><i class="fa fa-angle-right"></i></div>',
    prevArrow:'<div class="slider-prev"><i class="fa fa-angle-left"></i></div>',
  });
});
</script>
<section class="carousel">
  <div class="row">
    <div class="asdb-carousel">
      <?php while ( $featured->have_posts() ): $featured->the_post(); ?>
      <div class="item">
        <?php get_template_part('parts/block/block_carousel'); ?>
      </div><!--/.item-->
      <?php endwhile; ?>
      <?php wp_reset_postdata(); ?>

    </div>
  </div>
</section>
