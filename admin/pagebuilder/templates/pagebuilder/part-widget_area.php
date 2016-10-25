<?php
/**
 * Part Name: Widget Area
 * Description:
 */

$area = wds_page_builder_get_this_part_data( 'widget_area' );

?>

<?php dynamic_sidebar( $area ); ?>
