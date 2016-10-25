<?php
/**
 * The template for displaying all single posts.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#single-post
 *
 * @package asdbTurbo
 * @since asdbTurbo 1.0.0
 */

global $asdbmeta;
$catstyle = get_post_meta( $post->ID, '_style', true );
if ($catstyle =='') {$catstyle = 'style-1';}
get_header();
?>
	<div class="wrap">

		<div class="primary-area content-area">
			<main id="main" class="site-main" role="main">

			<?php while ( have_posts() ) : the_post(); ?>

			<?php get_template_part( 'parts/content/content-single-'. $catstyle ); ?>
			<?php $tag = get_the_tags(); if ( $tag ) { ?>
			<div class="entry-footer">
				<p class="tags"><?php the_tags('<span>'.__('Tags: ','asdbturbo').'</span>',' ',''); ?></p>

			</div>
			<?php } ?>

			<?php
			//the_post_navigation();
			echo get_post_meta($post->ID, 'related-tag', true);
			echo get_post_meta($post->ID, 'related-cat', true);
the_post_navigation( array(
	'next_text' => '<span class="meta-nav" aria-hidden="true">Далее <i class="fa fa-angle-right"></i></span> ' .
		'<span class="screen-reader-text">Следующая запись</span> ' .
		'<span class="post-title">%title</span>',
	'prev_text' => '<span class="meta-nav" aria-hidden="true"><i class="fa fa-angle-left"></i> Назад</span> ' .
		'<span class="screen-reader-text">Предыдущая запись</span> ' .
		'<span class="post-title">%title</span>',
) );

			?>



			<?php
			//exec_time();
			if ( get_post_meta( $post->ID, '_related_type', true ) =='1' ) :
			get_template_part( 'parts/sections/section-related-tag');
			elseif ( get_post_meta( $post->ID, '_related_type', true ) =='2' ) :
			get_template_part( 'parts/sections/section-related');
			endif;
			//$extime['related'] = exec_time('end');
			?>
	<?php if ( function_exists('wds_page_builder_area') ): ?>
		<?php wds_page_builder_area(); ?>
	<?php endif; ?>

			<?php if ( comments_open() || get_comments_number() ) { comments_template('/comments.php', true); } ?>

			<?php endwhile; // End of the loop. ?>

			</main><!-- #main -->

		</div><!-- .primary -->

		<?php get_sidebar(); ?>

	</div><!-- .wrap -->

<?php get_footer(); ?>