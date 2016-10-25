<?php
/**
 * The template for displaying 404 pages (not found).
 *
 * @link https://codex.wordpress.org/Creating_an_Error_404_Page
 *
 * @package asdbTurbo
 * @since asdbTurbo 1.0.0
 */

get_header(); ?>

	<div class="wrap">
		<div class="primary-area content-area">
			<main id="main" class="site-main" role="main">

				<section class="error-404 not-found">
					<header class="page-header">
						<h1 class="page-title"><?php esc_html_e( 'Sorry, this page doesn\'t exist.', 'asdbturbo' ); ?></h1>
					</header><!-- .page-header -->

					<div class="page-content">

						<p><?php esc_html_e( 'It seems we can’t find what you’re looking for. Perhaps searching can help.', 'asdbturbo' ); ?></p>

						<?php get_search_form(); ?>

					</div><!-- .page-content -->
				</section><!-- .error-404 -->

			</main><!-- #main -->
		</div><!-- .primary -->

	</div><!-- .wrap -->

<?php get_footer(); ?>