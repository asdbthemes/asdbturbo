<section class="footer-widget-area">
	<div class="wrap">
	<div class="columns medium-3">
	<?php if ( ot_get_option( 'footer-logo' ) ) :  ?>
		<img id="footer-logo" src="<?php echo ot_get_option( 'footer-logo' ); ?>" alt="<?php get_bloginfo( 'name' ); ?>">
	<?php endif; ?>
	</div>
	<div class="columns medium-3">
	<?php dynamic_sidebar( 'footer-1' ); ?>
	</div>
	<div class="columns medium-3">
	<?php dynamic_sidebar( 'footer-2' ); ?>
	</div>
	<div class="columns medium-3">
	<?php dynamic_sidebar( 'footer-3' ); ?>
	</div>
	</div><!-- .wrap -->
</section>
