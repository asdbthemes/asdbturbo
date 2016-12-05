<?php

function remove_script_version($src) {
  if ( strpos( $src, 'fonts.googleapis.com/css' ) ) return $src;
  return $src ? esc_url(remove_query_arg('ver', $src)) : false;
}
//add_filter('script_loader_src', 'remove_script_version', 99, 1);
//add_filter('style_loader_src', 'remove_script_version', 99, 1);

function _remove_script_version( $src ){
	if ( strpos( $src, 'fonts.googleapis.com/css' ) ) return $src;
	$parts = explode( '?', $src );
	return $parts[0];
}

add_filter( 'script_loader_src', '_remove_script_version', 99, 1 );
add_filter( 'style_loader_src', '_remove_script_version', 99, 1 );


if ( ! function_exists( 'add_defer_to_cf7' ) )
{
	function add_defer_to_cf7( $url )
	{
	    if( is_admin() ) return $url;
	    if ( strpos( $url, 'jquery.js' ) ) return $url;
	    if ( // comment the following line out add 'defer' to all scripts
	    //FALSE === strpos( $url, 'contact-form-7' ) or
	    FALSE === strpos( $url, '.js' )
	    )
	    { // not our file
	        return $url;
	    }
	    // Must be a ', not "!
	return "$url' defer='defer";
	}
	add_filter( 'clean_url', 'add_defer_to_cf7', 15, 1 );
}




/**
 * Clean up WordPress defaults
 *
 * @package asdbbase
 * @since asdbbase 1.0.0
 */

if ( ! function_exists( 'asdbbase_start_cleanup' ) ) :
function asdbbase_start_cleanup() {

	// Launching operation cleanup.
	add_action( 'init', 'asdbbase_cleanup_head' );

	// Remove WP version from RSS.
	add_filter( 'the_generator', 'asdbbase_remove_rss_version' );

	// Remove pesky injected css for recent comments widget.
	add_filter( 'wp_head', 'asdbbase_remove_wp_widget_recent_comments_style', 1 );

	// Clean up comment styles in the head.
	add_action( 'wp_head', 'asdbbase_remove_recent_comments_style', 1 );

}
add_action( 'after_setup_theme','asdbbase_start_cleanup' );
endif;
/**
 * Clean up head.+
 * ----------------------------------------------------------------------------
 */

if ( ! function_exists( 'asdbbase_cleanup_head' ) ) :
function asdbbase_cleanup_head() {

	// EditURI link.
	remove_action( 'wp_head', 'rsd_link' );

	// Category feed links.
	remove_action( 'wp_head', 'feed_links_extra', 3 );

	// Post and comment feed links.
	remove_action( 'wp_head', 'feed_links', 2 );

	// Windows Live Writer.
	remove_action( 'wp_head', 'wlwmanifest_link' );

	// Index link.
	remove_action( 'wp_head', 'index_rel_link' );

	// Previous link.
	remove_action( 'wp_head', 'parent_post_rel_link', 10, 0 );

	// Start link.
	remove_action( 'wp_head', 'start_post_rel_link', 10, 0 );

	// Canonical.
//	remove_action( 'wp_head', 'rel_canonical', 10, 0 );

	// Shortlink.
	remove_action( 'wp_head', 'wp_shortlink_wp_head', 10, 0 );

	// Links for adjacent posts.
	remove_action( 'wp_head', 'adjacent_posts_rel_link_wp_head', 10, 0 );

	// WP version.
	remove_action( 'wp_head', 'wp_generator' );

	// Emoji detection script.
	remove_action( 'wp_head', 'print_emoji_detection_script', 7 );

	// Emoji styles.
	remove_action( 'wp_print_styles', 'print_emoji_styles' );
}
endif;

// Remove WP version from RSS.
if ( ! function_exists( 'asdbbase_remove_rss_version' ) ) :
function asdbbase_remove_rss_version() { return ''; }
endif;

// Remove injected CSS for recent comments widget.
if ( ! function_exists( 'asdbbase_remove_wp_widget_recent_comments_style' ) ) :
function asdbbase_remove_wp_widget_recent_comments_style() {
	if ( has_filter( 'wp_head', 'wp_widget_recent_comments_style' ) ) {
	  remove_filter( 'wp_head', 'wp_widget_recent_comments_style' );
	}
}
endif;

// Remove injected CSS from recent comments widget.
if ( ! function_exists( 'asdbbase_remove_recent_comments_style' ) ) :
function asdbbase_remove_recent_comments_style() {
	global $wp_widget_factory;
	if ( isset($wp_widget_factory->widgets['WP_Widget_Recent_Comments']) ) {
	remove_action( 'wp_head', array($wp_widget_factory->widgets['WP_Widget_Recent_Comments'], 'recent_comments_style') );
	}
}
endif;


/**
 * Clean up output of stylesheet <link> tags
 */
function asdb_clean_style_tag( $input ) {
    preg_match_all("!<link rel='stylesheet'\s?(id='[^']+')?\s+href='(.*)' type='text/css' media='(.*)' />!", $input, $matches);
    // Only display media if it is meaningful
    $media = $matches[3][0] !== '' && $matches[3][0] !== 'all' ? ' media="' . $matches[3][0] . '"' : '';
    return '<link rel="stylesheet" href="' . $matches[2][0] . '"' . $media . '>' . "\n";
}
add_filter('style_loader_tag', 'asdb_clean_style_tag');


/**
 * Remove the id="" on nav menu items
 * Return 'menu-slug' for nav menu classes
 */
function asdb_nav_menu_css_class($classes, $item) {
//	$slug = sanitize_title($item->title);
	$slug = sanitize_title($item->ID);
	$classes = preg_replace('/(current(-menu-|[-_]page[-_])(item|parent|ancestor))/', 'active', $classes);
	$classes = preg_replace('/^((menu|page)[-_\w+]+)+/', '', $classes);

	$classes[] = 'menu-' . $slug;

	$classes = array_unique($classes);
    //return array_filter($classes, 'is_element_empty');
	return $classes;
}
//add_filter('nav_menu_css_class', 'asdb_nav_menu_css_class', 10, 2);
//add_filter('nav_menu_item_id', '__return_null');


/**
 * Remove unnecessary self-closing tags
 */
function remove_self_closing_tags($input) {
  return str_replace(' />', '>', $input);
}
add_filter('get_avatar', 'remove_self_closing_tags'); // <img />
add_filter('comment_id_fields', 'remove_self_closing_tags'); // <input />
add_filter('post_thumbnail_html', 'remove_self_closing_tags'); // <img />


/**
 * Wrap embedded media as suggested by Readability
 *
 * @link https://gist.github.com/965956
 * @link http://www.readability.com/publishers/guidelines#publisher
 */
function embed_wrap($cache) {
  return '<div class="entry-content-asset">' . $cache . '</div>';
}
add_filter('embed_oembed_html', 'embed_wrap');



/**
 * Add and remove body_class() classes
 */
function asdb_body_class_modify($classes) {
    // Add post/page slug if not present
	if (is_single() || is_page() && !is_front_page()) {
		if (!in_array(basename(get_permalink()), $classes)) {
			$classes[] = basename(get_permalink());
		}
	}

  // Remove unnecessary classes
  $home_id_class = 'page-id-' . get_option('page_on_front');
  $remove_classes = array(
    'page-template-default',
    $home_id_class
  );
  $classes = array_diff($classes, $remove_classes);

  return $classes;
}
add_filter('body_class', 'asdb_body_class_modify');


/**
 * Clean up language_attributes() used in <html> tag
 *
 * Remove dir="ltr"
 */
function asdb_language_attributes() {
  $attributes = array();

  if (is_rtl()) {
    $attributes[] = 'dir="rtl"';
  }

  $lang = get_bloginfo('language');

  if ($lang) {
    $attributes[] = "lang=\"$lang\"";
  }

  $output = implode(' ', $attributes);
  $output = apply_filters('asdb_language_attributes', $output);

  return $output;
}
add_filter('language_attributes', 'asdb_language_attributes');



/**
 * Redirects search results from /?s=query to /search/query/, converts %20 to +
 *
 * @link http://txfx.net/wordpress-plugins/nice-search/
 *
 */
function asdb_serch_redirect() {
  global $wp_rewrite;
  if (!isset($wp_rewrite) || !is_object($wp_rewrite) || !$wp_rewrite->get_search_permastruct()) {
    return;
  }

  $search_base = $wp_rewrite->search_base;
  if (is_search() && !is_admin() && strpos($_SERVER['REQUEST_URI'], "/{$search_base}/") === false && strpos($_SERVER['REQUEST_URI'], '&') === false) {
    wp_redirect(get_search_link());
    exit();
  }
}
add_action('template_redirect', 'asdb_serch_redirect');

function asdb_serch_rewrite($url) {
  return str_replace('/?s=', '/search/', $url);
}
add_filter('wpseo_json_ld_search_url', 'asdb_serch_rewrite');


/*  Clean plugins style
/* ------------------------------------ */
function asdb_deregister_styles() {
	wp_deregister_style( 'wp-pagenavi' );
	wp_deregister_style( 'contact-form-7' );
}
add_action( 'wp_print_styles', 'asdb_deregister_styles', 100 );

function asdb_deregister_scripts() {
	// wp_deregister_script( 'jquery-form' );
	// wp_deregister_script( 'contact-form-7' );
}
add_action( 'wp_print_scripts', 'asdb_deregister_scripts', 100 );
