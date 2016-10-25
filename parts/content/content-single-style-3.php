<?php
/**
 * Template part for displaying content style 3 for single.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package asdbTurbo
 * @since asdbTurbo 1.0.0
 */

?>
<article id="post-<?php the_ID(); ?>" <?php post_class('entry-style-3'); ?>>

	<h1 class="entry-title">
		<?php the_title(); ?>
	</h1><!--/.post-title-->

	<div class="entry-meta">
		<span class="entry-date"><i class="fa fa-calendar"></i><?php the_time('j M, Y'); ?></span>
		<span class="entry-category"><i class="fa fa-folder-open"></i><?php the_category(' / '); ?></span>
		<?php if(function_exists('fresh_kap_views')) : ?> <span class="entry-views"><i class="fa fa-eye"></i><?php fresh_kap_views(); ?></span><?php endif; ?>
   		<span class="entry-comments pull-right"><i class="fa fa-comments-o"></i><?php comments_number( '0', '1', '%' ); ?></span>
	</div><!--/.post-meta-->

        <?php if ( is_single() && (ot_get_option('sharrre') != 'off') ) :  ?>
        <?php echo asdb_share(); ?>
        <?php endif; ?>

	<div class="entry-content">
		<?php asdb_get_thumb( 'thumb-300'); ?>
		<?php the_content(); ?>
	</div><!--/.entry-->

</article><!--/.post-->