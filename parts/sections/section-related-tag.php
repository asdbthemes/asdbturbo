<section class="related related_tags">
<h4 class="block-title info"><span><i class="fa fa-newspaper-o">&nbsp;</i><?php _e( 'Related Posts', 'asdbturbo' ); ?></span></h4>

<?php $related = asdb_related_tags(); ?>
<?php if ( $related->have_posts() ) :  ?>

	<?php $i = 1; echo '<div class="row">'; while ( $related->have_posts() ) : $related->the_post(); ?>
	<div class="post-hover columns medium-3">
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
	<?php if ($i % 4 == 0 ) { echo '</div><div class="row">'; } $i++; endwhile; echo '</div>'; ?>
	<?php wp_reset_postdata(); ?>

<?php endif; ?>
<?php wp_reset_query(); ?>
</section><!--/.related_tags-->
