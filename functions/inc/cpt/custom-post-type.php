<?php

/***            Типы записей и таксономии                         ***/

add_action( 'init', 'create_asdbflat_taxonomies', 0 );

function create_asdbflat_taxonomies() {

  $labels_brand = array(
	'name' => 'Бренды',
	'singular_name' => 'Бренд',
	'search_items' => 'Поиск бренда',
	'all_items' => 'Все бренды',
	'parent_item' => 'Дочерний бренд',
	'parent_item_colon' => 'Дочерний бренд:',
	'edit_item' => 'Редактировать бренд',
	'update_item' => 'Обновить бренд',
	'add_new_item' => 'Добавить бренд',
	'new_item_name' => 'Имя нового бренда',
	'menu_name' => 'Бренды',
  );
  register_taxonomy('brand', array('product'), array(
	'hierarchical' => true,
	'labels' => $labels_brand,
	'show_ui' => true,
	'query_var' => true,
	'rewrite' => array( 'slug' => 'brand' ),
  ));

  $labels_galleries_category = array(
	'name' => 'Категории слайдов',
	'singular_name' => 'Категории слайда',
	'search_items' => 'Поиск категорий',
	'all_items' => 'Все категории',
	'parent_item' => 'Дочерняя категория',
	'parent_item_colon' => 'Дочерняя категория:',
	'edit_item' => 'Редактировать категорию',
	'update_item' => 'Обновить категорию',
	'add_new_item' => 'Добавить категорию',
	'new_item_name' => 'Имя новой категории',
	'menu_name' => 'Категории слайдов',
  );
  register_taxonomy('galleries_category', array('galleries'), array(
	'hierarchical' => true,
	'labels' => $labels_galleries_category,
	'show_ui' => true,
	'query_var' => true,
	'rewrite' => array( 'slug' => 'galleries_category' ),
	'show_in_nav_menus'   => false,
  ));

  $labels_services_category = array(
	'name' => 'Категории услуг',
	'singular_name' => 'Категории услуги',
	'search_items' => 'Поиск категорий',
	'all_items' => 'Все категории',
	'parent_item' => 'Дочерняя категория',
	'parent_item_colon' => 'Дочерняя категория:',
	'edit_item' => 'Редактировать категорию',
	'update_item' => 'Обновить категорию',
	'add_new_item' => 'Добавить категорию',
	'new_item_name' => 'Имя новой категории',
	'menu_name' => 'Категории услуг',
  );
  register_taxonomy('services_category', array('services'), array(
	'hierarchical' => true,
	'labels' => $labels_services_category,
	'show_ui' => true,
	'query_var' => true,
	'rewrite' => array( 'slug' => 'services_category' ),
	'show_in_nav_menus'   => false,
  ));

  $labels_testimonials_category = array(
	'name' => 'Категории отзывов',
	'singular_name' => 'Категория отзывов',
	'search_items' => 'Поиск категорий',
	'all_items' => 'Все категории',
	'parent_item' => 'Дочерняя категория',
	'parent_item_colon' => 'Дочерняя категория:',
	'edit_item' => 'Редактировать категорию',
	'update_item' => 'Обновить категорию',
	'add_new_item' => 'Добавить категорию',
	'new_item_name' => 'Имя новой категории',
	'menu_name' => 'Категории отзывов',
  );
  register_taxonomy('testimonials_category', array('testimonials'), array(
	'hierarchical' => true,
	'labels' => $labels_testimonials_category,
	'show_ui' => true,
	'query_var' => true,
	'rewrite' => array( 'slug' => 'testimonials_category' ),
	'show_in_nav_menus'   => false,
  ));

  $labels_features_category = array(
	'name' => 'Категории блоков',
	'singular_name' => 'Категории блоков',
	'search_items' => 'Поиск категорий',
	'all_items' => 'Все категории',
	'parent_item' => 'Дочерняя категория',
	'parent_item_colon' => 'Дочерняя категория:',
	'edit_item' => 'Редактировать категорию',
	'update_item' => 'Обновить категорию',
	'add_new_item' => 'Добавить категорию',
	'new_item_name' => 'Имя новой категории',
	'menu_name' => 'Категории блоков',
  );
  register_taxonomy('features_category', array('features'), array(
	'hierarchical' => true,
	'labels' => $labels_features_category,
	'show_ui' => true,
	'query_var' => true,
	'rewrite' => array( 'slug' => 'features_category' ),
	'show_in_nav_menus'   => false,
  ));
  $labels_portfolio_category = array(
	'name' => 'Тип проекта',
	'singular_name' => 'Тип проекта',
	'search_items' => 'Поиск',
	'all_items' => 'Все',
	'parent_item' => 'Дочерняя',
	'parent_item_colon' => 'Дочерняя:',
	'edit_item' => 'Редактировать',
	'update_item' => 'Обновить',
	'add_new_item' => 'Добавить',
	'new_item_name' => 'Новый',
	'menu_name' => 'Тип проекта',
  );
  register_taxonomy('portfolio_category', array('portfolio'), array(
	'hierarchical' => true,
	'labels' => $labels_portfolio_category,
	'show_ui' => true,
	'query_var' => true,
	'rewrite' => array( 'slug' => 'portfolio_category' ),
	'show_in_nav_menus'   => true,
));
  $labels_clients_category = array(
	'name' => 'Категории партнеров',
	'singular_name' => 'Категория партнеров',
	'search_items' => 'Поиск категорий',
	'all_items' => 'Все категории',
	'parent_item' => 'Дочерняя категория',
	'parent_item_colon' => 'Дочерняя категория:',
	'edit_item' => 'Редактировать категорию',
	'update_item' => 'Обновить категорию',
	'add_new_item' => 'Добавить категорию',
	'new_item_name' => 'Имя новой категории',
	'menu_name' => 'Категории Партнеров',
  );
register_taxonomy('clients_category', array('clients'), array(
	'hierarchical' => true,
	'labels' => $labels_clients_category,
	'show_ui' => true,
	'query_var' => true,
	'rewrite' => array( 'slug' => 'clients_category' ),
	'show_in_nav_menus'   => false,
  ));
}


/*
 * Portfolio post type
 */

function asdb_portfolio() {
	$labels_portfolio = array(
	'name' => 'Проекты',
	'singular_name' => 'Проект',
	'add_new' => 'Добавить проект',
	'add_new_item' => 'Добавить проект',
	'edit_item' => 'Редактировать проект',
	'new_item' => 'Новый проект',
	'view_item' => 'Посмотреть проект',
	'search_items' => 'Найти проект',
	'not_found' => 'Проекты не найдены',
	'not_found_in_trash' => 'В корзине проектов не найдено',
	'parent_item_colon' => '',
	'menu_name' => 'Портфолио',
	);
	$args_portfolio = array(
	'labels' => $labels_portfolio,
	'public' => true,
	'publicly_queryable' => true,
	'show_ui' => true,
	'show_in_menu' => true,
	'query_var' => true,
	'rewrite' => true,
	'capability_type' => 'post',
	'has_archive' => true,
	'hierarchical' => false,
	'menu_position' => null,
	'menu_icon' => 'dashicons-images-alt2',
	'supports' => array('title','editor','thumbnail','gallery'),
	'taxonomies' => array('post_tag','portfolio_category'),
	'show_in_nav_menus'   => false,
	);
	register_post_type('portfolio',$args_portfolio);
}


/*
 * Gallery post type
 */

function asdb_gallery() {

$labels_galleries = array(
	'name' => 'Галерея',
	'singular_name' => 'Галерея',
	'add_new' => 'Добавить новую',
	'add_new_item' => 'Добавить новую',
	'edit_item' => 'Редактировать галерею',
	'new_item' => 'Новый галерея',
	'view_item' => 'Посмотреть галерею',
	'search_items' => 'Найти галерею',
	'not_found' => 'Галереи не найдены',
	'not_found_in_trash' => 'В корзине галерей не найдены',
	'parent_item_colon' => '',
	'menu_name' => 'Все галереи',
);

  $args_galleries = array(
	'labels' => $labels_galleries,
	'public' => true,
	'publicly_queryable' => true,
	'show_ui' => true,
	'show_in_menu' => true,
	'query_var' => true,
	'rewrite' => true,
	'capability_type' => 'post',
	'has_archive' => true,
	'hierarchical' => false,
	'menu_position' => null,
	'menu_icon' => 'dashicons-format-gallery',
	'supports' => array('title','editor','thumbnail','custom-fields'),
	'taxonomies' => array('galleries_category'),
	'show_in_nav_menus'   => false,
  );

register_post_type('galleries',$args_galleries);

}


/*
 * Features post type
 */
function asdb_features() {
$labels_features = array(
	'name' => 'Блоки',
	'singular_name' => 'Блоки',
	'add_new' => 'Добавить блок',
	'add_new_item' => 'Добавить новый',
	'edit_item' => 'Редактировать Блок',
	'new_item' => 'Новый Блоки',
	'view_item' => 'Посмотреть Блок',
	'search_items' => 'Найти Блок',
	'not_found' => 'Блоки не найдены',
	'not_found_in_trash' => 'В корзине Блоки не найдены',
	'parent_item_colon' => '',
	'menu_name' => 'Блоки',
);
  $args_features = array(
	'labels' => $labels_features,
	'public' => true,
	'publicly_queryable' => true,
	'show_ui' => true,
	'show_in_menu' => true,
	'query_var' => true,
	'rewrite' => true,
	'capability_type' => 'post',
	'has_archive' => true,
	'hierarchical' => false,
	'menu_position' => null,
	'menu_icon' => 'dashicons-list-view',
	'supports' => array('title','editor','thumbnail'),
	'taxonomies' => array('features_category'),
  );
register_post_type('features',$args_features);
}


/*
 * Testimonials post type
 */

function asdb_testimonials() {
	$labels = array(
		'name'               => __( 'Отзывы', 'asdbflat' ),
		'singular_name'      => __( 'Отзыв', 'asdbflat' ),
		'add_new' 			 => __( 'Добавить отзыв', 'asdbflat' ),
		'add_new_item'       => __( 'Добавить отзыв', 'asdbflat' ),
		'edit_item'          => __( 'Редактировать отзыв', 'asdbflat' ),
		'new_item'           => __( 'Новый отзыв', 'asdbflat' ),
		'all_items'          => __( 'Все отзывы', 'asdbflat' ),
		'view_item'          => __( 'Просмотр отзыва', 'asdbflat' ),
		'search_items'       => __( 'Поиск отзывов', 'asdbflat' ),
		'not_found'          => __( 'Отзывы не найдены', 'asdbflat' ),
		'not_found_in_trash' => __( 'Отзывы в корзине не найдены', 'asdbflat' ),
		'parent_item_colon'  => '',
		'menu_name'          => 'Отзывы',
	);
	$args = array(
		'labels'        => $labels,
		'description'   => 'Holds our clients and partners testimonials',
		'public'        => true,
		'supports'      => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
		'taxonomies'    => array('post_tag','category','testimonials_category'),
		'menu_icon' => 'dashicons-testimonial', /* the icon for the custom post type menu */
		'has_archive'   => false,
		'show_in_nav_menus'   => false,
	);
	register_post_type( 'testimonials', $args );
}

/*
 * Testimonials post type
 */

function asdb_services() {
	$labels = array(
		'name'               => __( 'Services', 'asdbflat' ),
		'singular_name'      => __( 'Service', 'asdbflat' ),
		'add_new' 			 => __( 'Add Service', 'asdbflat' ),
		'add_new_item'       => __( 'Add Service', 'asdbflat' ),
		'edit_item'          => __( 'Edit Service', 'asdbflat' ),
		'new_item'           => __( 'New Service', 'asdbflat' ),
		'all_items'          => __( 'All Services', 'asdbflat' ),
		'view_item'          => __( 'View Service', 'asdbflat' ),
		'search_items'       => __( 'Search Service', 'asdbflat' ),
		'not_found'          => __( 'Service not found', 'asdbflat' ),
		'not_found_in_trash' => __( 'Service not found in trash', 'asdbflat' ),
		'parent_item_colon'  => '',
		'menu_name'          => 'Service',
	);
	$args = array(
		'labels'        => $labels,
		'description'   => 'Holds our clients and partners testimonials',
		'public'        => true,
		'supports'      => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
		'taxonomies'    => array('post_tag','services_category'),
		'menu_icon' => 'dashicons-list-view', /* the icon for the custom post type menu */
		'has_archive'   => true,
	);
	register_post_type( 'services', $args );
}

/*
 * Partners post type
 */

function asdb_clients() {
	$labels = array(
		'name'               => __( 'Клиенты', 'asdbflat' ),
		'singular_name'      => __( 'Клиенты', 'asdbflat' ),
		'add_new'		     => __( 'Добавить клиента', 'asdbflat' ),
		'add_new_item'       => __( 'Добавить клиента', 'asdbflat' ),
		'edit_item'          => __( 'Редактировать', 'asdbflat' ),
		'new_item'           => __( 'Новый клиент', 'asdbflat' ),
		'all_items'          => __( 'Все клиенты', 'asdbflat' ),
		'view_item'          => __( 'Просмотр клиента', 'asdbflat' ),
		'search_items'       => __( 'Поиск клиентов', 'asdbflat' ),
		'not_found'          => __( 'Клиенты не найдены', 'asdbflat' ),
		'not_found_in_trash' => __( 'No Client / Partner found in the Trash', 'asdbflat' ),
		'parent_item_colon'  => '',
		'menu_name'          => 'Клиенты',
	);
	$args = array(
		'labels'        => $labels,
		'description'   => 'Holds our clients logotypes',
		'public'        => true,
		'supports'      => array( 'title', 'editor', 'thumbnail' ),
		'taxonomies'	=> array( 'regions','category' ),
		'menu_icon' => 'dashicons-groups', /* the icon for the custom post type menu */
		'has_archive'   => false,
	);
	register_post_type( 'clients', $args );
}


/*
 * Team post type
 */

function asdb_team() {
	$labels = array(
		'name'					=> __( 'Команда', 'asdbflat' ),
		'singular_name'			=> __( 'Команда', 'asdbflat' ),
		'add_new'				=> __( 'Добавить консультанта', 'asdbflat' ),
		'add_new_item'			=> __( 'Добавить консультанта', 'asdbflat' ),
		'edit_item'				=> __( 'Редактировать консультанта', 'asdbflat' ),
		'new_item'				=> __( 'Новый консультант', 'asdbflat' ),
		'all_items'				=> __( 'Все консультанты', 'asdbflat' ),
		'view_item'				=> __( 'Просмотр', 'asdbflat' ),
		'search_items'			=> __( 'Поиск', 'asdbflat' ),
		'not_found'				=> __( 'Не найдены', 'asdbflat' ),
		'not_found_in_trash'	=> __( 'В корзине не найдены', 'asdbflat' ),
		'parent_item_colon'		=> '',
		'menu_name'				=> 'Наша команда',
	);
	$args = array(
		'labels'				=> $labels,
		'description'			=> '',
		'public'				=> true,
		'supports'				=> array( 'title', 'editor', 'thumbnail' ),
		'menu_icon'				=> 'dashicons-groups', /* the icon for the custom post type menu */
		'taxonomies'			=> array( 'category' ),
		'has_archive'			=> false,
	);
	register_post_type( 'team', $args );
}




function asdb_init_ctype() {

if ( ot_get_option( 'site-features' ) === 'on' ) { add_action( 'init', 'asdb_features' ); }
if ( ot_get_option( 'site-gallery' ) === 'on' ) { add_action( 'init', 'asdb_gallery' ); }
if ( ot_get_option( 'site-portfolio' ) === 'on' ) { add_action( 'init', 'asdb_portfolio' ); }
if ( ot_get_option( 'site-partners' ) === 'on' ) { add_action( 'init', 'asdb_clients' ); }
if ( ot_get_option( 'site-testimonials' ) === 'on' ) { add_action( 'init', 'asdb_testimonials' ); }
if ( ot_get_option( 'site-services' ) === 'on' ) { add_action( 'init', 'asdb_services' ); }
if ( ot_get_option( 'site-team' ) === 'on' ) { add_action( 'init', 'asdb_team' ); }
}
add_action('after_setup_theme', 'asdb_init_ctype', 2);
