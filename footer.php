<?php
/**
 * The template for displaying the footer.
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package asdbTurbo
 * @since asdbTurbo 1.0.0
 */

?>

	</div><!-- #content -->
	<?php if ( function_exists('wds_page_builder_area') ): ?>
		<?php wds_page_builder_area('footer'); ?>
	<?php endif; ?>
	<footer id="footer" class="site-footer">
			<?php if (ot_get_option('footer-ads')=='on' ) { get_template_part('parts/footer/footer-ads');} ?>
			<?php get_template_part('parts/footer-style-1'); ?>
	</footer><!-- #footer -->

</div><!-- #page -->

<?php wp_footer(); ?>

<?php if ( ot_get_option('boxed') != 'off'): ?>
</div><!--/#boxed-->
<?php endif; ?>

</body>
</html>
