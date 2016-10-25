<?php
/**
 * Mega Menu Admin.
 *
 * @package ASDB_Mega_Menu
 */

if ( ! class_exists( 'ASDB_Mega_Menu_Admin' ) ) {

	/**
	 * Mega Menu Administration.
	 *
	 * @package  ASDB_Mega_Menu
	 * @since  0.1.0
	 */
	class ASDB_Mega_Menu_Admin {
		/**
		 * Constructor
		 *
		 * @since 0.1.0
		 * @return  null
		 */
		public function __construct() {
			add_filter( 'wp_setup_nav_menu_item', array( $this, 'register_nav_field' ) );
			add_action( 'wp_update_nav_menu_item', array( $this, 'update_nav_fields' ), 10, 3 );
			add_filter( 'wp_edit_nav_menu_walker', array( $this, 'nav_menu_edit_walker' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
		}

		/**
		 * Enqueue scripts.
		 */
		public function admin_enqueue_scripts() {
			if ( 'nav-menus' !== get_current_screen()->id ) {
				return; // Only show on nav-menu's screen.
			}

			wp_enqueue_media();
			wp_enqueue_style( 'adsmega-admin', get_template_directory_uri() .  '/admin/mmenu/assets/css/admin.css', array(), time() );
			wp_enqueue_script( 'asdb-mega-menu', get_template_directory_uri() . '/admin/mmenu/assets/js/asdb-mega-menu.js', array( 'jquery' ), time() );
			//wp_enqueue_script( 'bootstrap-dropdown', get_template_directory_uri() .  '/admin/megamenu/assets/js/dropdowns-enhancement.js', array( 'jquery' ), time(), true );
		}

		/**
		 * Filter the walker being used for the menu edit screen
		 *
		 * @return string
		 */
		public function nav_menu_edit_walker() {
			return 'ASDB_Mega_Menu_Walker_Nav_Menu_Edit';
		}

		/**
		 * Register a field for the nav menu
		 *
		 * @param object $menu_item The menu item object.
		 * @return mixed
		 */
		public function register_nav_field( $menu_item ) {
			$menu_item->image = get_post_thumbnail_id( $menu_item->ID );
			$menu_item->icon = get_post_meta( $menu_item->ID, '_menu_item_icon', true );
			$menu_item->faicon = get_post_meta( $menu_item->ID, '_menu_item_fa_icon', true );
			$menu_item->warea = get_post_meta( $menu_item->ID, '_menu_item_widget_area', true );
			$menu_item->category = get_post_meta( $menu_item->ID, '_menu_item_mmenu_category', true );
			$menu_item->mmpage= get_post_meta( $menu_item->ID, '_menu_item_mmenu_page', true );
			$menu_item->mmtype= get_post_meta( $menu_item->ID, '_menu_item_mmenu_type', true );
			return $menu_item;
		}

		/**
		 * Save the new field data for the nav menu.
		 *
		 * @param int   $menu_id         Not used here.
		 * @param int   $menu_item_db_id The menu item post ID.
		 * @param array $args            Not used here.
		 * @since 0.1.0
		 * @todo Maybe add nonces when getting data from $_POST?
		 */
		public function update_nav_fields( $menu_id, $menu_item_db_id, $args ) {

			// Hide on mobile.
			if ( isset( $_POST['hide-menu-on-mobile'][ $menu_item_db_id ] ) ) {
				update_post_meta( $menu_item_db_id, 'hide_menu_on_mobile', empty( $_POST['hide-menu-on-mobile'][ $menu_item_db_id ] ) ? false : 'on' );
			} else {
				delete_post_meta( $menu_item_db_id, 'hide_menu_on_mobile' );
			}

			// Image.
			if ( isset( $_POST['menu-item-image'] ) && is_array( $_POST['menu-item-image'] ) ) {
				if ( ! isset( $_POST['menu-item-image'][$menu_item_db_id] ) || ! $_POST['menu-item-image'][$menu_item_db_id] ) {
					delete_post_thumbnail( $menu_item_db_id );
				}

				if ( isset( $_POST['menu-item-image'][$menu_item_db_id] ) ) {
					set_post_thumbnail( $menu_item_db_id, absint( $_POST['menu-item-image'][$menu_item_db_id] ) );
				}
			}

			if ( isset( $_POST['menu-item-icon'] ) && is_array( $_POST['menu-item-icon'] ) ) {
				if ( isset( $_POST['menu-item-icon'][$menu_item_db_id] ) ) {
					update_post_meta( $menu_item_db_id, '_menu_item_icon', sanitize_text_field( $_POST['menu-item-icon'][$menu_item_db_id] ) );
				}
			}

			if ( isset( $_POST['menu-item-fa-icon'] ) && is_array( $_POST['menu-item-fa-icon'] ) ) {
				if ( isset( $_POST['menu-item-fa-icon'][$menu_item_db_id] ) ) {
					update_post_meta( $menu_item_db_id, '_menu_item_fa_icon', sanitize_text_field( $_POST['menu-item-fa-icon'][$menu_item_db_id] ) );
				}
			}

			if ( isset( $_POST['menu-item-widget-area'] ) && isset( $_POST['menu-item-widget-area'][$menu_item_db_id] ) && is_array( $_POST['menu-item-widget-area'] ) ) {
				update_post_meta( $menu_item_db_id, '_menu_item_widget_area', sanitize_text_field( $_POST['menu-item-widget-area'][$menu_item_db_id] ) );
			}

			if ( isset( $_POST['menu-item-mmenu-page'] ) && isset( $_POST['menu-item-mmenu-page'][$menu_item_db_id] ) && is_array( $_POST['menu-item-mmenu-page'] ) ) {
				update_post_meta( $menu_item_db_id, '_menu_item_mmenu_page', sanitize_text_field( $_POST['menu-item-mmenu-page'][$menu_item_db_id] ) );
			}

			if ( isset( $_POST['menu-item-mmenu-type'] ) && isset( $_POST['menu-item-mmenu-type'][$menu_item_db_id] ) && is_array( $_POST['menu-item-mmenu-type'] ) ) {
				update_post_meta( $menu_item_db_id, '_menu_item_mmenu_type', sanitize_text_field( $_POST['menu-item-mmenu-type'][$menu_item_db_id] ) );
			}

			if ( isset( $_POST['menu-item-mmenu-category'] ) && isset( $_POST['menu-item-mmenu-category'][$menu_item_db_id] ) && is_array( $_POST['menu-item-mmenu-category'] ) ) {
				update_post_meta( $menu_item_db_id, '_menu_item_mmenu_category', sanitize_text_field( $_POST['menu-item-mmenu-category'][$menu_item_db_id] ) );
			}

			//print_r($_POST);
		}
	} // class ASDB_Mega_Menu_Admin
} // if class ASDB_Mega_Menu_Admin.
