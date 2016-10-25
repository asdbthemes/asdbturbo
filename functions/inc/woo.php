<?php
function is_woocommerce_installed() {
    $is_woocommerce_installed = false;
	require_once(ABSPATH . 'wp-admin/includes/plugin.php');
	if (is_plugin_active('woocommerce/woocommerce.php')) {
    	$is_woocommerce_installed = true;
	}
return $is_woocommerce_installed;
}

// Add WooCommerce support for wrappers per http://docs.woothemes.com/document/third-party-custom-theme-compatibility/
remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10);
add_action('woocommerce_before_main_content', 'asdbbase_before_content', 10);
remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10);
add_action('woocommerce_after_main_content', 'asdbbase_after_content', 10);

// Override theme default specification for product 3 per row
add_filter('loop_shop_columns', 'td_wc_loop_shop_columns', 1, 10);
function td_wc_loop_shop_columns($number_columns) {
	return 4;
}

// Number of product per page 6
add_filter('loop_shop_per_page', create_function('$cols', 'return 24;'));

if (!function_exists('woocommerce_output_related_products')) {
	// Number of related products
	function woocommerce_output_related_products() {
		woocommerce_related_products(array(
			'posts_per_page' => 3,
			'columns' => 3,
			'orderby' => 'rand',
		)); // Display 3 products in rows of 1
	}
}

add_theme_support( 'woocommerce' );



// Добавляем значение сэкономленных процентов рядом с ценой у товаров
//add_filter( 'woocommerce_sale_price_html', 'woocommerce_custom_sales_price', 10, 2 );
function woocommerce_custom_sales_price( $price, $product ) {
	$percentage = round( ( ( $product->regular_price - $product->sale_price ) / $product->regular_price ) * 100 );
	return $price . sprintf( __('<span class="wsale">Экономия %s<span>', 'woocommerce' ), $percentage . '%' );
}

add_filter( 'woocommerce_cart_item_name', 'add_sku_in_cart', 20, 3);

function add_sku_in_cart( $title, $values, $cart_item_key ) {
    $sku = $values['data']->get_sku();
    return $sku ? $title . sprintf(" (Артикул: %s)", $sku) : $title;
}


add_filter( 'woocommerce_product_add_to_cart_text' , 'custom_woocommerce_product_add_to_cart_text' );

/**
 * custom_woocommerce_template_loop_add_to_cart
*/
function custom_woocommerce_product_add_to_cart_text() {
	global $product;

	$product_type = $product->product_type;

	switch ( $product_type ) {
		case 'external':
			return __( ' Купить', 'asdbturbo' );
		break;
		case 'grouped':
			return __( ' Купить', 'asdbturbo' );
		break;
		case 'simple':
			return __( ' Купить', 'asdbturbo' );
		break;
		case 'variable':
			return __( ' Купить', 'asdbturbo' );
		break;
		default:
			return __( ' Купить', 'asdbturbo' );
	}

}
