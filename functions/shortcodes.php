<?php
/*
  ------------------------------------------------------------------------- *
 *  Basic Shortcodes
/* ------------------------------------------------------------------------- */


//divider
add_shortcode( 'asdb_divider', function( $atts, $content= null ){

  $atts = shortcode_atts(
    array(
      'size'  => '15'
      ), $atts);

  extract($atts);

  return '<div style="height:' . $size . 'px;" class="clearfix"></div>';
});

//row
add_shortcode( 'asdb_row', function( $atts=array(), $content=null ){

  $output = '<div class="row">';
  $output .= do_shortcode( str_replace('<p></p>', '', $content) );
  $output .= '</div>';
  return $output;
});

//column
add_shortcode( 'asdb_columns', function( $atts, $content=null ){
 $atts = shortcode_atts(
  array(
    'size' => '1'

    ), $atts);
 $output = '<div class="columns medium-'. $atts['size'].'">';
 $output .= do_shortcode( str_replace('<p></p>', '', $content) );
 $output .= '</div>';
 return $output;

});


//Block Numbers
add_shortcode( 'asdb_blocknumber', function( $atts, $content="" ) {
  extract(shortcode_atts(array(
    'number' => '01',
    'background' => '#333',
    'color' => '#999',
    'borderradius'=>'2px'
    ), $atts));

  return '<p class="blocknumber"><span style="background:'.$background.';color:'.$color.';border-radius:'.$borderradius.'">' . $number . '</span> ' . do_shortcode( $content ) . '</p>';
} );


/*-------------------------------------------------------------------
 *				Social Icon Shortcodes
 *------------------------------------------------------------------*/

add_shortcode('asdb_social','asdb_social_shortcode');

function asdb_social_shortcode( $atts, $content = null ) {
  $list_item = ot_get_option('social-links', array());
    if ( !empty( $list_item ) ) {
	$output = '';
	$output .= '<div class="social-icons">';
	$output .= '<ul>';
      foreach( $list_item as $item ) {

      $output .= '<li><a href="'.$item['social-link'].'"><i class="icon '.$item['social-icon'].'"></i></a></li>';

      }
	$output .= '</ul>';
	$output .= '</div>';
    }
return $output;
}

/*-------------------------------------------------------------------
 *				ORBIT
 *------------------------------------------------------------------*/


add_shortcode('asdb_orbit','get_orbit');

function get_orbit( $atts, $content = null ) {
    extract(shortcode_atts(
            array(
                'block' => '1',
                'col' => '1',
                'num' => '3',
                'cat' => '0',
                'title' => '',
                'style' => 'style-1',
                'bg' =>'',
                'title_color'=>'secondary'
            ),
            $atts
        )
    );
		$slides = 3;
		$block_id='block_id_'.rand(1000, 9999);
		ob_start();
/*
		$orbit = new WP_Query( array(
		'no_found_rows'				=> false,
		'update_post_meta_cache'	=> false,
		'update_post_term_cache'	=> false,
			'post_type'				=> 'post',
			'numberposts'   =>  $num*$slides,
			'cat'					=> $cat,
			'ignore_sticky_posts'	=> true,
			'orderby'				=> 'date',
			'order'					=> 'dsc',
		) );
*/

echo '<div class="asdb_block" style="background:'.$bg.'">';
echo '<div class="block_'.$block.' numcol_'.$col.' '.$style.'">';

		if($title):
		echo '<h4 class="block-title '.$title_color.'"><span>'.$title.'</span></h4>';
		endif;
  $args             =  array(
    	'numberposts'  				=> $num*$slides,
		'no_found_rows'				=> false,
		'update_post_meta_cache'	=> false,
		'update_post_term_cache'	=> false,
		'ignore_sticky_posts'		=> 1,
		'post_type'					=> 'post',
		'cat'						=> $cat,
    );

  $orbit = get_posts( $args );

  $i      = 1;
  $j      = 1;
  $count  = count($orbit);

  if ($count>0) {

echo'
<div class="orbit" role="region" data-orbit>
      <div class="orbit-nav button-group">
        <a class="button alert orbit-previous" href="#scroller" data-slide="prev"><i class="icon icon-angle-left"></i></a>
        <a class="button alert orbit-next" href="#scroller" data-slide="next"><i class="icon icon-angle-right"></i></a>
      </div>
      <ul class="orbit-container">';

          foreach( $orbit as $key=>$value ) {

            if( (($key+1)%($num)==0) || $j== $count) {
              $lastContainer= true;
            } else {
              $lastContainer= false;
            }
            if($i==1){
              echo'
              <li class="orbit-slide item ' . ($key==0) ? 'is-active': '' .'">
                <div class="row">';
                   }
                echo '
                <div class="columns medium-' . round(12/$num) .'">
                  <div class="portfolio-item">
                  <div class="item-inner">';
                    echo get_the_post_thumbnail( $value->ID, 'thumb-folio', array(
                      'class' => "img-responsive",
                      'alt' => trim(strip_tags( $value->post_title )),
                      'title' => trim(strip_tags( $value->post_title ))
                      ));
                      echo '<h5>'.$value->post_title.'</h5>
                      <div class="overlay">
                        <a class="button alert" title="'.$value->post_title.'" href="'.get_permalink( $value->ID ).'"><i class="icon icon-link"></i></a>
                      </div>
                    </div><!--.item-inner-->
                    </div><!--.portfolio-item-->
                  </div>';
                  if(($i == $num) || $lastContainer) {
                   echo '
                  </div><!--/.row-->
                </li><!--/.orbit-slide item-->';

                $i=0;
              }
              $i++;
              $j++;
            }
        echo '</ul>';
wp_reset_postdata();
 }
echo '
		</div><!--./orbit-->
	</div>
</div><!--./asdb_block-->';

    return ob_get_clean();
}




/*-------------------------------------------------------------------
 *				BLOCK
 *------------------------------------------------------------------*/

add_shortcode('asdb_block','get_block');

function get_block( $atts, $content = null ) {
    global $asdbblock, $pst;
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
			'post_type'				=> 'post',
			'showposts'				=> $limit,
//			'post_per_page'			=> $num,
			'cat'					=> $cat,
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
<?php if ( ( $loadmore == 1) && ( $pst->max_num_pages > 1 ) ): ?><script>
jQuery(function($){
<?php if (  $pst->max_num_pages > 1 ) : ?>
	var ajaxurl = '<?php echo site_url() ?>/wp-admin/admin-ajax.php';
	var <?php echo $block_id;?>_current_page = '<?php echo $paged; ?>';
	var <?php echo $block_id;?>_max_pages = '<?php echo $pst->max_num_pages; ?>';
<?php endif; ?>
$('#asdb_loadmore_<?php echo $block_id;?>').click(function(){
	$(this).html('<?php _e("Loading...", "asdbturbo"); ?> <i class="icon icon-angle-right"></i>');
            jQuery('#asdb_loadmore_<?php echo $block_id;?>').parent().append('<div id="squaresWaveG" class="is-hidden"><div id="squaresWaveG_1" class="squaresWaveG"></div><div id="squaresWaveG_2" class="squaresWaveG"></div><div id="squaresWaveG_3" class="squaresWaveG"></div><div id="squaresWaveG_4" class="squaresWaveG"></div><div id="squaresWaveG_5" class="squaresWaveG"></div><div id="squaresWaveG_6" class="squaresWaveG"></div><div id="squaresWaveG_7" class="squaresWaveG"></div><div id="squaresWaveG_8" class="squaresWaveG"></div></div>');
            setTimeout(function () {
                jQuery('#squaresWaveG')
                    .removeClass('is-hidden')
                    .addClass('is-visible');
            }, 50);
	var data = {
		'action': 'load_block',
		'page' : <?php echo $block_id;?>_current_page,
		'cat':'<?php echo $cat;?>',
		'block':'<?php echo $block;?>',
		'col':'<?php echo $col; ?>',
		'limit':'<?php echo $limit; ?>',
		'style':'<?php echo $style; ?>',
		'max_pages':'<?php echo $pst->max_num_pages; ?>',
		'block_id': '<?php echo $block_id;?>',
		'nonce': $( '#<?php echo $block_id;?>-load-more-nonce' ).val(),
};
$.ajax({
	url:ajaxurl,
	data:data,
	type:'POST',
	success:function(data){
		if( data ) {
			$('#asdb_loadmore_<?php echo $block_id;?>').html('<?php _e("Load more", "asdbturbo"); ?> <i class="icon icon-angle-down"></i>').parent().before(data);
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
$title=get_category($cat);
$title=$title->name;
else :
$styleblock .=' hide-title';
endif;

echo '<div id="asdb_'.$block_id.'" class="asdb_block row '.$styleblock.'" style="background:'.$bg.'">';
echo '<div class="block'.$block.' numcol_'.$col.' '.$style.'">';
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
				get_template_part( 'parts/block/block_'.$block );
				echo '</div>';
        		if (( $current_column == $col) || ($last_post==$post_count+1)) { echo '</div><!--./row-->';}
			break;
			case 'style-2':
        		if ($current_column == 1) {echo '<div class="row">';}
        		if ($col>1) {echo '<div class="columns medium-'. 12/$col . '">';} else {echo '<div class="columns medium-12">';}
        		if ( $current_row == 1 ) { get_template_part( 'parts/block/block_'.$block); }
        		if ( $current_row > 1 ) { get_template_part( 'parts/block/block_6'); }
        		echo '</div><!--./columns-->';
        		if (( $current_column == $col) || ($last_post==$post_count+1)) { echo '</div><!--./row-->';}
			break;
			case 'style-3':
        		if ($post_count == 0) {echo '<div class="row">';}
        		if ($post_count == 0) {
        			echo '<div class="columns medium-6">';
        			get_template_part( 'parts/block/block_'.$block);
        			echo '</div><div class="columns medium-6">';
        			} else { get_template_part( 'parts/block/block_6'); }
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
	echo '&nbsp;<i class="icon icon-angle-down"></i></a></div>';
endif;
	echo '</div></div><!--./asdb_block-->';
    return ob_get_clean();
}
