<?php // ?>
<article class="post">
	   <div class="post-hover group">
	<header class="entry-header">
	<div class="post-thumbnail">
			<a href="<?php the_permalink(); ?>" title="<?php the_title(); ?>">
				<?php if ( has_post_thumbnail() ) :  ?>
					<?php the_post_thumbnail('thumb-folio'); ?>
				<?php else : ?>
					<img src="<?php echo get_template_directory_uri(); ?>/assets/images/thumb-medium.png" alt="<?php the_title(); ?>" />
				<?php endif; ?>
				<?php if ( has_post_format('video') && ! is_sticky() ) { echo'<span class="thumb-icon small"><i class="fa fa-play"></i></span>'; } ?>
				<?php if ( has_post_format('audio') && ! is_sticky() ) { echo'<span class="thumb-icon small"><i class="fa fa-volume-up"></i></span>'; } ?>
				<?php if ( is_sticky() ) { echo'<span class="thumb-icon small"><i class="fa fa-star"></i></span>'; } ?>
			</a>
	</div>
	</header>
		<div class="entry-content">
	    <h6 class="post-title"><a href="<?php the_permalink(); ?>" rel="bookmark" title="<?php the_title(); ?>"><?php the_title(); ?></a></h6>
		<div class="entry-meta">
			<i class="fa fa-calendar"></i>&nbsp;<time class="entry-date"><?php the_time('j.m.Y'); ?></time>&nbsp;&nbsp;
			<i class="fa fa-folder-open"></i>&nbsp;<span class="post-item-category"><?php the_category(' / '); ?></span>
		</div>
			<div class="entry excerpt">
				<?php echo get_blocks_excerpt(18);?>
			</div>
		</div>

	</div>
</article>
