<?php
/*
  ------------------------------------------------------------------------- *
 *  Dynamic styles
/* ------------------------------------------------------------------------- */

/*  Google fonts
/* ------------------------------------ */
if ( ! function_exists( 'wpb_google_fonts' ) ) {

	function wpb_google_fonts() {
//	exec_time();
	$gfont = new WPB_Gfonts();
	echo '<link rel="stylesheet" href="'.$gfont->get_google_fonts().'" type="text/css" media="all" />'. "\n";
//	echo exec_time('end');
	}
}

// wp_register_style( 'asdbstart-google-font', asdb__font_url(), array(), null );
// Enqueue styles.
// wp_enqueue_style( 'asdbstart-google-font' );


add_action( 'wp_head', 'wpb_google_fonts', 2 );


/*
   Convert hexadecimal to rgb
/* ------------------------------------ */
if ( ! function_exists( 'asdb_hex2rgb' ) ) {

	function asdb_hex2rgb( $hex, $array = false ) {
		$hex = str_replace('#', '', $hex);

		if ( strlen($hex) == 3 ) {
			$r = hexdec(substr($hex,0,1).substr($hex,0,1));
			$g = hexdec(substr($hex,1,1).substr($hex,1,1));
			$b = hexdec(substr($hex,2,1).substr($hex,2,1));
		} else {
			$r = hexdec(substr($hex,0,2));
			$g = hexdec(substr($hex,2,2));
			$b = hexdec(substr($hex,4,2));
		}

		$rgb = array( $r, $g, $b );
		if ( ! $array ) { $rgb = implode(',', $rgb); }
		return $rgb;
	}
}



/*
   Dynamic css output
/* ------------------------------------ */
if ( ! function_exists( 'asdb_dynamic_css' ) ) {

	function asdb_dynamic_css() {
		if ( ot_get_option('dynamic-styles') != 'off' ) {
		    $gfont = new WPB_Gfonts();
			// rgb values
			$color_1 = ot_get_option('color-1');
			$color_1_rgb = asdb_hex2rgb($color_1);
			$color_accent = ot_get_option('color_accent');
			$color_accent_rgb = asdb_hex2rgb($color_accent);
			$color_primary = ot_get_option('color_primary');
			$color_primary_rgb = asdb_hex2rgb($color_primary);
			$color_secondary = ot_get_option('color_secondary');
			$color_secondary_rgb = asdb_hex2rgb($color_secondary);

			// start output
			$styles = '<style type="text/css">'."\n";
			$styles .= '/* Dynamic CSS: For no styles in head, copy and put the css below in your custom.css or child theme\'s style.css, disable dynamic styles */'."\n";
			// Fonts
			$styles .= 'body { font-family: '.$gfont->get_google_fonts_family( ot_get_option( 'font-body' ) ).', Arial; }'."\n";
			$styles .= 'h1, h2, h3, h4, h5, h6, .post-title, .entry-title { font-family: '.$gfont->get_google_fonts_family( ot_get_option( 'font-head' ) ).', Georgia; }'."\n";
			$styles .= 'p.post-byline, div.sharrre-container span, .post-meta,.kama_breadcrumbs,.nav-container,.entry-meta { font-family: '.$gfont->get_google_fonts_family( ot_get_option( 'font-meta' ) ).', Arial; }'."\n";
			// container width
			if ( ot_get_option('container-width') !== '1200' ) {
				if ( ot_get_option( 'boxed' ) === 'on') {
					$styles .= '#boxed { max-width: '.ot_get_option('container-width').'px; margin:0 auto;}'."\n";
					$styles .= '#boxed #page { max-width: '.ot_get_option('container-width').'px; }'."\n";
//					$styles .= '#boxed .row { max-width: '.ot_get_option('container-width').'px; }'."\n";
//					$styles .= '#boxed .row .container-inner { max-width: '.ot_get_option('container-width').'px; }'."\n";
				} else {
//   					$styles .= '#page { max-width: '.ot_get_option('container-width').'px; }'."\n";
					//$styles .= '.row { max-width: '.ot_get_option('container-width').'px; }'."\n";
					$styles .= '.container-inner { max-width: '.ot_get_option('container-width').'px; }'."\n";
				}
			}
			// header logo max-height
//			if ( ot_get_option('logo-max-height') != '60' ) {
//				$styles .= '.site-title a img { max-height: '.ot_get_option('logo-max-height').'px; }'."\n";
//			}
			// image border radius
			if ( ot_get_option('image-border-radius') != '0' ) {
				$styles .= 'img { -webkit-border-radius: '.ot_get_option('image-border-radius').'px; border-radius: '.ot_get_option('image-border-radius').'px; }'."\n";
			}

			// Color Accent
			if ( $color_accent != '#e31e24' ) {
			$styles .= 'a { color: '.$color_accent.'; }'."\n";
			$styles .= '.mod5 .item-details { border-color: '.$color_accent.'; }'."\n";
			$styles .= '.home .home-icon.front_page_on,.asdbslider .meta-category a, .menu>li.current-menu-item>a:before, .menu>li.current-menu-parent>a:before, .menu>li.current_page_ancestor>a:before, .menu>li.current_page_parent>a:before, .menu>li.current-menu-item:hover li:hover a, .menu>li.current-menu-item a, .menu>li.current-menu-parent>a, .menu li:hover>a { background: '.$color_accent.'; color: #fff;}'."\n";
			$styles .= '.button, button, input[type=button], input[type=reset], input[type=submit] { background-color: '.$color_accent.'; }'."\n";
			$styles .= '.button, button, input[type=button], input[type=reset], input[type=submit], .tagcloud a, ul.child-cats li, .tags a { border: 1px solid '.$color_accent.'; }'."\n";
			$styles .= '#site-navigation { border-bottom: 5px solid '.$color_accent.'; }'."\n";
			$styles .= '.cat-style-2 .entry-category a,.cat-style-3 .entry-category a,.cat-style-4 .entry-category a { background: '.$color_accent.';}'."\n";
			$styles .= '.block-title, .footer-wrapper, .mod4 .entry-title, .page-header .page-title, .single .entry-header .entry-title, .widget-title, ul.child-cats li { border-bottom: 1px solid '.$color_accent.'; }'."\n";
			$styles .= '.block-title:before, .mod4 .entry-title:before, .page-header .page-title:before, .single .entry-header .entry-title:before, .widget-title:before {border-bottom: 6px solid '.$color_accent.'; }'."\n";
			$styles .= '.subfooter { border-top: 1px solid '.$color_accent.'; }'."\n";
			$styles .= '.button:focus, .button:hover, button:focus, button:hover, input[type=button]:focus, input[type=button]:hover, input[type=reset]:focus, input[type=reset]:hover, input[type=submit]:focus, input[type=submit]:hover { background: '.$color_accent.' url(/assets/images/opacity-10.png) repeat; }'."\n";
			$styles .= '.mmenu-wrap { border-top: 5px solid '.$color_accent.'; border-bottom: 5px solid '.$color_accent.';}'."\n";
			$styles .= ' a:hover,.cat-style-1 .entry-title a:hover,.cat-style-2 .entry-title a:hover .cat-style-3 .entry-title a:hover,.cat-style-4 .entry-title a:hover {color: rgba('.$color_accent_rgb.', .8);}'."\n";

			}
			if ( $color_primary != '#2d2d2d' ) {
			$styles .= '.subfooter,#site-navigation,.menu.dropdown,.menu.dropdown ul { background: '.$color_primary.';}'."\n";
			$styles .= '.footer-widget-area { background: rgba('.$color_primary_rgb.', 0.8 );}'."\n";
			}
			if ( $color_secondary != '#fafafa' ) {
			$styles .= '.home .home-icon.front_page_on, .asdbslider .meta-category a, .menu>li.current-menu-item>a:before, .menu>li.current-menu-parent>a:before, .menu>li.current_page_ancestor>a:before, .menu>li.current_page_parent>a:before, .menu>li.current-menu-item:hover li:hover a, .menu>li.current-menu-item a, .menu>li.current-menu-parent>a, .menu li:hover>a { color: rgb('.$color_secondary_rgb.');}'."\n";
			$styles .= '.menu a,.home-icon .fa,ul li.menu-item-has-children:after { color: rgba('.$color_secondary_rgb.', 0.8);}'."\n";
			}

			// body background
			/* if ( ot_get_option('site-background') != '' ) {

				$body_background = ot_get_option('site-background');
				$body_color = $body_background['background-color'];
				$body_image = $body_background['background-image'];
				$body_position = $body_background['background-position'];
				$body_attachment = $body_background['background-attachment'];
				$body_repeat = $body_background['background-repeat'];
				$body_size = $body_background['background-size'];

				if ( $body_image && $body_size == '' ) {
					$styles .= 'body { background: '.$body_color.' url('.$body_image.') '.$body_attachment.' '.$body_position.' '.$body_repeat.'; }'."\n";
				} elseif ( $body_image && $body_size != '' ) {
					$styles .= 'body { background: '.$body_color.' url('.$body_image.') '.$body_attachment.' '.$body_position.' '.$body_repeat.'; background-size: '.$body_size.'; }'."\n";
				} elseif ( $body_background['background-color'] ) {
					$styles .= 'body { background-color: '.$body_color.'; }'."\n";
				} else {
					$styles .= '';
				}
			} */

			$styles .= '</style>'."\n";
			// end output
			echo $styles;
		}
	}
}
add_action( 'wp_head', 'asdb_dynamic_css', 100 );
