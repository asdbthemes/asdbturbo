<?php


class Kama_Postviews {

	const OPT_NAME = 'kama_postviews';

	public $opt;
	public $wp_load_php_path;
	public $meta_key = 'views';

	protected static $inst;

	static function init(){
		if( is_null(self::$inst) )
			self::$inst = is_admin() ? new Kama_Postviews_Admin() : new self;

		return self::$inst;
	}

	function __construct(){
		$opt = array(
			'who_count'=> ot_get_option('who_count'),
			'hold_sec' => ot_get_option('hold_sec')
		);

		$this->opt = ( $opt ) ? $opt : $this->def_opt();

		if( ! is_admin() ){
			# jquery
			add_action('wp_enqueue_scripts', create_function('','wp_enqueue_script("jquery");') );
			add_action('wp_footer', array( &$this, 'show_js' ), 99 );
		}

	}

	function def_opt(){
		return array(
			'who_count' => 'all', //'not_administrators', // Чьи посещения считать? all - Всех. not_logged_users - Только гостей. logged_users - Только авторизованных пользователей. not_administrators - Всех, кроме админов.
			'hold_sec' => 2, // Задержка в секундах
		);
	}

	function show_js(){
		// allow manage script show. In the filter maybe you need to set custom $wp_query->queried_object
		$force_show = apply_filters('kama_postviews_force_show_js', false );

		if( ! $force_show ){
			if( is_attachment() || is_front_page() )  return;
			if( ! ( is_singular() || is_tax() || is_category() || is_tag() ) )  return;
		}

		$should_count = 1;
		switch( $this->opt['who_count'] ) {
			case 'all': $should_count = 1;
				break;
			case 'not_logged_users':
				if( ! is_user_logged_in() )
					$should_count = 1;
				break;
			case 'logged_users':
				if( is_user_logged_in() )
					$should_count = 1;
				break;
			case 'not_administrators':
				if( ! current_user_can('manage_options') )
					$should_count = 1;
				break;
			default : $should_count = 0;
		}

		if( ! $should_count ) return; // not count...

		global $post, $wpdb;

		$queri = get_queried_object();

		// post
		if( isset($queri->post_type) && isset($post->ID) ){
			$view_type = 'post_view';

			$_sql = $wpdb->prepare("SELECT meta_id, meta_value FROM $wpdb->postmeta WHERE post_id = %d AND meta_key = %s LIMIT 1", $post->ID, $this->meta_key );

			// create if not exists
			if( ! $row = $wpdb->get_row( $_sql ) ){
				if( add_post_meta( $post->ID, $this->meta_key, '0', true ) )
					$row = $wpdb->get_row( $_sql );
			}
		}
		// term
		elseif( isset($queri->term_id) && $wpdb->termmeta ){
			$view_type = 'term_view';

			$_sql = $wpdb->prepare("SELECT meta_id, meta_value FROM $wpdb->termmeta WHERE term_id = %d AND meta_key = %s LIMIT 1", $queri->term_id, $this->meta_key );

			// create if not exists
			if( ! $row = $wpdb->get_row( $_sql ) ){
				if( add_term_meta( $queri->term_id, $this->meta_key, '0', true ) )
					$row = $wpdb->get_row( $_sql );
			}
		}

		if( ! isset($view_type) || ! $row ) return; // just in case...

		$relpath = '';
		$abspath = wp_normalize_path( ABSPATH );
		$relpath = str_replace( wp_normalize_path($_SERVER['DOCUMENT_ROOT']), '', $abspath );
		if( $abspath === $relpath )
			return print '<!-- kama postviews error: wrong detection of relative ABSPATH -->';

		// script
		ob_start();
		?>
		<script>setTimeout( function(){
			jQuery.post(
				'<?php echo KAP_URL . 'ajax.php' ?>',
				{ meta_id:'<?php echo $row->meta_id ?>', view_type:'<?php echo $view_type ?>', relpath:'<?php echo $relpath ?>' },
				function(result){   jQuery('.ajax_views').html(result);   }
			);
		}, <?php echo ($this->opt['hold_sec']*1000) ?>);
		</script>
		<?php
		$script = apply_filters('kama_postviews_script', ob_get_clean() );

		echo preg_replace('~[\r\n\t]~', '', $script )."\n";

		do_action('after_kama_postviews_show_js');
	}

}

// admin part  --------------
class Kama_Postviews_Admin extends Kama_Postviews {

	function __construct(){
		parent::__construct();

		add_action('current_screen', array( &$this, 'add_tax_field_hooks'), 99 );

//		add_action('admin_menu', array( &$this, 'add_options_page') );
//		add_action('admin_init', array( &$this, 'register_setting') );
//		add_filter('plugin_action_links_'. KAP_BASE, array( &$this, 'settings_link' ) );
	}

	function add_tax_field_hooks(){
		if( ! @ get_current_screen()->taxonomy ) return; // execution limit...
		if( ! function_exists('get_term_meta') ) return; // do nothing to WP < 4.4

		foreach( get_taxonomies(array('public'=>true, 'query_var'=>true, 'rewrite'=>true)) as $taxname ){
			// метаполя
			add_action("{$taxname}_edit_form_fields", array( & $this, 'edit_tax_fields') );
			add_action("edited_{$taxname}", array( & $this, 'save_tax_meta') );

			// колонка
			add_filter("manage_edit-{$taxname}_columns", array( & $this, 'add_tax_columns') );
			add_filter("manage_{$taxname}_custom_column", array( & $this, 'fill_tax_columns'), 10, 3);
		}

		add_action('admin_head', array( & $this, 'col_css') );
	}

	// Tax Metadata ---
	function edit_tax_fields( $term ) {
		?>
		<tr class="form-field">
			<th scope="row" valign="top"><label for="extra1">Просмотры</label></th>
			<td>
				<input type="number" min="0" name="termviews[views]" value="<?php echo (int) get_term_meta( $term->term_id, 'views', 1 ) ?>" style="max-width:100px;"><br />
				<!--<span class="description">Заголовок для SEO</span>-->
			</td>
		</tr>
		<?php
	}

	function save_tax_meta( $term_id ) {
		if ( ! isset($_POST['termviews']) )   return;

		$views = (int) $_POST['termviews']['views'];
		update_term_meta( $term_id, 'views', $views );
	}

	// Tax column ---
	function add_tax_columns( $columns ){
		$_columns = array();
		$i=1;
		foreach( $columns as $k => $col ){
			$_columns[ $k ] = $col;
			if( $i++ == 4 ) $_columns['views'] = '<span title="'. __('Views','asdbturbo') .'" class="dashicons dashicons-visibility"></span>';
		}

		return $_columns;
	}

	function fill_tax_columns( $out, $colname, $id ){
		if( $colname == 'views' )
			$out = ($v=get_term_meta( $id, 'views', 1 )) ? $v : '0';

		return $out;
	}

	function col_css(){
		echo '<style>.column-views{ width:50px; }</style>';
	}

	## sanitize data
	function option_sanitize_cb( $options ){
		foreach( $options as $name => & $val ){
			$val = sanitize_text_field( $val );
		}

		return $options;
	}

}
