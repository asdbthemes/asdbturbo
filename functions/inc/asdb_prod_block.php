<?

add_action('wp_ajax_load_prod_block', 'get_data_prod_block');
add_action('wp_ajax_nopriv_load_prod_block', 'get_data_prod_block');

function get_data_prod_block() {
    global $pst, $product;

	if ( ( empty( $_POST['nonce'] ) ) || ( !wp_verify_nonce( $_POST['nonce'], $_POST['block_id'] . '-load-more-nonce' ) ) )
	{
		exit;
	}

	$args = unserialize(stripslashes($_POST['query']));
//	$args['cat'] = $_POST['cat'];
	$args['paged'] = $_POST['page'] + 1;
	$args['post_status'] = 'publish';
	$args['showposts'] = $_POST['limit'];
	$args['post_per_page'] = $_POST['limit'];

	$block = $_POST['block'];
	$col = $_POST['col'];
	$style = $_POST['style'];

	$pst = new WP_Query($args);
		if ( $pst->have_posts() ) :
        $post_count = 0;
        $current_column = 1;
        $current_row = 1;

		while ( $pst->have_posts() ): $pst->the_post();
		switch ($style) {
			case 'style-1':
				if ($current_column == 1) {echo '<div class="row">';}
				if ($col>1) {echo '<div class="columns medium-'. 12/$col . '">';} else {echo '<div class="columns medium-12">';}
				get_template_part( 'parts/block/block_prod_'.$block );
				echo '</div>';
        		if ( $current_column == $col) { echo '</div>';}
			break;
			case 'style-2':
        		if ($current_column == 1) {echo '<div class="row">';}
        		if ($col>1) {echo '<div class="columns medium-'. 12/$col . '">';} else {echo '<div class="columns medium-12">';}
        		if ( $current_row == 1 ) { get_template_part( 'parts/block/block_prod_'.$block); }
        		if ( $current_row > 1 ) { get_template_part( 'parts/block/block_prod_6'); }
        		echo '</div><!--./columns-->';
        		if ( $current_column == $col) { echo '</div><!--./row-->';}
			break;
			case 'style-3':
        		if ($post_count == 0) {echo '<div class="row">';}
        		if ($post_count == 0) {
        			echo '<div class="columns medium-6">';
        			get_template_part( 'parts/block/block_prod_'.$block);
        			echo '</div><div class="columns medium-6">';
        			} else { get_template_part( 'parts/block/block_prod_6'); }
        		if ($last_post==$post_count+1) { echo '</div></div><!--./row-->';}
			break;
		}
       if ($current_column == $col) {
           $current_column = 1;
           $current_row++;
       } else {
           $current_column++;
       }
       $post_count++;
		endwhile;
		endif;
		wp_reset_query();
		echo '<div class="clear"></div>';
	die();
}


/*-------------------------------------------------------------------
 *				BLOCK
 *------------------------------------------------------------------*/

add_shortcode('asdb_products','get_prod_block');

function get_prod_block( $atts, $content = null ) {
    global $asdbblock, $pst, $product;
    $asdbblock = array();
    extract(shortcode_atts(
            array(
                'block' => '1',
                'col' => '2',
                'limit' => '6',
                'cat' => '0',
                'title' => '',
                'style' => 'style-1',
                'bg' =>'',
                'title_color'=>'',
                'loadmore'=>'0',
                'thumb'=>'thumb-4col',
                'hide_title' => '',
                'sort' => '',
            ),
            $atts
        )
    );
    $asdbblock = $atts;

		$block_id='block_id_'.rand(1000, 9999);


		$args=	array(
		'no_found_rows'				=> false,
		'update_post_meta_cache'	=> false,
		'update_post_term_cache'	=> false,
			'post_type'				=> 'product',
			'showposts'				=> $limit,
//			'post_per_page'			=> $num,
//			'cat'					=> $cat,
		'tax_query' => array(
		array(
			'taxonomy' => 'product_cat',
			'field'    => 'id',
			'terms'    => array( $cat ),
			)
		),
			'ignore_sticky_posts'	=> true,
			'orderby'				=> 'date',
			'order'					=> 'dsc',
		);



		if ($sort=='views') {
		$args['orderby'] = 'meta_value';
		$args['meta_key'] = 'views';
		}

		ob_start();

		$pst = new WP_Query( $args );
		$paged = ( get_query_var( 'paged' ) ) ? get_query_var( 'paged' ) : 1;
		$styleblock ='';
		?>

<?php if ( ( $loadmore == 1) && ( $pst->max_num_pages > 1 ) ):
?>
<script>
jQuery(function($){
<?php if (  $pst->max_num_pages > 1 ) : ?>
	var ajaxurl = '<?php echo site_url() ?>/wp-admin/admin-ajax.php';
	var <?php echo $block_id;?>_current_page = '<?php echo $paged; ?>';
	var <?php echo $block_id;?>_max_pages = '<?php echo $pst->max_num_pages; ?>';
<?php endif; ?>
$('#asdb_loadmore_<?php echo $block_id;?>').click(function(){
	$(this).html('<?php _e("Loading...", "asdbturbo"); ?> <i class="fa fa-angle-right"></i>');
            jQuery('#asdb_loadmore_<?php echo $block_id;?>').parent().append('<div id="squaresWaveG" class="is-hidden"><div id="squaresWaveG_1" class="squaresWaveG"></div><div id="squaresWaveG_2" class="squaresWaveG"></div><div id="squaresWaveG_3" class="squaresWaveG"></div><div id="squaresWaveG_4" class="squaresWaveG"></div><div id="squaresWaveG_5" class="squaresWaveG"></div><div id="squaresWaveG_6" class="squaresWaveG"></div><div id="squaresWaveG_7" class="squaresWaveG"></div><div id="squaresWaveG_8" class="squaresWaveG"></div></div>');
            setTimeout(function () {
                jQuery('#squaresWaveG')
                    .removeClass('is-hidden')
                    .addClass('is-visible');
            }, 50);
	var data = {
		'action': 'load_prod_block',
		'page' : <?php echo $block_id;?>_current_page,
		'cat':'<?php echo $cat;?>',
		'block':'<?php echo $block;?>',
		'col':'<?php echo $col; ?>',
		'limit':'<?php echo $limit; ?>',
		'style':'<?php echo $style; ?>',
		'max_pages':'<?php echo $pst->max_num_pages; ?>',
		'block_id': '<?php echo $block_id;?>',
		'query': '<?php echo serialize($pst->query_vars); ?>',
		'nonce': $( '#<?php echo $block_id;?>-load-more-nonce' ).val(),
};
$.ajax({
	url:ajaxurl,
	data:data,
	type:'POST',
	success:function(data){
		if( data ) {
			$('#asdb_loadmore_<?php echo $block_id;?>').html('<?php _e("Load more", "asdbturbo"); ?> <i class="fa fa-angle-down"></i>').parent().before(data);
			<?php echo $block_id;?>_current_page++;
			if (<?php echo $block_id;?>_current_page == <?php echo $block_id;?>_max_pages) $("#asdb_loadmore_<?php echo $block_id;?>").remove();
            setTimeout(function () {
                jQuery('#squaresWaveG').remove();
            }, 50);

		} else {
			$('#asdb_loadmore_<?php echo $block_id;?>').remove();
            setTimeout(function () {
                jQuery('#squaresWaveG').remove();
            }, 50);

		}
	}
});
	});
});
</script>
<?php else :
$styleblock .='no-loadmore';
endif; ?>

<?php
if( ($hide_title!='hide_title')&&($title=='')):
$term = get_term_by('term_id', $cat, 'product_cat');
$title=$term->name;
else :
$styleblock .=' hide-title';
endif;

echo '<div id="asdb_'.$block_id.'" class="woocommerce asdb_block row '.$styleblock.'" style="background:'.$bg.'">';
echo '<div class="products block'.$block.' numcol_'.$col.' '.$style.'">';
if($title):
echo get_block_sub_cats($cat);
echo '<h3 class="block-title '.$title_color.'"><span>'.$title.'</span></h3>';
endif;

        if ( $pst->have_posts() ) :
        $post_count = 0;
        $current_column = 1;
        $current_row = 1;
        $last_post = count($pst->posts);
        wp_nonce_field( $block_id.'-load-more-nonce', $block_id.'-load-more-nonce' );

		while ( $pst->have_posts() ): $pst->the_post();
			switch ($style) {
			case 'style-1':
				if ($current_column == 1) {echo '<div class="row">';}
				if ($col>1) {echo '<div class="columns medium-'. 12/$col . '">';} else {echo '<div class="columns medium-12">';}
				get_template_part( 'parts/block/block_prod_'.$block );
				echo '</div>';
        		if (( $current_column == $col) || ($last_post==$post_count+1)) { echo '</div><!--./row-->';}
			break;
			case 'style-2':
        		if ($current_column == 1) {echo '<div class="row">';}
        		if ($col>1) {echo '<div class="columns medium-'. 12/$col . '">';} else {echo '<div class="columns medium-12">';}
        		if ( $current_row == 1 ) { get_template_part( 'parts/block/block_prod_'.$block); }
        		if ( $current_row > 1 ) { get_template_part( 'parts/block/block_prod_6'); }
        		echo '</div><!--./columns-->';
        		if (( $current_column == $col) || ($last_post==$post_count+1)) { echo '</div><!--./row-->';}
			break;
			case 'style-3':
        		if ($post_count == 0) {echo '<div class="row">';}
        		if ($post_count == 0) {
        			echo '<div class="columns medium-6">';
        			get_template_part( 'parts/block/block_prod_'.$block);
        			echo '</div><div class="columns medium-6">';
        			} else { get_template_part( 'parts/block/block_prod_6'); }
        		if ($last_post==$post_count+1) { echo '</div></div><!--./row-->';}
			break;
		 }

       if ($current_column == $col) {
           $current_column = 1;
           $current_row++;
       } else {
           $current_column++;
       }
       $post_count++;
		endwhile;
		//echo '<div class="clear"></div>';
endif;
wp_reset_postdata();

if ( ( $loadmore == 1) && ( $pst->max_num_pages > 1 ) ):
	echo '<div class="loadmore-wrap"><a id="asdb_loadmore_'.$block_id.'" class="button small secondry loadmore" >';
	echo _e("Load more", "asdbturbo");
	echo '&nbsp;<i class="fa fa-angle-down"></i></a></div>';
endif;
	echo '</div></div><!--./asdb_block-->';
    return ob_get_clean();
}
