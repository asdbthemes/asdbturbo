<section class="site-branding">
	<div class="site-logo">
		<?php echo wpb_site_title(); ?>
		<?php if ( ot_get_option('site-description') != 'off' ): ?><p class="site-description"><?php bloginfo( 'description' ); ?></p><?php endif; ?>
	</div>
	<div class="header-widget">
		<?php dynamic_sidebar( 'header' ); ?>
	</div>
	<div class="header-rekl">
		<?php dynamic_sidebar( 'header-rekl' ); ?>
	</div>
</section>
