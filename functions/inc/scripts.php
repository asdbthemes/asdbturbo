<?php
/**
 * Custom scripts and styles.
 *
 * @package asdbTurbo
 */


/**
 * Enqueue scripts and styles.
 */
function asdb__scripts() {
	/**
	 * If WP is in script debug, or we pass ?script_debug in a URL - set debug to true.
	 */
	$script_debug = false;
	$debug = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG == true ) || ( isset( $_GET['script_debug'] ) ) || ( $script_debug == true ) ? true : false;

	/**
	 * If we are debugging the site, use a unique version every page load so as to ensure no cache issues.
	 */
	$version = '1.0.0';

	/**
	 * Should we load minified files?
	 */
	$suffix = ( true === $debug ) ? '' : '.min';

	// Enqueue styles.
	wp_enqueue_style( 'asdbturbo-style', get_stylesheet_directory_uri() . '/style' . $suffix . '.css', array(), $version );

	// Enqueue scripts.
	wp_enqueue_script( 'asdbturbo-scripts', get_template_directory_uri() . '/assets/js/project' . $suffix . '.js', array( 'jquery' ), $version, true );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}

	// Enqueue the mobile nav script
	// Since we're showing/hiding based on CSS and wp_is_mobile is wp_is_imperfect, enqueue this everywhere.
	//wp_enqueue_script( 'asdbturbo-mobile-nav', get_template_directory_uri() . '/assets/js/mobile-nav-menu' . $suffix . '.js', array( 'jquery' ), $version, true );
}
add_action( 'wp_enqueue_scripts', 'asdb__scripts' );

/**
 *  WP-PageNavi support - @devinsays (via GitHub)
 */
function asd_deregister_styles() {
	wp_deregister_style( 'wp-pagenavi' );
}
add_action( 'wp_print_styles', 'asd_deregister_styles', 100 );


/**
 * Add SVG definitions to footer.
 */
function asdb__include_svg_icons() {

	// Define SVG sprite file.
	$svg_icons = get_template_directory() . '/assets/images/svg-icons.svg';

	// If it exists, include it.
	if ( file_exists( $svg_icons ) ) {
		require_once( $svg_icons );
	}
}
add_action( 'wp_footer', 'asdb__include_svg_icons', 9999 );