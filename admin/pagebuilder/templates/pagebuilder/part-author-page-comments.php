<?php
/**
 * More From This Author
 *
 * This template part displays a list of posts by this author.
 */

$user_id = get_queried_object()->post_author;
?>

<aside class="part-author-more-grid widget">
    <div class="wrap">
        <h4 class="block-title"><i class="fa fa-user"></i>&nbsp;<?php _e( 'More From This Author', 'asdbturbo' ); ?></h4>

		<?php
            $paged = ( get_query_var( 'paged' ) ) ? get_query_var( 'paged' ) : 1;


            $pst = new WP_Query( array(
                'post_type'      => array( 'post' ),
                'posts_per_page' => 3,
                'post_status'    => 'publish',
                'author'         => $user_id,
                'paged'          => $paged
            ) );
        ?>


<?php if ( $pst->have_posts() ) :  ?>

	<?php $i = 1; echo '<div class="row">'; while ( $pst->have_posts() ) : $pst->the_post(); ?>
	<div class="post-hover columns medium-4">
		<article class="has-post-thumbnail related-single hentry">
			<div class="entry-thumbnail">
				<a href="<?php the_permalink(); ?>" title="<?php the_title(); ?>">
					<?php if ( has_post_thumbnail() ) :  ?>
						<?php the_post_thumbnail('thumb-300'); ?>
					<?php elseif ( ot_get_option('placeholder') != 'off' ) :  ?>
						<img src="<?php echo get_template_directory_uri(); ?>/assets/images/no-thumb/thumb-folio.png" alt="<?php the_title(); ?>" />
					<?php endif; ?>
				</a>
			</div><!--/.post-thumbnail-->
			<div class="entry">
				<h4>
					<a href="<?php the_permalink(); ?>" rel="bookmark" title="<?php the_title(); ?>"><?php the_title(); ?></a>
				</h4><!--/.post-title-->
			</div><!--/.related-inner-->
		</article>
	</div><!--/.related-->
	<?php if ($i % 3 == 0 ) { echo '</div><div class="row">'; } $i++; endwhile; echo '</div>'; ?>
	<?php wp_reset_postdata(); ?>

<?php endif; ?>
<?php wp_reset_query(); ?>



    </div><!-- .wrap -->
</aside><!-- .part-author-more-grid .widget -->