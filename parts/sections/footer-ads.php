<?php $footerads = ot_get_option('footer-ads-sidebar'); ?>
<?php if ($footerads) : ?>
<section class="footer-ads">
	<div class="wrap">
		<?php dynamic_sidebar( $footerads ); ?>
	</div><!-- .wrap -->
</section>
<?php endif; ?>