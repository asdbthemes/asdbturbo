<?php
/**
 * The template for displaying standard content
 *
 * @package asdbTurbo
 * @since asdbTurbo 1.0.0
 */

global $meta;
 ?>
<article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
    <header class="entry-header">
        <?php asdb_get_thumb( 'thumb-8col'); ?>

        <?php if ( is_single() ) { ?>
		<?php if( get_post_meta( $post->ID, '_parallax', true )=='on' || get_post_meta( $post->ID, '_hero', true )=='on' ) : ?>
		<!--Parallax OR Hero-->
		<?php else : ?>
		<h1 class="entry-title"><?php the_title();?></h1>
        <?php endif; ?>
        <?php } else { ?>
        <h2 class="entry-title">
            <a href="<?php the_permalink(); ?>" rel="bookmark"><?php the_title(); ?></a>
            <?php if ( is_sticky() && is_home() && ! is_paged() ) { ?>
            <sup class="featured-post"><?php _e( 'Sticky', 'asdbflat' ) ?></sup>
            <?php } ?>
        </h2>
        <?php } //.entry-title ?>

		<?php //asdb_entry_meta(); ?>
		<?php asdb__posted_on(); ?>
        <?php if ( is_single() && (ot_get_option('sharrre') != 'off') ) :  ?>
        <?php //echo asdb_share(); ?>
        <?php endif; ?>

    </header><!--/.entry-header -->
	<?php do_action( 'asdb_post_before_entry_content' ); ?>
    <?php if ( is_search() ) { ?>
    <div class="entry-summary">
        <?php //kama_excerpt(); ?>
    </div>
    <?php } else { ?>
    <div class="entry-content">
        <?php if ( is_archive() ) { kama_excerpt(); } else { the_content( __( 'Continue reading <span class="meta-nav">&rarr;</span>', 'asdbflat' ) ); } ?>
    </div>
    <?php } //.entry-content ?>
    	<?php do_action( 'asdb_post_after_entry_content' ); ?>
    <footer>
        <?php asdb_link_pages(); ?>
        <?php $tag = get_the_tags(); if ( $tag ) { ?><p class="tags"><?php the_tags('<span>'.__('Tags: ','asdbstart').'</span>',' ',''); ?></p><?php } ?>
    </footer>

</article><!--/#post-->

<?php if ( is_single() && get_the_author_meta( 'description' ) && is_multi_author() ) { ?>
<?php //get_template_part( 'author-bio' ); ?>
<?php } ?>