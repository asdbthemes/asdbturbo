<?php
/**
 * Template part for displaying content style 1.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package asdbStart
 */

?>
<article id="post-<?php the_ID(); ?>" <?php post_class('cat-style-1'); ?>>

	<?php //asdb_get_thumb( 'thumb-medium'); ?>

	<h2 class="entry-title">
		<a href="<?php the_permalink(); ?>" rel="bookmark" title="<?php the_title(); ?>"><?php the_title(); ?></a>
	</h2><!--/.post-title-->

	<div class="entry-meta">
		<span class="entry-date"><i class="fa fa-calendar"></i><?php the_time('j M, Y'); ?></span>
		<span class="entry-category"><i class="fa fa-folder-open"></i><?php the_category(' / '); ?></span>
		<?php if(function_exists('kap_views')) : ?><span class="entry-views"><i class="fa fa-eye"></i><?php kap_views(); ?></span><?php endif; ?>
		<span class="entry-comments pull-right"><i class="fa fa-comments-o"></i><?php comments_number( '0', '1', '%' ); ?></span>
	</div><!--/.post-meta-->

	<div class="entry-content excerpt">
		<?php the_excerpt(); ?>
	</div><!--/.entry-->

</article><!--/.post-->