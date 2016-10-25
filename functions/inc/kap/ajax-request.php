<?php

if( defined('ABSPATH') ) return; // just in case...

exec_time();

// exit if robot
$bot = 'bot|crawler'; // общая отсеивалка
$bot2 = 'Yandex|slurp|yahoo|Teoma|Scooter|ia_archiver|Lycos|Rambler|Mail\.Ru|Aport|WebAlta|ezooms|nigma'; // что проходит через $bot
$bot3 = 'jeeves|technorati|findexa|findlinks|gaisbo|zyborg|bloglines|blogsearch|pubsub|syndic8|userland|become\.com'; // что проходит через $bot
if( preg_match("~$bot|$bot2|$bot3~i", $_SERVER['HTTP_USER_AGENT']) )
	die('bot');

// data
$meta_id   = (int) @ $_POST['meta_id'];
$view_type = in_array(@ $_POST['view_type'], array('post_view', 'term_view')) ? $_POST['view_type'] : '';

// validate data
if( ! $meta_id )    die('no meta_id');
if( ! $view_type )  die('no view_type');

//if( ! isset($_POST['relpath']) ) die('no relpath'); // relpath может быть пустым

//$relpath = stripslashes(@ $_POST['relpath']);

// Защита. На основе validate_file(). Защита не нужна...
//if( false !== strpos( $relpath, '..' ) || false !== strpos( $relpath, './' ) || ':' == substr( $relpath, 1, 1 ) )
//	die('error: wrong relpath. Are you hacker?');


// path to wp-config.php
//$wp_config = $_SERVER['DOCUMENT_ROOT'] . $relpath .'wp-config.php';
//if( ! file_exists( $wp_load_file ) )
//	die('error: wrong path to wp-config.php: {DOCUMENT_ROOT}'. $relpath .'wp-config.php' );

// try to find 'wp-config.php'

function wp_config_path() {
    $document_root = $_SERVER['DOCUMENT_ROOT'];
	$search = array(
		$document_root . 'wp-config.php',
		dirname( $document_root ) . '/wp-config.php'
	);

	foreach ( $search as $path ) {
		if ( file_exists( $path ) ) {
			return $path;
		}
	}

	return false;
}

//$plugins_parent_dir = dirname(dirname(dirname(__FILE__))); // wp-content
//$content_parent_dir = dirname($plugins_parent_dir); // DOCUMENT_ROOT in most cases
//$wp_config = ABSPATH . 'wp-config.php';
//if( ! file_exists($wp_config) ) $wp_config = dirname( ABSPATH ) . '/wp-config.php';
//			ABSPATH . 'wp-config.php',
//			dirname( ABSPATH ) . '/wp-config.php'

//if( ! file_exists($wp_config) ) $wp_config = dirname($content_parent_dir). '/wp-config.php';
//if( ! file_exists($wp_config) ) $wp_config = dirname(dirname($content_parent_dir)). '/wp-config.php';
//if( ! file_exists($wp_config) ) $wp_config = dirname(dirname(dirname($content_parent_dir))). '/wp-config.php';
$wp_config = wp_config_path();
$wp_config = file_get_contents($wp_config);
if( ! $wp_config )
	die('error: wp-config is empty...');

// collect eval PHP define and $table_prefix
if(1){
	$_php = '';
	if( ! preg_match('~\$table_prefix[^;]+;~', $wp_config, $mm ) )
		die('err: $table_prefix not found...');
	$_php .= $mm[0] ."\n";

	if( ! preg_match_all('~define[^;]+(?:DB_NAME|DB_USER|DB_PASSWORD|DB_HOST|DB_CHARSET|DB_COLLATE)[^;]+;~', $wp_config, $mm ) )
		die('err: DB connections not found...');
	$_php .= implode("\n", array_shift($mm) );

	eval( $_php );
}

// SET DB connection ----
require_once dirname(__FILE__) .'/inc/safemysql.class.php';
$db = new SafeMySQL_WP(array(
	'db'      => DB_NAME,
	'user'    => DB_USER,
	'pass'    => DB_PASSWORD,
	'host'    => DB_HOST,
	'charset' => DB_CHARSET,
));
$db->prefix  = $table_prefix;


// set headers ----
_nocache_headers();
@ header('X-Robots-Tag: noindex' );
// base on WP send_nosniff_header();
@ header( 'X-Content-Type-Options: nosniff' );


// update count metadata ----
if( $view_type === 'post_view' ) $table_name = $db->prefix .'postmeta';
if( $view_type === 'term_view' ) $table_name = $db->prefix .'termmeta';

if( ! isset($table_name) )  die('err: table not detected');

if( $db->query("UPDATE $table_name SET meta_value = meta_value+1 WHERE meta_id = ". (int) $meta_id ) )
	die( $db->get_var("SELECT meta_value FROM $table_name WHERE meta_id = ". (int) $meta_id) .'<!--'. exec_time('end') .'-->' );

die('0');




// WP functions ---------------------------



/**
 * Set the headers to prevent caching for the different browsers.
 *
 * Different browsers support different nocache headers, so several
 * headers must be sent so that all of them get the point that no
 * caching should occur.
 *
 * base on WP nocache_headers() func
 */
function _nocache_headers() {
	// from wp_get_nocache_headers()
	$headers = array(
		'Expires' => 'Wed, 11 Jan 1984 05:00:00 GMT',
		'Cache-Control' => 'no-cache, must-revalidate, max-age=0',
		'Pragma' => 'no-cache',
		//'Last-Modified' => false,
	);

	//unset( $headers['Last-Modified'] );

	// In PHP 5.3+, make sure we are not sending a Last-Modified header.
	if ( function_exists( 'header_remove' ) ) {
		@ header_remove( 'Last-Modified' );
	}
	else {
		// In PHP 5.2, send an empty Last-Modified header, but only as a
		// last resort to override a header already sent. #WP23021
		foreach ( headers_list() as $header ) {
			if ( 0 === stripos( $header, 'Last-Modified' ) ) {
				$headers['Last-Modified'] = '';
				break;
			}
		}
	}

	foreach ( $headers as $name => $field_value )
		@ header("{$name}: {$field_value}");
}


/**
 * Считает время выполнения кода.
 *
 * Для включения подсчета, просто вызываем функцию.
 * Для остановки подсчета указываем 'stop' в первом параметре.
 * Для повторного включения, опять вызываем.
 * Для получения результата подсчета указываем 'end' в первом параметре.
 *
 * @param (строка) $phase Включение/отключение/вывод (start/stop/end) посчитанного времени.
 * @return (строка) Пр: 0.03654 сек.
 *
 * пример использования:
	exec_time(); // включаем подсчет
	// код, который нужно учитывать
	exec_time('stop'); // останавливаем
	// код который не нужно учитывать
	exec_time(); // продолжаем считать
	// код, который нужно учитывать
	echo exec_time('end'); // выведет 0.03654 сек.
 *
 */
function exec_time( $phase = 'start' ){
	static $time_before, $collect;

	$n = 5; // знаков после запятой

	$t = explode(' ', microtime() );
	$time  = $t[1] . substr( $t[0], 1 );

	if( $phase != 'stop' && $time_before ){
		$difference = bcsub( $time, $time_before, $n ); // разница в сек.
		$collect    = bcadd( $difference, $collect, $n );
	}

	if( $phase == 'end' ) return $collect . ' sec.';
	else $time_before = $time;
}