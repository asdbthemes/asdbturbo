<section class="page-header-base">
	<div class="page-title-base">

	<?php if ( is_home() ) : ?>
		<h2><?php echo asdb_blog_title(); ?></h2>

	<?php elseif ( is_page() ): ?>
		<h2><?php echo asdb_page_title(); ?></h2>

	<?php elseif ( is_search() ): ?>
		<h1>
			<?php if ( have_posts() ): ?><i class="fa fa-search"></i><?php endif; ?>
			<?php if ( !have_posts() ): ?><i class="fa fa-exclamation-circle"></i><?php endif; ?>
			<?php $search_results=$wp_query->found_posts;
				if ($search_results==1) {
					echo $search_results.' '.__('Search result','asdbturbo');
				} else {
					echo $search_results.' '.__('Search results','asdbturbo');
				}
			?>
		</h1>

	<?php elseif ( is_404() ): ?>
		<h1><i class="fa fa-exclamation-circle"></i>&nbsp;<?php _e('Error 404.','asdbturbo'); ?> <span><?php _e('Page not found!','asdbturbo'); ?></span></h1>

	<?php elseif ( is_author() ): ?>
		<?php $author = get_userdata( get_query_var('author') );?>
		<h1><i class="fa fa-user"></i>&nbsp;<?php _e('Author:','asdbturbo'); ?> <span><?php echo $author->display_name;?></span></h1>

	<?php elseif ( is_category() ): ?>
		<h1><i class="fa fa-folder-open"></i>&nbsp;<?php _e('Category:','asdbturbo'); ?> <span><?php echo single_cat_title('', false); ?></span></h1>

	<?php elseif ( is_tag() ): ?>
		<h1><i class="fa fa-tags"></i>&nbsp;<?php _e('Tagged:','asdbturbo'); ?> <span><?php echo single_tag_title('', false); ?></span></h1>

	<?php elseif ( is_day() ): ?>
		<h1><i class="fa fa-calendar"></i>&nbsp;<?php _e('Daily Archive:','asdbturbo'); ?> <span><?php echo get_the_time('F j, Y'); ?></span></h1>

	<?php elseif ( is_month() ): ?>
		<h1><i class="fa fa-calendar"></i>&nbsp;<?php _e('Monthly Archive:','asdbturbo'); ?> <span><?php echo get_the_time('F Y'); ?></span></h1>

	<?php elseif ( is_year() ): ?>
		<h1><i class="fa fa-calendar"></i>&nbsp;<?php _e('Yearly Archive:','asdbturbo'); ?> <span><?php echo get_the_time('Y'); ?></span></h1>




	<?php elseif ( is_single() ): ?>
	        <div class="medium-8">
	        <h2 class="page-header"><?php the_title(); ?></h2>
	        </div>
		    <div class="medium-4">
        		<span class="pull-left">
		<ul class="meta-single group">
			<li class="category"><i class="fa fa-folder-open"></i>&nbsp; <?php the_category(' <span>/</span> '); ?></li>
			<?php if ( comments_open() && ( ot_get_option( 'comment-count' ) != 'off' ) ): ?>
			<li class="comments"><a href="<?php comments_link(); ?>"><i class="fa fa-comments-o"></i>&nbsp; <?php comments_number( '0', '1', '%' ); ?></a></li>
			<?php endif; ?>
		</ul>
        		</span>
    		</div>

	<?php elseif ( is_woocommerce() ): ?>

		<h2 class="page-title"><?php woocommerce_page_title(); ?></h2>

	<?php else: ?>

		<h2><?php the_title(); ?></h1>

	<?php endif; ?>

	</div><!--/.page-title-->
</section><!--/.sub-header-->
