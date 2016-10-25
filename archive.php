<?php
/**
 * The template for displaying archive pages.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package asdbTurbo
 * @since asdbTurbo 1.0.0
 */


global $taxMeta;
//$taxMeta = asdb_taxMeta();
$defaults = array(
	'title_background'	=>array('0'=>''),
	'shortcode_block'	=>array('0'=>''),
	'col_num'			=>array('0'=>'inherit'),
	'cat_style'			=>array('0'=>'cat-style-2'),
);
get_all_termmeta($defaults);
if ($taxMeta->col_num ==='inherit') {$columns=ot_get_option('blog-columns');} else {$columns=$taxMeta->col_num;}
get_header(); ?>

	<div class="wrap">
		<div class="primary-area content-area">
			<main id="main" class="site-main" role="main">


				<header class="page-header">
					<?php
						the_archive_title( '<h1 class="page-title">', '</h1>' );
						the_archive_description( '<div class="archive-description">', '</div>' );
					?>
				</header><!-- .page-header -->
				<?php if ( $taxMeta->shortcode_block!='' ) : ?>
				<section class="featured">
					<?php echo do_shortcode(''.$taxMeta->shortcode_block.''); ?>
				</section>
				<?php endif; ?>

        <?php if ( have_posts() ) : ?>

			<div class="row">

			<?php $i = 1; $count_row=1; while ( have_posts() ): the_post(); ?>

			<div class="<?php if ($columns>1) {echo 'columns medium-'. 12/$columns;} else {echo 'single-post';} ?>">
				<?php get_template_part( 'parts/loop/loop-'.$taxMeta->cat_style ); ?>
			</div>

				<?php if($i % $columns == 0) {$count_row++; echo '</div><!-- .row --><div class="row">';} ?>

			<?php $i++; endwhile; ?>
			</div><!-- .row -->

        <?php else : ?>

        	<?php get_template_part( 'parts/post-templates/content', 'none' ); ?>

        <?php endif; ?>




			</main><!-- #main -->
		</div><!-- .primary -->

		<?php get_sidebar(); ?>

	</div><!-- .wrap -->

<?php get_template_part('parts/sections/pagination'); ?>

<?php get_footer(); ?>