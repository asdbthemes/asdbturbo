<?php
/**
Plugin Name: Kama AJAX Postviews
Version: 0.1.4
Plugin URI:
Description: Считает посещения страниц, нужен jQuery. Расчитан на совместное использование с плагинами страничного кэширования (wp super cache). В теме, в цикле wordpress, для вывода количества просмотров, используйте <code>&lt;?php kap_views() ?&gt;</code>, а где нужно обновлять просмотры через AJAX, например на отдельной странице, используйте: <code>&lt;?php fresh_kap_views() ?&gt;</code>. Поддержка PHP 5.3
Author: Kama
Author URI: http://wp-kama.ru/
 */


// функции обертки
/*
 * Выводит количество просмотров
 */
function kap_views( $post_id = false ) {
	echo get_kap_views( $post_id );
}

function get_kap_views( $post_id = false ) {
	if ( ! $post_id ) { $post_id = $GLOBALS['post']->ID; }
	return get_post_meta( $post_id, 'views', 1) ?: '0';
}

/*
 * Выводит количество просмотров и обновляет их через AJAX
 */
function fresh_kap_views( $post_id = false ) {
	echo get_fresh_kap_views( $post_id );
}

function get_fresh_kap_views( $post_id = false ) {
	if ( ! $post_id ) { $post_id = $GLOBALS['post']->ID; }

	$views = get_post_meta( $post_id, 'views', 1 ) ?: '0';

	return '<span class="ajax_views">'. $views .'</span>';
}


class Kama_Postviews {

	const OPT_NAME = 'kama_postviews';

	public $opt;
	public $wp_load_php_path;
	public $meta_key = 'views';

	protected static $instance;

	static function init() {
		is_null( self::$instance ) and self::$instance = new self;
		return self::$instance;
	}

	private function __construct() {
		if ( ! defined('ABSPATH') ) { $this->ajax_request(); // AJAX
}
		$this->opt = ( $opt = get_option( self::OPT_NAME ) ) ? $opt : $this->def_opt();

		// jquery
		add_action('wp_enqueue_scripts', create_function('','wp_enqueue_script("jquery");') );

		add_action( 'wp_footer', array( $this, 'footer_script' ), 999 );
	}

	function def_opt() {
		return array(
			'who_count' => 'not_administrators', // Чьи посещения считать? all - Всех. not_logged_users - Только гостей. logged_users - Только авторизованных пользователей. not_administrators - Всех, кроме админов.
		);
	}

	function footer_script() {
		global $post, $wpdb;

		if ( ! is_singular() || is_attachment() ) { return; }

		$should_count = 0;
		switch ( $this->opt['who_count'] ) {
			case 'all': $should_count = 1;
				break;
			case 'not_logged_users':
				if ( ! is_user_logged_in() ) {
					$should_count = 1; }
				break;
			case 'logged_users':
				if ( is_user_logged_in() ) {
					$should_count = 1; }
				break;
			case 'not_administrators':
				if ( ! current_user_can('manage_options') ) {
					$should_count = 1; }
				break;
			default : $should_count = 0;
		}

		if ( ! $should_count ) { return; }

		$post_id = (int) $post->ID;
		$row = $wpdb->get_row( "SELECT meta_id, meta_value FROM $wpdb->postmeta WHERE post_id=$post_id AND meta_key='{$this->meta_key}' LIMIT 1"  );

		// если нет пр. поля, создадим его
		if ( ! $row ) {
			if ( ! $pst = get_post( $post_id ) ) {
				return; }

			if ( add_post_meta( $post->ID, $this->meta_key, '0', true ) ) {
				$row = $wpdb->get_row( "SELECT meta_id, meta_value FROM $wpdb->postmeta WHERE post_id=$post_id AND meta_key='{$this->meta_key}' LIMIT 1"  ); }
			else {
				return; }
		}

		$ajax_request_url = home_url() . str_replace( rtrim( $_SERVER['DOCUMENT_ROOT'],'/'), '', wp_normalize_path(__FILE__) );
		?>
        <!-- kama ajax postviews -->
		<script type='text/javascript'>jQuery.post("<?php echo $ajax_request_url ?>", { id : '<?php echo $row->meta_id ?>' }, function(result){ jQuery('.ajax_views').text(result); } );</script>
		<?php
	}

	function ajax_request() {
		// exit if robot
		$bot = 'bot';
		$bot2 = 'Yandex|Googlebot|slurp|yahoo|Teoma|Scooter|ia_archiver|Lycos|Rambler|Mail.Ru|Aport|WebAlta|ezooms|nigma|bingbot|Twitterbot';
		$bot3 = 'Gigabot|trendictionbot|msnbot|jeeves|webcrawler|turnitinbot|technorati|findexa|findlinks|gaisbo|zyborg|surveybot|bloglines|blogsearch|pubsub|syndic8|userland|become.com';
		if ( preg_match("~$bot|$bot2~i", $_SERVER['HTTP_USER_AGENT']) ) {
			exit('bot'); }

		// path to wp-load.php
		$wp_load_file = $_SERVER['DOCUMENT_ROOT'] . '/core/wp-load.php'; // подраздел куда установлен WP
		if ( ! file_exists( $wp_load_file ) ) {
			$wp_load_file = $_SERVER['DOCUMENT_ROOT'] . '/wordpress/wp-load.php'; }
		if ( ! file_exists( $wp_load_file ) ) {
			$wp_load_file = $_SERVER['DOCUMENT_ROOT'] . '/wp-load.php'; }

		global $wpdb;

		// WP load
		define( 'SHORTINIT', true );
		include_once( $wp_load_file );

		send_nosniff_header();
		nocache_headers();

		@header( 'Content-Type: text/html; charset=UTF-8' );
		@header( 'X-Robots-Tag: noindex' );

		$meta_id = intval($_POST['id']);

		if ( empty($meta_id) ) {
			exit('no meta_id'); }

		// поле должно уже существовать
		if ( $wpdb->query( "UPDATE $wpdb->postmeta SET meta_value = meta_value+1 WHERE meta_id=$meta_id" ) ) {
			exit( (string) $wpdb->get_var("SELECT meta_value FROM $wpdb->postmeta WHERE meta_id=$meta_id") );
		}

		exit('0');
	}

	// админка

}

Kama_Postviews::init();


