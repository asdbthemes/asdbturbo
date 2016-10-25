<?php
/**
 * Part Name: Block
 * Description: the post loop
 */

$cat_style = wds_page_builder_get_this_part_data('cat_style');
$block_id = wds_page_builder_get_this_part_data('block_id');
$posts_cat_id = wds_page_builder_get_this_part_data('posts_cat_id');
$title_color = wds_page_builder_get_this_part_data('title_color');
$posts_num = wds_page_builder_get_this_part_data('posts_num');
$cat_col = wds_page_builder_get_this_part_data('cat_col');
$loadmore  = wds_page_builder_get_this_part_data('loadmore');
$atts = 'cat="'.$posts_cat_id.'" limit="'.$posts_num.'" block="'.$block_id[0].'" style="'.$cat_style[0].'" col="'.$cat_col.'" title_color="'.$title_color.'" loadmore="'.$loadmore.'" ';
?>

<?php echo do_shortcode( '[asdb_block '. $atts  .']' ); ?>
