<?php
__('Counts visits of post or tax term. Works fast with caching plugins like WP Super Cache. To print views count use one of function: <code>&lt;?php kap_views() ?&gt;</code> or <code>&lt;?php fresh_kap_views() ?&gt;</code> where you need fresh views (when page cache plugin enabled)','asdbturbo');

/**
Plugin Name: Kama Postviews
Description: Counts visits of post or tax term. Works fast with caching plugins like WP Super Cache. To print views count use one of function: <code>&lt;?php kap_views() ?&gt;</code> or <code>&lt;?php fresh_kap_views() ?&gt;</code> where you need fresh views (when page cache plugin enabled)
Plugin URI:
Author: Kama
Author URI: http://wp-kama.ru/
Text Domain: kap
Domain Path: lang
Version: 2.0
*/

define('KAP_PATH',	get_template_directory().'/functions/inc/kap/' );
define('KAP_URL',	get_template_directory_uri().'/functions/inc/kap/' );
define('KAP_BASE',	'kama-postview.php' );

require_once KAP_PATH . 'class.Kama_Postviews.php';

// init
//add_action( 'after_setup_theme', 'wpb__kap' );
add_action( 'init', 'wpb__kap' );
function wpb__kap(){
	Kama_Postviews::init();
}

add_action('plugins_loaded', function(){
//	load_textdomain('asdbturbo', KAP_PATH . 'lang/'. get_locale() . '.mo' );

//	Kama_Postviews::init();
});
//Kama_Postviews::init();

## wrapper functions

/*
 * Выводит количество просмотров и обновляет значение наживую (через AJAX)
 */
function fresh_kap_views( $id = 0, $type = '' ){
	echo get_fresh_kap_views( $id, $type );
}

function get_fresh_kap_views( $id = 0, $type = '' ){
	return _kap_views_fresh_wrap( get_kap_views( $id, $type ) );
}

function _kap_views_fresh_wrap( $views ){
	return '<span class="ajax_views">'. $views .'</span>';
}

/*
 * Выводит количество просмотров, ничего не обновляет.
 */
function kap_views( $id = 0, $type = '' ){
	echo get_kap_views( $id, $type );
}

/**
 * Получает количество просмотров.
 * @param  integer [$id = 0]    ID записи или элемента таксономии.
 * @param  string [$type = '']  Тип переданого ID. Может быть: 'term' (для элементов таксономии) или 'post' (для записей).
 *                              По умолчанию выставляется тип просматриваемой страницы.
 * @return string Количество просмотров.
 */
function get_kap_views( $id = 0, $type = '' ){
	if( ! $type ){
		if( in_the_loop() ){
			$type = 'post';
		}
		else{
			$queri = get_queried_object();
			if( isset($queri->term_id) )    $type = 'term';
			if( isset($queri->post_type) )  $type = 'post';
		}
	}

	if( $type == 'post' ){
		if( ! $id ) $id = $GLOBALS['post']->ID;
		return get_post_meta( $id, 'views', 1) ?: '0';
	}
	if( $type == 'term' && function_exists('get_term_meta') ){
		if( ! $id ) $id = get_queried_object()->term_id;
		return get_term_meta( $id, 'views', 1) ?: '0';
	}
}
