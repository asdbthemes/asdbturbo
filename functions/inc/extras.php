<?php
/**
 * Custom functions that act independently of the theme templates.
 *
 * Eventually, some of the functionality here could be replaced by core features.
 *
 * @package asdbTurbo
 */

/**
 * Adds custom classes to the array of body classes.
 *
 * @param array $classes Classes for the body element.
 * @return array
 */
function asdb__body_classes( $classes ) {

	global $is_IE;

	// If it's IE, add a class.
	if ( $is_IE ) {
		$classes[] = 'ie';
	}

	// Give all pages a unique class.
	if ( is_page() ) {
		$classes[] = 'page-' . basename( get_permalink() );
	}

	// Adds a class of hfeed to non-singular pages.
	if ( ! is_singular() ) {
		$classes[] = 'hfeed';
	}

	// Adds a class of group-blog to blogs with more than 1 published author.
	if ( is_multi_author() ) {
		$classes[] = 'group-blog';
	}

	// Are we on mobile?
	if ( wp_is_mobile() ) {
		$classes[] = 'mobile';
	}

	// Adds "no-js" class. If JS is enabled, this will be replaced (by javascript) to "js".
	$classes[] = 'no-js';

	return $classes;
}
add_filter( 'body_class', 'asdb__body_classes' );



function asdb_class( $args = '' ) {
		$layout = asdb_layout_class();
		$coloffset = '';
		$cat_class='';
		parse_str($args, $i);
		$class = isset($i['class']) ? trim($i['class']) : 'main';
		$cat_style = isset($i['cat_style']) ? trim($i['cat_style']) : null;
	if ($class == 'col' ) {
		$col = 'medium-12';
		if ( ( $layout == 'col-3cm' ) || ( $layout == 'col-3cl' ) || ( $layout == 'col-3cr' ) ) { $col = 'medium-6 columns'; }
		if ( ( $layout == 'col-2cl' ) || ( $layout == 'col-2cr' ) ) { $col = 'medium-8 columns'; }
		if ( $layout == 'col-3cm' ) { $coloffset = 'medium-push-3 '; }
		if ( $layout == 'col-2cr' ) { $coloffset = 'medium-push-4 '; }
		if ( $layout == 'col-3cr' ) { $coloffset = 'medium-push-6 '; }
		$out = $col . ' ' . $coloffset;
		}
	if ($class == 's1' ) {
	    if ( ( $layout == 'col-3cm' ) || ( $layout == 'col-3cl' ) || ( $layout == 'col-3cr' ) ) { $col = 'medium-3 columns'; }
	    if ( ( $layout == 'col-2cl' ) ||	( $layout == 'col-2cr' ) ) { $col = 'medium-4 columns'; }
	    if ( $layout == 'col-2cr' ) { $coloffset = 'medium-pull-8'; }
	    if ( $layout == 'col-3cm' ) { $coloffset = 'medium-pull-9 columns'; }
	    if ( $layout == 'col-3cr' ) { $coloffset = 'medium-pull-9 columns'; }
		$out = $col . ' ' . $coloffset;
		}
	if ($class == 's2' ) {
	    if ( ( $layout == 'col-3cm' ) || ( $layout == 'col-3cl' ) || ( $layout == 'col-3cr' ) ) { $col = 'medium-3 columns'; }
	    if ( $layout == 'col-3cr' ) { $coloffset = 'medium-pull-12'; }
		$out = $col . ' ' . $coloffset;
		}
	if ($cat_style) {
		$qobj = get_queried_object();
		$col = ot_get_option('blog-columns');
		$cat_col = get_term_meta( $qobj->term_id, 'cat_col',true );
		$cat_style = get_term_meta( $qobj->term_id, 'cat_style',true )?get_term_meta( $qobj->term_id, 'cat_style',true ):'style-1';
		$fslider = get_term_meta( $qobj->term_id, 'fslider',true )?get_term_meta( $qobj->term_id, 'fslider',true ):'0';
		$columns=$col;
		$cat_class = $cat_style;
		if ($cat_col>0) {$columns=$cat_col;}
		if ($columns>1) {$cat_class .= ' multi-columns';} else { $cat_class .=' one-column'; }
		if ($fslider>0) {$cat_class .= ' featured-slider'; }
		}
		$out .= $cat_class;

	return $out;
}

/*
   Layout class
/* ------------------------------------ */
if ( ! function_exists( 'asdb_layout_class' ) ) {

	function asdb_layout_class() {
		// Default layout
		$layout = 'col-3cm';
		$default = 'col-3cm';

		// Check for page/post specific layout
		if ( is_page() || is_single() ) {
			// Reset post data
			wp_reset_postdata();
			global $post;
			// Get meta
			$meta = get_post_meta($post->ID,'_layout',true);
			// Get if set and not set to inherit
			if ( isset($meta) && ! empty($meta) && $meta != 'inherit' ) { $layout = $meta; }
			// Else check for page-global / single-global
			elseif ( is_single() && ( ot_get_option('layout-single') != 'inherit' ) ) { $layout = ot_get_option('layout-single',''.$default.''); }
			elseif ( is_page() && ( ot_get_option('layout-page') != 'inherit' ) ) { $layout = ot_get_option('layout-page',''.$default.''); }
			elseif ( (get_query_var('post_type') == 'portfolio') && ( ot_get_option('layout-portfolio') != 'inherit' ) ) { $layout = ot_get_option('layout-portfolio',''.$default.''); }
			// Else get global option
			else { $layout = ot_get_option('layout-global',''.$default.''); }
		}

		// Set layout based on page
		elseif ( is_home() && ( ot_get_option('layout-home') != 'inherit' ) ) { $layout = ot_get_option('layout-home',''.$default.''); }
		elseif ( is_category() && ( ot_get_option('layout-archive-category') != 'inherit' ) ) { $layout = ot_get_option('layout-archive-category',''.$default.''); }
		elseif ( is_archive() && ( ot_get_option('layout-archive') != 'inherit' ) ) { $layout = ot_get_option('layout-archive',''.$default.''); }
		elseif ( is_search() && ( ot_get_option('layout-search') != 'inherit' ) ) { $layout = ot_get_option('layout-search',''.$default.''); }
		elseif ( is_404() && ( ot_get_option('layout-404') != 'inherit' ) ) { $layout = ot_get_option('layout-404',''.$default.''); }
		elseif ( (get_query_var('post_type') == 'portfolio') && ( ot_get_option('layout-portfolio') != 'inherit' ) ) { $layout = ot_get_option('layout-portfolio',''.$default.''); }

		// Global option
		else { $layout = ot_get_option('layout-global',''.$default.''); }

		// Return layout class
		return $layout;
	}
}


if ( ! function_exists( 'asdb_body_class' ) ) {

	function asdb_body_class( $classes ) {

		$classes[] = asdb_layout_class();

		if ( ot_get_option( 'boxed' ) != 'on' ) { $classes[] = 'full-width'; }
		if ( ot_get_option( 'boxed' ) == 'on' ) { $classes[] = 'boxed'; }
		if ( ot_get_option( 'sidebar-width' ) == 'medium-3' ) { $classes[] = 'sw3'; }
		if ( ot_get_option( 'sidebar-width' ) == 'medium-4' ) { $classes[] = 'sw4'; }
		if ( has_nav_menu('topbar') ) {	$classes[] = 'topbar-enabled'; }
		return $classes;
	}
}
add_filter( 'body_class', 'asdb_body_class' );



function _bgstyle() {
	global $post;
$bgstyle = '';
$gbg = '';
$pbg = '';

if ( ot_get_option('site-background') != '') {$gbg = ot_get_option('site-background');}
if ( is_singular() && get_post_meta($post->ID, 'page_background', true )!= '') {$pbg = get_post_meta($post->ID, 'page_background', true );}

if ($pbg!='') {$bg = $pbg;} else {$bg = $gbg;}

if ( $bg != '' ) {
$bg_color = $bg['background-color'];
$bg_image = $bg['background-image'];
$bg_position = $bg['background-position'];
$bg_attachment = $bg['background-attachment'];
$bg_repeat = $bg['background-repeat'];
$bg_size = $bg['background-size'];
		if ( $bg_image && $bg_size == "" ) {
		$bgstyle .= 'background: '.$bg_color.' url('.$bg_image.') '.$bg_attachment.' '.$bg_position.' '.$bg_repeat.';';
		} elseif ( $bg_image && $bg_size != "" ) {
		$bgstyle .= 'background: '.$bg_color.' url('.$bg_image.') '.$bg_attachment.' '.$bg_position.' '.$bg_repeat.'; background-size: '.$bg_size.';';
		} elseif ( $bg_color ) {
		$bgstyle .= 'background-color: '.$bg_color.';';
		} else { $bgstyle .= ''; }
	}
	return $bgstyle;
}

/**
 * Site name/logo
 */
if ( ! function_exists( 'wpb_site_title' ) ) {

  function wpb_site_title() {
    if (ot_get_option('site-description')!='off'){$sd='<span class="subtitle">'.get_bloginfo('description').'<span>';} else {$sd='';}
    // Text or image?
    if ( ot_get_option('custom-logo') ) {
      $logo = '<img src="'.ot_get_option('custom-logo').'" alt="'.get_bloginfo('name').'">';
    } else {
      $logo = get_bloginfo('name').$sd;
    }

    $link = '<a href="'.home_url('/').'" rel="home">'.$logo.'</a>';
    $sitename = '<span class="site-title">'.$link.'</span>'."\n";

    return $sitename;
  }
}


function wpb_excerpt_more($more) {
    global $post;
    $readmore = ot_get_option( 'readmore' );
    if ($readmore=='button') {
    return '<a href="'. get_permalink($post->ID) . '" class="read-more button right">'.__( 'Read More', 'asdbturbo' ).'</a>';
    } elseif ($readmore=='link') {
    return '<a href="'. get_permalink($post->ID) . '" class="read-more right">'.__( 'Read More', 'asdbturbo' ).'</a>';
    } else {
    return '...';
    }
}
add_filter('excerpt_more', 'wpb_excerpt_more');


/*  Excerpt length
/* ------------------------------------ */
if ( ! function_exists( 'asd_excerpt_length' ) ) {

	function asd_excerpt_length( $length ) {
		return ot_get_option('excerpt-length',$length);
	}

}
add_filter( 'excerpt_length', 'asd_excerpt_length', 999 );


function get_all_termmeta( $defaults ) {
	global $taxMeta;
	$taxMeta = new stdClass;
	$qobj = get_queried_object();
	$taxMeta->term_id = $qobj->term_id;
	$taxMeta->name = $qobj->name;
	$taxMeta->slug = $qobj->slug;
	$taxMeta->taxonomy = $qobj->taxonomy;
	$taxMeta->parent = $qobj->parent;
	if ($qobj->taxonomy ==='category') {
		$taxMeta->category_description = $qobj->category_description;
	} else {
		$taxMeta->category_description = $qobj->description;
	}
		foreach ( wp_parse_args( get_metadata( 'term', $qobj->term_id), $defaults ) as $k => $v ) {
			$taxMeta->$k = $v[0];
		}
	return $taxMeta;
}




/*  Related posts
/* ------------------------------------ */
if ( ! function_exists( 'asdb_related_posts' ) ) {

	function asdb_related_posts() {
		wp_reset_postdata();
		global $post;

		// Define shared post arguments
		$args = array(
			'no_found_rows'				=> true,
			'update_post_meta_cache'	=> false,
			'update_post_term_cache'	=> false,
			'cache_results'         	=> false,
			'ignore_sticky_posts'		=> 1,
			'orderby'					=> 'rand',
			'post__not_in'				=> array($post->ID),
			'posts_per_page'			=> 4
		);
		// Related by categories
		if ( ot_get_option('related-posts') == 'categories' ) {

			$cats = get_post_meta($post->ID, 'related-cat', true);

			if ( !$cats ) {
				$cats = wp_get_post_categories($post->ID, array('fields'=>'ids'));
				$args['category__in'] = $cats;
			} else {
				$args['cat'] = $cats;
			}
		}
		// Related by tags
		if ( ot_get_option('related-posts') == 'tags' ) {

			$tags = get_post_meta($post->ID, 'related-tag', true);

			if ( !$tags ) {
				$tags = wp_get_post_tags($post->ID, array('fields'=>'ids'));
				$args['tag__in'] = $tags;
			} else {
				$args['tag_slug__in'] = explode(',', $tags);
			}
			if ( !$tags ) { $break = true; }
		}

		$query = !isset($break)?new WP_Query($args):new WP_Query;
		return $query;
	}

}


/*
   Related products
/* ------------------------------------ */
if ( ! function_exists( 'asdb_related_tags' ) ) {
	function asdb_related_tags() {
		global $post;
		$numlinks = get_post_meta( $post->ID, '_numlinks', true  );
		if ( $numlinks == '' ) {$numlinks = 4;}
		// Define shared post arguments
		$args = array(
			'no_found_rows'				=> true,
			'update_post_meta_cache'	=> false,
			'update_post_term_cache'	=> false,
			'cache_results'         	=> false,
			'ignore_sticky_posts'		=> 1,
			'orderby'					=> 'rand',
			'post__not_in'				=> array($post->ID),
			'posts_per_page'			=> $numlinks,
			'post_type'					=> array( 'post'),
		);
		$tags = get_post_meta( $post->ID, 'related_tag');
			if ( $tags ) {
				$args['tag__in'] = $tags;
			}
			if ( ! $tags ) {
				$tags = wp_get_post_tags($post->ID, array('fields' => 'ids'));
				$args['tag__in'] = $tags; }
			if ( ! $tags ) { $break = true; }
		$query = ! isset($break)?new WP_Query($args):new WP_Query;
		return $query;
	}
}


/*
   Related products
/* ------------------------------------ */
if ( ! function_exists( 'asdb_related_blocks' ) ) {
	function asdb_related_blocks() {
		global $post;
		$numlinks = get_post_meta( $post->ID, '_numlinks', true  );
		$block = get_post_meta( $post->ID, 'related_block', true  );
		if ( $numlinks == '' ) {$numlinks = 4;}
		$args = array(
			'no_found_rows'				=> true,
			'update_post_meta_cache'	=> false,
			'update_post_term_cache'	=> false,
			'cache_results'         	=> false,
			'orderby'					=> 'rand',
			'posts_per_page'			=> (int) $numlinks,
			'post_type'					=> array( 'features' ),
			'post__in'					=> array( $block ),
		);
		$query = ! isset($break)?new WP_Query($args):new WP_Query;
		return $query;
	}
}

/*
   Page title
/* ------------------------------------ */
if ( ! function_exists( 'asdb_page_title' ) ) {
	function asdb_page_title() {
		global $post;
		$heading = esc_attr( get_post_meta( $post->ID, '_heading', true ) );
		$subheading = esc_attr( get_post_meta($post->ID,'_subheading',true) );
		if ($heading) { $title = $heading; } else {$title = get_the_title();}
		$pagetitle = '<h1 class="entry-title">'.$title.'</h1>';
		if ($subheading) {	$pagetitle .= '<h4 class="entry-subtitle">'.$subheading.'</h4>'; }
		return $pagetitle;
	}
}

/*
   Social links
/* ------------------------------------ */
if ( ! function_exists( 'asdb_social_links' ) ) {

	function asdb_social_links() {
		if ( ! ot_get_option('social-link') == '' ) {
			$links = ot_get_option('social-link', array());
			if ( ! empty( $links ) ) {
				echo '<ul class="social-links">';
				foreach ( $links as $item ) {

					// Build each separate html-section only if set
					if ( isset($item['title']) && ! empty($item['title']) ) { $title = 'title="' .esc_attr( $item['title'] ). '"'; } else { $title = ''; }
					if ( isset($item['social-link']) && ! empty($item['social-link']) ) { $link = 'href="' .esc_attr( $item['social-link'] ). '"'; } else { $link = ''; }
					if ( isset($item['social-target']) && ! empty($item['social-target']) ) { $target = 'target="' .$item['social-target']. '"'; } else { $target = ''; }
					if ( isset($item['social-icon']) && ! empty($item['social-icon']) ) { $icon = 'class="fa ' .esc_attr( $item['social-icon'] ). '"'; } else { $icon = ''; }
					if ( isset($item['social-color']) && ! empty($item['social-color']) ) { $color = 'style="color: ' .$item['social-color']. ';"'; } else { $color = ''; }

					// Put them together
					if ( isset($item['title']) && ! empty($item['title']) && isset($item['social-icon']) && ! empty($item['social-icon']) && ($item['social-icon'] != 'fa-') ) {
						echo '<li><a rel="nofollow" class="social-tooltip" '.$title.' '.$link.' '.$target.'><i '.$icon.' '.$color.'></i></a></li>';
					}
				}
				echo '</ul>';
			}
		}
	}
}


if ( ! function_exists( 'asdb_share' ) ) {
		function asdb_share() {
	        global $post;
	        $twitter_user = ot_get_option( 'twitter_username' );
		    $out = '';
		    $out .= '
            <div class="asdb-box-sharing">
	            <!--<label> '. __('Sharing:', 'asdbflat') .'</label>-->
	            <a rel="nofollow" class="asdb-social-sharing-buttons asdb-social-vk" href="http://vk.com/share.php?url=' . urlencode( esc_url( get_permalink() ) ) . '" onclick="window.open(this.href, \'mywin\',\'left=50,top=50,width=600,height=350,toolbar=0\'); return false;"><i class="fa fa-vk"></i><div class="asdb-social-but-text">Вконтакте</div></a>
	            <a rel="nofollow" class="asdb-social-sharing-buttons asdb-social-facebook" href="http://www.facebook.com/sharer.php?u=' . urlencode( esc_url( get_permalink() ) ) . '" onclick="window.open(this.href, \'mywin\',\'left=50,top=50,width=600,height=350,toolbar=0\'); return false;"><i class="fa fa-facebook"></i><div class="asdb-social-but-text">Facebook</div></a>
	            <a rel="nofollow" class="asdb-social-sharing-buttons asdb-social-twitter" href="https://twitter.com/intent/tweet?text=' . htmlspecialchars(urlencode(html_entity_decode($post->title, ENT_COMPAT, 'UTF-8')), ENT_COMPAT, 'UTF-8') . '&url=' . urlencode( esc_url( get_permalink() ) ) . '&via=' . urlencode( $twitter_user ? $twitter_user : get_bloginfo( 'name' ) ) . '"><i class="fa fa-twitter"></i><div class="asdb-social-but-text">Twitter</div></a>
	            <a rel="nofollow" class="asdb-social-sharing-buttons asdb-social-pinterest" href="http://pinterest.com/pin/create/button/?url=' . esc_url( get_permalink() ) . '&amp;media=' . ( ! empty( $image[0] ) ? $image[0] : '' ) . '" onclick="window.open(this.href, \'mywin\',\'left=50,top=50,width=600,height=350,toolbar=0\'); return false;"><i class="fa fa-pinterest"></i></a>
	            <a rel="nofollow" class="asdb-social-sharing-buttons asdb-social-google" href="http://plus.google.com/share?url=' . esc_url( get_permalink() ) . '" onclick="window.open(this.href, \'mywin\',\'left=50,top=50,width=600,height=350,toolbar=0\'); return false;"><i class="fa fa-google-plus"></i></a>
	            <a rel="nofollow" class="asdb-social-sharing-buttons asdb-social-ok" href="http://www.odnoklassniki.ru/dk?st.cmd=addShare&st.s=1&st._surl=' . urlencode( esc_url( get_permalink() ) ) . '"><i class="fa fa-odnoklassniki"></i><div class="asdb-social-but-text">Одноклассники</div></a>
            </div>
            ';
	return $out;
	}
}


/*
   Dynamic sidebar primary
/* ------------------------------------ */
if ( ! function_exists( 'asdb_sidebar_primary' ) ) {

	function asdb_sidebar_primary() {
		// Default sidebar
		$sidebar = 'primary';

		// Set sidebar based on page
		if ( is_home() && ot_get_option('s1-home') ) { $sidebar = ot_get_option('s1-home'); }
		if ( is_single() && ot_get_option('s1-single') ) { $sidebar = ot_get_option('s1-single'); }
		if ( is_archive() && ot_get_option('s1-archive') ) { $sidebar = ot_get_option('s1-archive'); }
		if ( is_category() && ot_get_option('s1-archive-category') ) { $sidebar = ot_get_option('s1-archive-category'); }
		if ( is_search() && ot_get_option('s1-search') ) { $sidebar = ot_get_option('s1-search'); }
		if ( is_404() && ot_get_option('s1-404') ) { $sidebar = ot_get_option('s1-404'); }
		if ( is_woocommerce_installed() && ot_get_option('s1-woo') ) $sidebar = ot_get_option('s1-woo');
		if ( is_page() && ot_get_option('s1-page') ) { $sidebar = ot_get_option('s1-page'); }

		// Check for page/post specific sidebar
		if ( is_page() || is_single() ) {
			// Reset post data
			wp_reset_postdata();
			global $post;
			// Get meta
			$meta = get_post_meta($post->ID,'_sidebar_primary',true);
			if ( $meta ) { $sidebar = $meta; }
		}

		// Return sidebar
		return $sidebar;
	}
}


/*
   Dynamic sidebar secondary
/* ------------------------------------ */
if ( ! function_exists( 'asdb_sidebar_secondary' ) ) {

	function asdb_sidebar_secondary() {
		// Default sidebar
		$sidebar = 'secondary';

		// Set sidebar based on page
		if ( is_home() && ot_get_option('s2-home') ) { $sidebar = ot_get_option('s2-home'); }
		if ( is_single() && ot_get_option('s2-single') ) { $sidebar = ot_get_option('s2-single'); }
		if ( is_archive() && ot_get_option('s2-archive') ) { $sidebar = ot_get_option('s2-archive'); }
		if ( is_category() && ot_get_option('s2-archive-category') ) { $sidebar = ot_get_option('s2-archive-category'); }
		if ( is_search() && ot_get_option('s2-search') ) { $sidebar = ot_get_option('s2-search'); }
		if ( is_404() && ot_get_option('s2-404') ) { $sidebar = ot_get_option('s2-404'); }
		if ( is_woocommerce_installed() && ot_get_option('s2-woo') ) $sidebar = ot_get_option('s2-woo');
		if ( is_page() && ot_get_option('s2-page') ) { $sidebar = ot_get_option('s2-page'); }

		// Check for page/post specific sidebar
		if ( is_page() || is_single() ) {
			// Reset post data
			wp_reset_postdata();
			global $post;
			// Get meta
			$meta = get_post_meta($post->ID,'_sidebar_secondary',true);
			if ( $meta ) { $sidebar = $meta; }
		}

		// Return sidebar
		return $sidebar;
	}
}

/*  Register custom sidebars
/* ------------------------------------ */
if ( ! function_exists( 'asdb_custom_sidebars' ) ) {

	function asdb_custom_sidebars() {
		if ( !ot_get_option('sidebar-areas') =='' ) {

			$sidebars = ot_get_option('sidebar-areas', array());

			if ( !empty( $sidebars ) ) {
				foreach( $sidebars as $sidebar ) {
					if ( isset($sidebar['title']) && !empty($sidebar['title']) && isset($sidebar['id']) && !empty($sidebar['id']) && ($sidebar['id'] !='sidebar-') ) {
						register_sidebar(array('name' => ''.esc_attr( $sidebar['title'] ).'','id' => ''.esc_attr( strtolower($sidebar['id']) ).'','before_widget' => '<div id="%1$s" class="widget %2$s">','after_widget' => '</div>','before_title' => '<h3>','after_title' => '</h3>'));
					}
				}
			}
		}
	}

}
add_action( 'widgets_init', 'asdb_custom_sidebars' );




/*  Tracking code
/* ------------------------------------ */
if ( ! function_exists( 'asdb_tracking_code' ) ) {

	function asdb_tracking_code() {
		if ( ot_get_option('tracking-code') ) {
			echo ''.ot_get_option('tracking-code').''."\n";
		}
	}

}
add_filter( 'wp_footer', 'asdb_tracking_code' );


if ( !function_exists('fb_AddThumbColumn') && function_exists('add_theme_support') ) {
// for post and page
add_theme_support('post-thumbnails', array( 'post', 'page' ) );
	function fb_AddThumbColumn($cols) {
		$cols['thumbnail'] = __('Thumbnail');
		return $cols;
		}

	function fb_AddThumbValue($column_name, $post_id) {
		$width = (int) 100;
		$height = (int) auto;
		if ( 'thumbnail' == $column_name ) {
		// thumbnail of WP 2.9
		$thumbnail_id = get_post_meta( $post_id, '_thumbnail_id', true );
		 // image from gallery
		 $attachments = get_children( array('post_parent' => $post_id, 'post_type' => 'attachment', 'post_mime_type' => 'image') );
		 if ($thumbnail_id)
		 	$thumb = wp_get_attachment_image( $thumbnail_id, array($width, $height), true );
		 elseif ($attachments) {
		 	foreach ( $attachments as $attachment_id => $attachment ) {
		 		$thumb = wp_get_attachment_image( $attachment_id, array($width, $height), true );
		 	}
		 }
		 if ( isset($thumb) && $thumb ) {
		 	echo $thumb;
		 } else {
		 echo __('None');
		 }
		 }
		 }
		 // for posts
		 add_filter( 'manage_posts_columns', 'fb_AddThumbColumn' );
		 add_action( 'manage_posts_custom_column', 'fb_AddThumbValue', 10, 2 );
		 // for pages
		 add_filter( 'manage_pages_columns', 'fb_AddThumbColumn' );
		 add_action( 'manage_pages_custom_column', 'fb_AddThumbValue', 10, 2 );
		 }



add_filter( 'the_content', 'add_modal_class' );
function add_modal_class($content) {
		global $post;

			$pattern ="/<a(.*?)href=('|\")(.*?).(bmp|gif|jpeg|jpg|png)('|\")(.*?)>/i";

			$replacement = '<a$1href=$2$3.$4$5 class="wpb-modal-image" title="'.$post->post_title.'"$6>';
			$content = preg_replace($pattern, $replacement, $content);
		return $content;
	}





/**
 * Get attachment id by url function, adjusted to work cropped images
 *
 * @param string $url
 * @return int
 */
function get_attachment_id_by_url( $url ) {
		$post_id = attachment_url_to_postid( $url );

	    if ( ! $post_id ) {
	        $dir = wp_upload_dir();
	        $path = $url;

	        if ( strpos( $path, $dir['baseurl'] . '/' ) === 0 )
	            $path = substr( $path, strlen( $dir['baseurl'] . '/' ) );

	        if ( preg_match( '/^(.*)(\-\d*x\d*)(\.\w{1,})/i', $path, $matches ) )
	            $post_id = attachment_url_to_postid( $dir['baseurl'] . '/' . $matches[1] . $matches[3] );
	    }

	    return (int) $post_id;
	}


	/**
	 * Get attachment title function
	 *
	 * @param int $id
	 * @param string $title_arg
	 * @return string
	 */
	function get_attachment_title( $id, $title_arg ) {

		if ( empty( $title_arg ) || empty( $id ) ) {
			return false;
		}

		switch( $title_arg ) {
			case 'title':
				$title = get_the_title( $id );
				break;
			case 'caption':
				$title = get_post_field( 'post_excerpt', $id ) ;
				break;
			case 'alt':
				$title = get_post_meta( $id, '_wp_attachment_image_alt', true );
				break;
			case 'description':
				$title = get_post_field( 'post_content', $id ) ;
				break;
			default:
				$title = '';
				break;
		}

		return apply_filters( 'get_attachment_title', $title, $id, $title_arg );

	}


/*
function get_attachment_id_by_url( $url ) {
    global $wpdb;

    // таблица постов, там же перечисленны и медиафайлы
    $table  = $wpdb->prefix . 'posts';
    $attachment_id = $wpdb->get_var(
        $wpdb->prepare( "SELECT ID FROM $table WHERE guid RLIKE %s", $url )
    );
    // Returns id
    return (int) $attachment_id;
}
*/
