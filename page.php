<?php
/**
 * The template for displaying all pages.
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages
 * and that other 'pages' on your WordPress site may use a
 * different template.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package asdbTurbo
 * @since asdbTurbo 1.0.0
 */

get_header(); ?>

	<div class="wrap">

	    <?php if ( get_post_meta( $post->ID, '_featured_slider', true ) =='on' ) { ?>

	    <div class="row featured-<?php echo get_post_meta( $post->ID, '_featured_style', true ); ?>">
	    	<div class="columns medium-7">
	    	 <?php get_template_part( 'parts/sections/section-slider'); ?>
	    	</div>
	    	<div class="columns medium-5">
	    	 <?php get_template_part( 'parts/sections/section-block'); ?>
	    	</div>
	    </div>
		<?php } ?>
		<div class="primary-area content-area">

           	<?php if ( get_post_meta( $post->ID, '_pagetitle', true ) != 'off' ) : ?>
        	<?php get_template_part( 'parts/page-templates/page-title' ); ?>
			<?php endif; ?>

			<main id="main" class="site-main" role="main">

				<?php while ( have_posts() ) : the_post(); ?>

					<?php get_template_part( 'parts/content/content', 'page' ); ?>

					<?php if ( comments_open() || get_comments_number() ) { comments_template('/comments.php', true); } ?>

				<?php endwhile; // End of the loop. ?>

			</main><!-- #main -->

		<?php if ( get_post_meta( $post->ID, '_related_type', true ) =='on' ) { get_template_part( 'parts/sections/section-related-tag'); } ?>

	<?php if ( function_exists('wds_page_builder_area') ): ?>
		<?php wds_page_builder_area(); ?>
	<?php endif; ?>

	<?php



	?>

		</div><!-- .primary -->

		<?php get_sidebar(); ?>

	</div><!-- .wrap -->

<?php if ( get_post_meta( $post->ID, '_carousel', true ) =='on' ) { get_template_part( 'parts/sections/section-carusel'); } ?>

<?php get_footer(); ?>