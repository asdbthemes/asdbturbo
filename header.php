<?php
/**
 * The header for our theme.
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package asdbTurbo
 * @since asdbTurbo 1.0.0
 */

?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<?php global $is_IE; if ( $is_IE ) : ?>
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
<?php endif; ?>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="profile" href="http://gmpg.org/xfn/11">
<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?> style="<?php echo _bgstyle(); ?>">
<?php if ( ot_get_option('boxed') != 'off'): ?>
<div id="boxed">
<?php endif; ?>
<div id="page" class="site">
	<a class="skip-link screen-reader-text" href="#main"><?php esc_html_e( 'Skip to content', 'asdbturbo' ); ?></a>

	<header id="header" class="site-header">
		<div class="wrap">
		    <?php get_template_part('parts/sections/site-branding'); ?>
			<?php get_template_part('parts/sections/nav-header'); ?>
			<?php asdb__do_mobile_navigation_menu(); ?>
		</div><!-- .wrap -->
	</header><!-- #header -->
	<?php if (!is_front_page()) { get_template_part( 'parts/sections/section-breadcrumbs');} ?>
	<div id="content" class="site-content">
