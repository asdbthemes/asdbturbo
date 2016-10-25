<?php
/**
 * Part Name: Clear Part / Divider
 * Description:
 */

$height = wds_page_builder_get_this_part_data( 'section_height' );
$color = wds_page_builder_get_this_part_data( 'section_color' );
?>

<div class="divider" style="height:<?php echo $height; ?>;background-color:<?php echo $color; ?>;"></div>