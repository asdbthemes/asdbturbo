<?php
/**
 * Plugin Name: ASDB Mega Menu
 * Plugin URI:  http://wpbuild.ru
 * Description: Make Magnificently Magical Mega Menus and More
 * Version:     0.2.0
 * Author:      WPbuild.Ru
 * Author URI:  http://wpbuild.ru
 * Donate link: http://wpbuild.ru
 * License:     GPLv2
 * Text Domain: asdb-mega-menu
 * Domain Path: /languages
 *
 * @package ASDB_Mega_Menu
 */

/*
 *   __ __                  __ __
 *  |  \  \ ___  ___  ___  |  \  \ ___ ._ _  _ _
 *  |     |/ ._>/ . |<_> | |     |/ ._>| ' || | |
 *  |_|_|_|\___.\_. |<___| |_|_|_|\___.|_|_|`___|
 *                               <___'
 *
 * asdb-Mega-Menu is a plugin that helps you customize things in the WP Nav.
 *
 * Copyright (c) 2015 WPbuild.Ru (email : dev@wpbuild.ru)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2 or, at
 * your discretion, any later version, as published by the Free
 * Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

if (!defined('ABSPATH')) die('');

if ( defined( 'DISABLE_ASDB_MEGA_MENU' ) && DISABLE_ASDB_MEGA_MENU ) {
	return; // Bail if they configure this not to load.
}

// Our base class.
require_once( 'includes/class-asdb-mega-menu.php' );
//require_once( 'includes/class-asdb-mmenu.php' );
//require_once( 'includes/class-asdb-mega-menu-back.php' );


function asdb_mega_menu_cpt() {
	$labels = array(
		'name' => __('Mega menu', 'asdbturbo'),
		'singular_name' => __('ASDB Mega Menu', 'asdbturbo'),
		'add_new_item' => __('Add New Menu Item', 'asdbturbo'),
		'edit_item' => __('Edit Menu Item', 'asdbturbo'),
		'search_items' => __('Search Menu Items', 'asdbturbo'),
		'not_found' => __('Sorry: Menu Item Not Found', 'asdbturbo'),
		'not_found_in_trash' => __('Sorry: Menu Item Not Found In Trash', 'asdbturbo'),

	);
	$args = array(
		'labels'        => $labels,
		'rewrite' => false,
		'public' => true,
		'hierarchical' => 'false',
		'capability_type' => 'page',
		'supports' => array('title', 'editor'),
		'menu_icon' => 'dashicons-editor-kitchensink', /* the icon for the custom post type menu */
		'show_in_nav_menus'   => false,
		'has_archive'   => false
	);
	register_post_type( 'asdb_mega_menu', $args );
}
add_action( 'init', 'asdb_mega_menu_cpt' );




/*
add_action('admin_menu', 'register_asdb_mmenu_submenu_page');

function register_asdb_mmenu_submenu_page() {
	add_submenu_page( 'edit.php?post_type=asdb_mega_menu', __('Mega Menu Options', 'asdb-mega-menu'), __('Mega Menu Options', 'asdb-mega-menu'), 'manage_options', 'asdb_mmenu_', 'asdb_mmenu_submenu_page_callback' );
}

function asdb_mmenu_submenu_page_callback() {
//    include('asdb_menu_options.php');
}







function styles()
{
    $saved_options   = get_option('asdb_mmenu');
    $saved_menu_data = get_option('asdb_mmenu_data');

    crumina_get_js_code($saved_options);
    get_hover_styles($saved_menu_data);
}

add_action('wp_head', 'styles', 10);

function load_theme_scripts()
{
    wp_enqueue_script('thickbox');
    wp_enqueue_style('thickbox');

    wp_enqueue_script('my_asdb_mmenu', plugins_url('js/asdb_mmenu.js', __FILE__));
    wp_enqueue_style('my_asdb_mmenu_css', plugins_url('css/asdb_mmenu.css', __FILE__));
}

add_action('admin_enqueue_scripts', 'load_theme_scripts');
*/


function asdb_allowed_depths( $array ) {
    // Allow at depths 0, 1, 2, and 3.
    return array( 0 );
}

add_filter( 'asdb_mega_menu_walker_nav_menu_edit_allowed_depths', 'asdb_allowed_depths' );