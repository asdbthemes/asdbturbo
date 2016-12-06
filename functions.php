<?php
/**
 * asdbTurbo functions and definitions.
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package asdbTurbo
 * @since asdbTurbo 1.0.0
 */



/* ------------------------------------------------------------------------- *
 *  OptionTree framework integration: Use in theme mode
/* ------------------------------------------------------------------------- */

  add_filter( 'ot_show_pages', '__return_false' );
  add_filter( 'ot_show_new_layout', '__return_false' );
  add_filter( 'ot_theme_mode', '__return_true' );
  include( get_template_directory() . '/option-tree/ot-loader.php' );
  include( get_template_directory() . '/functions/class-asdb-taxmeta-for-ot.php' );
  include( get_template_directory() . '/functions/class-wpb-gfonts.php' );


/* ------------------------------------------------------------------------- *
 *  Load theme options
/* ------------------------------------------------------------------------- */

add_action( 'after_setup_theme', 'asdb_load' );
if ( ! function_exists( 'asdb_load' ) ) {
  function asdb_load() {
    // Load theme options and meta boxes
    include( get_template_directory() . '/functions/theme-options.php' );
    include( get_template_directory() . '/functions/meta-boxes.php' );

    // Load custom shortcodes
    include( get_template_directory() . '/functions/shortcodes.php' );

    // Load dynamic styles
    include( get_template_directory() . '/functions/dynamic-styles.php' );

    //include( get_template_directory() . '/functions/class-page-builder-fields.php' );

    // Load TGM plugin activation
    include( get_template_directory() . '/functions/class-tgm-plugin-activation.php' );

		if (ot_get_option('breadcrumbs')!='off' && ot_get_option('crumbstype')==1) {
    require get_template_directory() . '/functions/inc/kama_breadcrumbs.php'; }
		if (ot_get_option('postviews')!='off') {
	require get_template_directory() . '/functions/inc/kap/kama-postviews.php'; }

	require get_template_directory() . '/admin/init.php';

  }
}

if ( ! function_exists( 'asdb__setup' ) ) :
/**
 * Sets up theme defaults and registers support for various WordPress features.
 *
 * Note that this function is hooked into the after_setup_theme hook, which
 * runs before the init hook. The init hook is too late for some features, such
 * as indicating support for post thumbnails.
 */
function asdb__setup() {
  /**
   * Make theme available for translation.
   * Translations can be filed in the /languages/ directory.
   * If you're building a theme based on asdbTurbo, use a find and replace
   * to change 'asdbturbo' to the name of your theme in all the template files.
   * You will also need to update the Gulpfile with the new text domain
   * and matching destination POT file.
   */
  load_theme_textdomain( 'asdbturbo', get_template_directory() . '/languages' );

  // Add default posts and comments RSS feed links to head.
  add_theme_support( 'automatic-feed-links' );

  /**
   * Let WordPress manage the document title.
   * By adding theme support, we declare that this theme does not use a
   * hard-coded <title> tag in the document head, and expect WordPress to
   * provide it for us.
   */
  add_theme_support( 'title-tag' );

  /**
   * Enable support for Post Thumbnails on posts and pages.
   *
   * @link https://developer.wordpress.org/themes/functionality/featured-images-post-thumbnails/
   */
  add_theme_support( 'post-thumbnails' );

  add_image_size( 'thumb-small'   , 120,  80, true );
  add_image_size( 'thumb-medium'  , 600,  300, true );
  add_image_size( 'thumb-full'    , 740,  400, true );
  add_image_size( 'thumb-300'     , 400,  300, true );
  add_image_size( 'thumb-slider'  , 680,  350, true );


  // This theme uses wp_nav_menu() in one location.
  register_nav_menus( array(
    'primary' => esc_html__( 'Primary Menu', 'asdbturbo' ),
    'mobile'  => esc_html__( 'Mobile Menu', 'asdbturbo' ),
  ) );

  /**
   * Switch default core markup for search form, comment form, and comments
   * to output valid HTML5.
   */
  add_theme_support( 'html5', array(
    'search-form',
    'comment-form',
    'comment-list',
    'gallery',
    'caption',
  ) );

// Set up the WordPress core custom background feature.
//  add_theme_support( 'custom-background', apply_filters( 'asdb__custom_background_args', array(
//    'default-color' => 'ffffff',
//    'default-image' => '',
//  ) ) );

// Add styles to the post editor
// add_editor_style( array( 'editor-style.css', asdb__font_url() ) );

}
endif; // asdb__setup
add_action( 'after_setup_theme', 'asdb__setup' );

/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 *
 * Priority 0 to make it available to lower priority callbacks.
 *
 * @global int $content_width
 */
function asdb__content_width() {
  $GLOBALS['content_width'] = apply_filters( 'asdb__content_width', 640 );
}
add_action( 'after_setup_theme', 'asdb__content_width', 0 );

/**
 * Register widget area.
 *
 * @link https://developer.wordpress.org/themes/functionality/sidebars/#registering-a-sidebar
 */
function asdb__widgets_init() {

  // Define sidebars
  $sidebars = array(
    'primary'		=> esc_html__( 'Primary Widget Area', 'asdbturbo' ),
    'secondary'		=> esc_html__( 'Secondary Widget Area', 'asdbturbo' ),
    'header'		=> esc_html__( 'Header Widget Area', 'asdbturbo' ),
    'header-rekl'	=> esc_html__( 'Header Ads  Widget Area', 'asdbturbo' ),
    'footer-1'		=> esc_html__( 'Footer 1', 'asdbturbo' ),
    'footer-2'		=> esc_html__( 'Footer 2', 'asdbturbo' ),
    'footer-3'		=> esc_html__( 'Footer 3', 'asdbturbo' ),
  );

  // Loop through each sidebar and register
  foreach ( $sidebars as $sidebar_id => $sidebar_name ) {
    register_sidebar( array(
      'name'          => $sidebar_name,
      'id'            => $sidebar_id,
      'description'   => sprintf ( esc_html__( 'Widget area for %s', 'asdbturbo' ), $sidebar_name ),
      'before_widget' => '<aside class="widget %2$s">',
      'after_widget'  => '</aside>',
      'before_title'  => '<h3 class="widget-title">',
      'after_title'   => '</h3>',
    ) );
  }

}
add_action( 'widgets_init', 'asdb__widgets_init' );


/**
 * Custom functions that act independently of the theme templates.
 */
require get_template_directory() . '/functions/inc/extras.php';
//require get_template_directory() . '/functions/inc/cleanup.php';
//require get_template_directory() . '/functions/inc/cleanup-admin.php';


/**
 * Load Jetpack compatibility file.
 */
//require get_template_directory() . '/inc/jetpack.php';

/**
 * Load styles and scripts.
 */
require get_template_directory() . '/functions/inc/scripts.php';

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/functions/inc/template-tags.php';
require get_template_directory() . '/functions/inc/woo.php';

//require get_template_directory() . '/functions/inc/asdb_tweaks.php';
require get_template_directory() . '/functions/inc/asdb_blocks.php';
//require get_template_directory() . '/functions/inc/asdb_prod_block.php';
require get_template_directory() . '/functions/inc/comments-walker.php';
require get_template_directory() . '/functions/inc/cleanup.php';
require get_template_directory() . '/functions/inc/cleanup-admin.php';
require get_template_directory() . '/functions/widgets/asdb-posts-new.php';
require get_template_directory() . '/functions/widgets/asdb-ad.php';
require get_template_directory() . '/functions/inc/cpt/custom-post-type.php';

/*  TGM plugin activation
/* ------------------------------------ */
if ( ! function_exists( 'asdb_plugins' ) ) {

	function asdb_plugins() {
		if ( ot_get_option('recommended-plugins') != 'off' ) {
			// Add the following plugins
			$plugins = array(
				array(
					'name' 				=> 'Regenerate Thumbnails',
					'slug' 				=> 'regenerate-thumbnails',
					'required'			=> false,
					'force_activation' 	=> false,
					'force_deactivation'=> false,
				),
				array(
					'name' 				=> 'WP-PageNavi',
					'slug' 				=> 'wp-pagenavi',
					'required'			=> false,
					'force_activation' 	=> false,
					'force_deactivation'=> false,
				),
				array(
					'name' 				=> 'Contact Form 7',
					'slug' 				=> 'contact-form-7',
					'required'			=> false,
					'force_activation' 	=> false,
					'force_deactivation'=> false,
				)
			);
			tgmpa( $plugins );
		}
	}

}
add_action( 'tgmpa_register', 'asdb_plugins' );

function exec_time( $phase = 'start' ){
	static $time_before, $collect;
	$n = 5;
	$t = explode(' ', microtime() );
	$time  = $t[1] . substr( $t[0], 1 );
	if( $phase != 'stop' && $time_before ){
		$difference = bcsub( $time, $time_before, $n );
		$collect    = bcadd( $difference, $collect, $n );
	}
	if( $phase == 'end' ) return $collect . ' sec.';
	else $time_before = $time;
}
