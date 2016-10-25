<?php
/**
 * The sidebar containing the main widget area.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package asdbTurbo
 * @since asdbTurbo 1.0.0
 */

if ( asdb_layout_class() == 'col-1c') { return; }

$primary = asdb_sidebar_primary();
$secondary = asdb_sidebar_secondary();
?>

<aside class="secondary-area widget-area" role="complementary">
	<?php dynamic_sidebar( $primary ); ?>
	<?php dynamic_sidebar( $secondary ); ?>
</aside><!-- .secondary-area -->