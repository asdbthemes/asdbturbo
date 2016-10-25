<section class="footer-widget-area">
	<div class="wrap">
	<a id="back-to-top" href="#"><i class="icon icon-angle-up"></i></a>
	<div class="columns medium-4">
	<?php if ( ot_get_option('footer-logo') ) :  ?>
		<img id="footer-logo" src="<?php echo ot_get_option('footer-logo'); ?>" alt="<?php get_bloginfo('name'); ?>">
	<?php endif; ?>
	<?php dynamic_sidebar( 'footer-1' ); ?>
	</div>
	<div class="columns medium-4">
	<?php dynamic_sidebar( 'footer-2' ); ?>
	</div>
	<div class="columns medium-4">
	<?php dynamic_sidebar( 'footer-3' ); ?>
	</div>
	</div><!-- .wrap -->
</section>
