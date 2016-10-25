<?php

add_action('wp_ajax_load_block', 'get_data_block');
add_action('wp_ajax_nopriv_load_block', 'get_data_block');

function get_data_block() {
    global $pst;

	if ( ( empty( $_POST['nonce'] ) ) || ( !wp_verify_nonce( $_POST['nonce'], $_POST['block_id'] . '-load-more-nonce' ) ) )
	{
		exit;
	}

//	$args = unserialize(stripslashes($_POST['query']));
	$args['cat'] = $_POST['cat'];
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
				get_template_part( 'parts/block/block_'.$block );
				echo '</div>';
        		if ( $current_column == $col) { echo '</div>';}
			break;
			case 'style-2':
        		if ($current_column == 1) {echo '<div class="row">';}
        		if ($col>1) {echo '<div class="columns medium-'. 12/$col . '">';} else {echo '<div class="columns medium-12">';}
        		if ( $current_row == 1 ) { get_template_part( 'parts/block/block_'.$block); }
        		if ( $current_row > 1 ) { get_template_part( 'parts/block/block_6'); }
        		echo '</div><!--./columns-->';
        		if ( $current_column == $col) { echo '</div><!--./row-->';}
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
		endif;
		wp_reset_query();
		echo '<div class="clear"></div>';
	die();
}


/**
 * returns a string containing the numbers of words or chars for the content
 *
 * @param $post_content - the content thats need to be cut
 * @param $limit        - limit to cut
 * @param string $show_shortcodes - if shortcodes
 * @return string
 */
function cut_excerpt($post_content, $limit, $show_shortcodes = '') {
    //REMOVE shortscodes and tags
    if ($show_shortcodes == '') {
        $post_content = preg_replace('`\[[^\]]*\]`','',$post_content);
    }

    $post_content = stripslashes(wp_filter_nohtml_kses($post_content));

    /*only for problems when you need to remove links from content; not 100% bullet prof
    $post_content = htmlentities($post_content, null, 'utf-8');
    $post_content = str_replace("&nbsp;", "", $post_content);
    $post_content = html_entity_decode($post_content, null, 'utf-8');

    //$post_content = preg_replace('(((ht|f)tp(s?)\://){1}\S+)','',$post_content);//Radu A
    $pattern = "/[a-zA-Z]*[:\/\/]*[A-Za-z0-9\-_]+\.+[A-Za-z0-9\.\/%&=\?\-_]+/i";//radu o
    $post_content = preg_replace($pattern,'',$post_content);*/


    //excerpt for letters
    if (ot_get_option('excerpts_type') == 'letters') {

        $ret_excerpt = mb_substr($post_content, 0, $limit);
        if (mb_strlen($post_content)>=$limit) {
            $ret_excerpt = $ret_excerpt.'...';
        }

        //excerpt for words
    } else {
        /*removed and moved to check this first thing when reaches thsi function
         * if ($show_shortcodes == '') {
            $post_content = preg_replace('`\[[^\]]*\]`','',$post_content);
        }

        $post_content = stripslashes(wp_filter_nohtml_kses($post_content));*/

        $excerpt = explode(' ', $post_content, $limit);




        if (count($excerpt)>=$limit) {
            array_pop($excerpt);
            $excerpt = implode(" ",$excerpt).'...';
        } else {
            $excerpt = implode(" ",$excerpt);
        }


        $excerpt = esc_attr(strip_tags($excerpt));



        if (trim($excerpt) == '...') {
            return '';
        }

        $ret_excerpt = $excerpt;
    }
    return $ret_excerpt;
}


    function get_cut_excerpt($lenght = 25, $show_shortcodes = '') {
		global $post;
        if ($post->post_excerpt != '') {
            return $post->post_excerpt;
        }

        if (empty($lenght)) {
            $lenght = 25;
        }

        $assa = '';

        //remove [caption .... [/caption] from $pst->post_content
        $post_content = preg_replace("/\[caption(.*)\[\/caption\]/i", '', $post->post_content);

        $assa .= cut_excerpt($post_content, $lenght, $show_shortcodes);
        return $assa;
    }


    function get_item_scope_meta() {
    global $pst;
        $assa = '';
        $author_id = $pst->post_author;
        $assa .= '<meta content = "' . get_the_author_meta('display_name', $author_id) . '">';
        return $assa;
    }

    function get_blocks_author() {
    global $pst;
        $assa = '';
            $article_date_unix = get_the_time('U', $pst->post->ID);
            $assa .= '<span class="meta-author">';
                $assa .= '<i class="fa fa-user"></i>';
                $assa .= '&nbsp;';
                $assa .= '<a href="' . get_author_posts_url($pst->post_author) . '">' . get_the_author_meta('display_name', $pst->post_author) . '</a>' ;
            $assa .= '</span>';
        return $assa;
    }


    function get_blocks_date() {
        global $pst;
        $assa = '';
            $article_date_unix = get_the_time('U', $pst->post->ID);
            $assa .= '<span class="meta-date">';
            $assa .= '<i class="fa fa-calendar"></i>';
            $assa .= '&nbsp;';
            //$assa .= '<span class="entry-date updated published">' . get_the_time(get_option('date_format'), $pst->post->ID) . '</span>';
            $assa .= '<time class="entry-date updated published" datetime="' . date(DATE_W3C, $article_date_unix) . '" >' . get_the_time(get_option('date_format'), $pst->post->ID) . '</time>';
            $assa .= '</span>';
        return $assa;
    }

    function get_blocks_time_date() {
    global $post;
        $assa = '';
        $article_date_unix = get_the_time('U', $post->ID);
        $assa .= '<span class="meta-date">';
        //$assa .= '<span class="entry-date updated published">' . get_the_time(get_option('G:i'), $pst->post->ID) . ' / ' . get_the_time(get_option('date_format'), $pst->post->ID) . '</span>';
        $assa .= '<time class="entry-date updated published" datetime="' . date(DATE_W3C, $article_date_unix) . '" >' . get_the_time(get_option('G:i'), $post->ID) . ' / ' . get_the_time(get_option('date_format'), $post->ID) . '</time>';
        $assa .= '</span>';
        return $assa;
    }


    function get_blocks_cat() {
    global $pst;
        $assa = '';
        $assa .= '<span class="meta-category">';
		$assa .= '<i class="fa fa-folder-open"></i>';
		$assa .= '&nbsp;';
        $assa .= get_the_category_list(' / ', 'single',  $pst->post->ID );
        $assa .= '</span>';
        return $assa;
    }



    function get_blocks_views() {
    global $post;
        $assa = '';
        	$assa .= '<span class="meta-views">';
            $assa .= '<i class="fa fa-eye"></i>';
            $assa .= '&nbsp;';
        	$assa .= '<span class="entry-views post-' . $post->ID . '">' . get_post_meta($post->ID, 'views', true) .'</span>';
        	$assa .= '</span>';
        return $assa;
    }

    function get_blocks_comments() {
    global $pst;
        $assa = '';
        $assa .= '<span class="meta-comments">';
            $assa .= '<i class="fa fa-comments-o"></i>';
            $assa .= '&nbsp;';
            $assa .= '<a href="' . get_comments_link($pst->post->ID) . '">';
            $assa .= get_comments_number($pst->post->ID);
            $assa .= '</a>';
        $assa .= '</span>';
        return $assa;
    }


   function get_blocks_thumb($thumbsize) { ?>

	<div class="post-thumbnail">
			<a href="<?php the_permalink(); ?>" title="<?php the_title(); ?>">
				<?php if ( has_post_thumbnail() ) :  ?>
					<?php the_post_thumbnail($thumbsize); ?>
				<?php else : ?>
					<img src="<?php echo get_template_directory_uri(); ?>/assets/images/<?php echo $thumbsize;?>.jpg" alt="<?php the_title(); ?>" />
				<?php endif; ?>
				<?php if ( has_post_format('video') && ! is_sticky() ) { echo'<span class="thumb-icon small"><i class="fa fa-play"></i></span>'; } ?>
				<?php if ( has_post_format('audio') && ! is_sticky() ) { echo'<span class="thumb-icon small"><i class="fa fa-volume-up"></i></span>'; } ?>
				<?php if ( is_sticky() ) { echo'<span class="thumb-icon small"><i class="fa fa-star"></i></span>'; } ?>
			</a>
	</div>

<?php
   }


   function get__thumb($thumbsize) { ?>
<a href="<?php the_permalink(); ?>" title="<?php the_title(); ?>">
	<div class="post-thumbnail clearfix">
		<?php if ( has_post_thumbnail() ) :  ?>
			<?php the_post_thumbnail($thumbsize); ?>
		<?php else : ?>
			<img src="<?php echo get_template_directory_uri(); ?>/assets/images/no-thumb/<?php echo $thumbsize;?>.png" alt="<?php the_title(); ?>" />
		<?php endif; ?>
	</div>
</a>
<?php
   }

    function get_blocks_image($thumbsize) {
    global $pst;
        $assa = '';
		$placeholder = ot_get_option('placeholder');

        if (has_post_thumbnail()) {
            $post_has_thumb = true;
        } else {
            $post_has_thumb = false;
        }


        if ($post_has_thumb or ($placeholder == 'on')) {
            if ($post_has_thumb) {
                $attach_id = get_post_thumbnail_id($pst->post->ID);
                $temp_image_url = wp_get_attachment_image_src($attach_id, $thumbsize);
                $attach_alt = get_post_meta($attach_id, '_wp_attachment_image_alt', true );
                $attach_alt = 'alt="' . esc_attr(strip_tags($attach_alt)) . '"';
                $attach_title = ' title="' . get_the_title($pst->post->ID) . '"';
                if (empty($temp_image_url[0])) {
                    $temp_image_url[0] = '';
                }
                if (empty($temp_image_url[1])) {
                    $temp_image_url[1] = '';
                }
                if (empty($temp_image_url[2])) {
                    $temp_image_url[2] = '';
                }
            } else {
                  global $_wp_additional_image_sizes;
                $temp_image_url[1] = $_wp_additional_image_sizes[$thumbsize]['width'];
                $temp_image_url[2] = $_wp_additional_image_sizes[$thumbsize]['height'];

                $temp_image_url[0] = get_template_directory_uri() . '/assets/images/no-thumb/' . $thumbsize . '.png';
                $attach_alt = '';
                $attach_title = '';
            } //end    if ($this->post_has_thumb) {

            $assa .= '<div class="thumb-wrap">';
                if (current_user_can('edit_posts')) {
                    $assa .= '<small class="edit-link"><a class="post-edit-link" href="' . get_edit_post_link($pst->post->ID) . '"><i class="fa fa-edit"></i></a></small>';
                }

                $assa .='<a href="' . get_permalink($pst->post->ID) . '" rel="bookmark" title="' . esc_attr(strip_tags(get_the_title($pst->post->ID))) . '">';
                $assa .= '<img width="' . $temp_image_url[1] . '" height="' . $temp_image_url[2] . '" class="entry-thumb" src="' . $temp_image_url[0] . '" ' . $attach_alt . $attach_title . '/>';
                $assa .= '</a>';
            $assa .= '</div>'; //end wrapper

            return $assa;
        }
    }




    function get_blocks_title($excerpt_lenght = '') {
    //global $pst;
        $assa = '';
        $assa .= '<h3 class="entry-title">';
        $assa .='<a href="' . get_permalink() . '" rel="bookmark" title="' . esc_attr(strip_tags(get_the_title())) . '">';
        if (!empty($excerpt_lenght)) {
            $assa .= cut_excerpt(get_the_title(), $excerpt_lenght, 'show_shortcodes');
        } else {
            $assa .= get_the_title();
        }
        $assa .='</a>';
        $assa .= '</h3>';
        return $assa;
    }

    function get_blocks_excerpt($lenght = 25, $show_shortcodes = '') {
		global $post;
        if (empty($lenght)) { $lenght = 25; }
        $assa = '';

        if ($post->post_excerpt != '') {
            return $post->post_excerpt;
        }

        //remove [caption .... [/caption] from $pst->post_content
        $post_content = preg_replace("/\[caption(.*)\[\/caption\]/i", '', $post->post_content );
        $assa .= cut_excerpt($post_content, $lenght, $show_shortcodes);
        return $assa;
    }


function get_block_sub_cats($category_id) {
        $assa='';
        if (!empty($category_id)) {

            $subcategories = get_categories(array('child_of' => $category_id));

            if (!empty($subcategories)) {

                $assa .= '<ul class="child-cats">';

                foreach ($subcategories as $category) {
                       $assa .= '<li><a href="' . get_category_link($category->cat_ID) . '">' . $category->name . '</a></li>';
                }
                $assa .= '</ul>';
            }
        }
        return $assa;
}

?>