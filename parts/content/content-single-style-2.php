<?php
/**
 * Template part for displaying content style 2 for single.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package asdbTurbo
 * @since asdbTurbo 1.0.0
 */

?>
<article id="post-<?php the_ID(); ?>" <?php post_class('entry-style-2'); ?>>
	<div class="entry-thumbnail">
			<?php if ( has_post_thumbnail() ): ?>
				<?php the_post_thumbnail('thumb-full'); ?>
			<?php elseif ( ot_get_option('placeholder') != 'off' ): ?>
				<img src="<?php echo get_template_directory_uri(); ?>/assets/images/no-thumb/thumb-medium.png" alt="<?php the_title(); ?>" />
			<?php endif; ?>
		<span class="entry-category"><?php the_category(' / '); ?></span>
		<h1 class="entry-title">
			<?php the_title(); ?>
		</h1><!--/.post-title-->
	</div><!--/.post-thumbnail-->

	<div class="entry-meta">
		<span class="entry-date"><i class="fa fa-calendar"></i><?php the_time('j M, Y'); ?></span>
		<?php if(function_exists('fresh_kap_views')) : ?> <span class="entry-views"><i class="fa fa-eye"></i><?php fresh_kap_views(); ?></span><?php endif; ?>
		<span class="entry-comments pull-right"><i class="fa fa-comments-o"></i><?php comments_number( '0', '1', '%' ); ?></span>
	</div><!--/.post-meta-->

        <?php if ( is_single() && (ot_get_option('sharrre') != 'off') ) :  ?>
        <?php echo asdb_share(); ?>
        <?php endif; ?>

	<div class="entry-content">
		<?php the_content(); ?>
	</div><!--/.entry-->
</article><!--/.post-->