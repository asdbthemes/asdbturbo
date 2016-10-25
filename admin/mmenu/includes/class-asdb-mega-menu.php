<?php
/**
 * As long as we don't have our base class already and we haven't
 * already initiated our base class.
 *
 * @package ASDB_Mega_Menu
 */

if ( ! class_exists( 'ASDB_Mega_Menu' ) && ! isset( $asdb_mega_menu ) ) {
	require 'class-asdb-mega-menu-walker.php';
	require 'class-asdb-mega-menu-walker-nav-menu-edit.php';
	require 'class-asdb-mega-menu-admin.php';
	require 'class-asdb-category2id-array-walker.php';
//	require 'class-asdb-mega-menu-back.php';

	/**
	 * WDS Mega Menus.
	 *
	 * This base class handles mostly the instance itself and the plugin
	 * as a whole.
	 *
	 * @since  0.1.0
	 * @package  ASDB_Mega_Menu
	 */
	class ASDB_Mega_Menu {
		/**
		 * Singleton instance of plugin.
		 *
		 * @var ASDB_Mega_Menu
		 * @since  0.1.0
		 */
		protected static $single_instance = null;

		/**
		 * Creates or returns an instance of this class.
		 *
		 * @since  0.1.0
		 * @return ASDB_Mega_Menu A single instance of this class.
		 */
		public static function get_instance() {
			if ( null === self::$single_instance ) {
				self::$single_instance = new self();
			}

			return self::$single_instance;
		}

		/**
		 * Sets up our plugin
		 *
		 * @since  0.1.0
		 */
		protected function __construct() {
			$this->admin = new ASDB_Mega_Menu_Admin(); // Most of the stuff is here!

			// Plugin text domain.
			load_plugin_textdomain( 'asdb-mega-menu', false, dirname( __FILE__ ) . '/../languages/' );
		}

		/**
		 * Magic getter for our object.
		 *
		 * @since  0.1.0
		 * @param  string $field The field we're trying to fetch.
		 * @throws Exception     Throws an exception if the field is invalid.
		 * @return mixed
		 */
		public function __get( $field ) {
			switch ( $field ) {
				case 'version':
					return self::VERSION;
				case 'basename':
				case 'url':
				case 'path':
					return $this->$field;
				default:
					throw new Exception( 'Invalid '. __CLASS__ .' property: ' . $field );
			}
		}
	} // class ASDB_Mega_Menu

	/**
	 * Grab the ASDB_Mega_Menu object and return it.
	 *
	 * Wrapper for ASDB_Mega_Menu::get_instance()
	 *
	 * @since  0.1.0
	 * @return ASDB_Mega_Menu  Singleton instance of plugin class.
	 */
	function asdb_mega_menu() {
		return ASDB_Mega_Menu::get_instance();
	}

	// Launch our class.
	$asdb_mega_menu = asdb_mega_menu();
} // ASDB_Mega_Menu class exists
