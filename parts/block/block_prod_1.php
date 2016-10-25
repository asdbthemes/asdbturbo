<?php
global $asdbblock, $post, $product;
$thumb ='thumb-medium';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}
?>

<div class="mod1 mod_wrap">
	<div class="product-thumb">
    <?php woocommerce_show_product_loop_sale_flash() ?>
	<?php get_blocks_thumb($thumb);?>
	</div>
    <?php echo get_blocks_title();?>

    <div class="entry-meta">
<?php woocommerce_template_loop_price(); ?>
<?php woocommerce_template_loop_add_to_cart(); ?>
    </div>

</div>
