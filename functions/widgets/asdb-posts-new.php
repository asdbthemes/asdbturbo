<?php
/*
	AsdbPosts Widget

	License: GNU General Public License v3.0
	License URI: http://www.gnu.org/licenses/gpl-3.0.html

	Copyright: (c) 2015 Mikhail "kitassa" Tkacheff - http://tkacheff.ru

		@package AsdbPosts
		@version 1.0.1
*/

class AsdbPosts extends WP_Widget {

/*  Constructor
/* ------------------------------------ */
	function AsdbPosts() {
		parent::__construct( false, 'ASDB Posts', array('description' => 'Display posts from a category', 'classname' => 'widget_asdb_posts') );;
	}

/*  Widget
/* ------------------------------------ */
	public function widget($args, $asdbpost) {
	    global $pst;
		extract( $args );
		$asdbpost['title']?NULL:$asdbpost['title']='';
		$asdbpost['title_all']?NULL:$asdbpost['title_all']='';
		$asdbpost['title_url']?NULL:$asdbpost['title_url']='#';
//		$loadmore=$asdbpost['loadmore']?$asdbpost['loadmore']:'0';
		$title = apply_filters('widget_title',$asdbpost['title']);
		$before_title='<h3 class="widget-title">';
		$after_title='</h3>';
		$block_id='block_id_'.rand(1000, 9999);
		$posts_style =$asdbpost['posts_style']?$asdbpost['posts_style']:'block_1';
		$output = $before_widget."\n";

		if ($asdbpost['title_url'])
			$title_all ='<span class="title_all"><a href="'. $asdbpost['title_url'] .'">'. $asdbpost['title_all'].'</a></span>';

		if($title)
			$output .= $before_title.$title.$title_all.$after_title;
		ob_start(); ?>

	<?php
		$pst = new WP_Query( array(
		'no_found_rows'				=> false,
		'update_post_meta_cache'	=> false,
		'update_post_term_cache'	=> false,
			'post_type'				=> array( $asdbpost['posts_type'] ),
			'showposts'				=> $asdbpost['posts_num'],
//			'post_per_page'			=> 3,
			'cat'					=> $asdbpost['posts_cat_id'],
			'ignore_sticky_posts'	=> true,
			'orderby'				=> $asdbpost['posts_orderby'],
			'order'					=> 'dsc',
			'tag'					=> $asdbpost['posts_tags'],
			'date_query' => array(
				array(
					'after' => $asdbpost['posts_time'],
				),
			),
		) );
	?>

<?php
?>
<?php if ($asdbpost['loadmore'] == 1 ) { ?>
<script>
jQuery(function($){
<?php if (  $pst->max_num_pages > 1 ) : ?>
	var ajaxurl = '<?php echo site_url() ?>/wp-admin/admin-ajax.php';
	var asdb_posts = '<?php echo serialize($pst->query_vars); ?>';
	var current_page = <?php echo (get_query_var('paged')) ? get_query_var('paged') : 1; ?>;
	var max_pages = '<?php echo $pst->max_num_pages; ?>';
<?php endif; ?>
	$('#asdb_loadmore_<?php echo $block_id;?>').click(function(){
		$(this).text('<?php _e("Loading...", "asdbturbo"); ?>');
		var data = {
			'action': 'loadmore',
			'query': asdb_posts,
			'page' : current_page,
			'thumb': '<?php echo $asdbpost['posts_thumb']?$asdbpost['posts_thumb']:'no-thumb' ?>',
			'style': '<?php echo $asdbpost['posts_style']?$asdbpost['posts_style']:'block_1' ?>',
			'category':'<?php echo $asdbpost['posts_category']?$asdbpost['posts_category']:'0' ?>',
			'tags':'<?php echo $asdbpost['posts_tags']?$asdbpost['posts_tags']:'0' ?>',
			'date':'<?php echo $asdbpost['posts_date']?$asdbpost['posts_date']:'0' ?>',
			'excerpt':'<?php echo $asdbpost['posts_excerpt']?$asdbpost['posts_excerpt']:'0' ?>',
			'readmore':'<?php echo $asdbpost['posts_readmore']?$asdbpost['posts_readmore']:'0' ?>'
		};
		$.ajax({
			url:ajaxurl,
			data:data,
			type:'POST',
			success:function(data){
				if( data ) {
					$('#asdb_loadmore_<?php echo $block_id;?>').text('<?php _e("Load more", "asdbturbo"); ?>').parent().before(data);
					current_page++;
					if (current_page == max_pages) $("#asdb_loadmore_<?php echo $block_id;?>").remove();
				} else {
					$('#asdb_loadmore_<?php echo $block_id;?>').remove();
				}
			}
		});
	});
});
</script>
<?php } ?>
	<div class="asdb-posts <?php if ($asdbpost['posts_thumb'] ) { echo 'thumbs-enabled'; } ?> <?php if ($asdbpost['posts_excerpt'] ) { echo 'excerpt-enabled'; } ?>">

		<?php while ($pst->have_posts() ) : $pst->the_post(); ?>
	<article class="post">
		<div class="post-hover group">
			<?php get_template_part('parts/block/'.$posts_style ); ?>
		</div>
	</article>
		<?php endwhile; ?>
		<?php wp_reset_postdata(); ?>
<?php if ($asdbpost['loadmore'] == 1 ) { ?>
<div class="loadmore-wrap">
	<a id="asdb_loadmore_<?php echo $block_id;?>" class="button small secondry loadmore" data-perpage="<?php echo $asdbpost['posts_num'];?>" data-category="<?php echo $asdbpost['posts_cat_id'];?>"><?php _e('Load more', 'asdbturbo'); ?></a>
</div>
<?php } ?>
	</div><!--./asdb-posts-->
<?php
		$output .= ob_get_clean();
		$output .= $after_widget."\n";
		echo $output;
	}

/*  Widget update
/* ------------------------------------ */
	public function update($new,$old) {
		$asdbpost = $old;
		$asdbpost['title'] = strip_tags($new['title']);
		$asdbpost['title_all'] = strip_tags($new['title_all']);
		$asdbpost['title_url'] = strip_tags($new['title_url']);
	// Posts
		$asdbpost['posts_thumb'] = $new['posts_thumb']?1:0;
		$asdbpost['posts_category'] = $new['posts_category']?1:0;
		$asdbpost['posts_date'] = $new['posts_date']?1:0;
		$asdbpost['posts_excerpt'] = $new['posts_excerpt']?1:0;
		$asdbpost['posts_readmore'] = $new['posts_readmore']?1:0;
		$asdbpost['loadmore'] = $new['loadmore']?1:0;
		$asdbpost['posts_num'] = strip_tags($new['posts_num']);
		$asdbpost['posts_type'] = strip_tags($new['posts_type']);
		$asdbpost['posts_style'] = strip_tags($new['posts_style']);
		$asdbpost['posts_cat_id'] = strip_tags($new['posts_cat_id']);
		$asdbpost['posts_tags'] = strip_tags($new['posts_tags']);
		$asdbpost['posts_orderby'] = strip_tags($new['posts_orderby']);
		$asdbpost['posts_time'] = strip_tags($new['posts_time']);
		return $asdbpost;
	}

/*  Widget form
/* ------------------------------------ */
	public function form($asdbpost) {
		// Default widget settings
		$defaults = array(
			'title' 			=> '',
			'posts_type' 		=> 'post',
			'posts_style' 		=> 'block_1',
			'posts_thumb' 		=> 1,
			'posts_category'	=> 1,
			'posts_date'		=> 1,
			'posts_excerpt'		=> 1,
			'posts_readmore'	=> 0,
			'loadmore'			=> 0,
			'posts_num' 		=> '4',
			'posts_cat_id' 		=> '0',
			'posts_tags' 		=> '',
			'posts_orderby' 	=> 'date',
			'posts_time' 		=> '0',
		);
		$asdbpost = wp_parse_args( (array) $asdbpost, $defaults );
?>

	<style>
	.widget .widget-inside .asdb-options-posts .postform { width: 100%; }
	.widget .widget-inside .asdb-options-posts p { margin: 3px 0; }
	.widget .widget-inside .asdb-options-posts hr { margin: 20px 0 10px; }
	.widget .widget-inside .asdb-options-posts h4 { margin-bottom: 10px; }
	</style>

	<div class="asdb-options-posts">
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id('title') ); ?>">Title:</label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id('title') ); ?>" name="<?php echo esc_attr( $this->get_field_name('title') ); ?>" type="text" value="<?php echo esc_attr( $asdbpost["title"] ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id('title_all') ); ?>">All post:</label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id('title_all') ); ?>" name="<?php echo esc_attr( $this->get_field_name('title_all') ); ?>" type="text" value="<?php echo esc_attr( $asdbpost["title_all"] ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id('title_url') ); ?>">All post URL:</label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id('title_url') ); ?>" name="<?php echo esc_attr( $this->get_field_name('title_url') ); ?>" type="text" value="<?php echo esc_attr( $asdbpost["title_url"] ); ?>" />
		</p>

		<h4>List Posts</h4>


		<?php
$args=array(
  'public'   => true,
  '_builtin' => false
);
$output = 'names'; // names or objects, note names is the default
$operator = 'and'; // 'and' or 'or'
$stdpost=array('post' => 'post');
$post_types=get_post_types( $args, $output, $operator );
$post_style = array ('Style 1' => 'block_1', 'Style 2' => 'block_2', 'Style 3' => 'block_3', 'Style 4' => 'block_4');
$pts = array_merge ($stdpost, $post_types);

		?>
		<p>
			<label style="width: 55%; display: inline-block;" for="<?php echo esc_attr( $this->get_field_id("posts_num") ); ?>">Items to show</label>
			<input style="width:20%;" id="<?php echo esc_attr( $this->get_field_id("posts_num") ); ?>" name="<?php echo esc_attr( $this->get_field_name("posts_num") ); ?>" type="text" value="<?php echo absint($asdbpost["posts_num"]); ?>" size='3' />
		</p>
		<hr>
		<p style="padding-top: 0.3em;">
			<label style="width: 100%; display: inline-block;" for="<?php echo esc_attr( $this->get_field_id("posts_type") ); ?>">Post Type:</label>
			<select style="width: 100%;" id="<?php echo esc_attr( $this->get_field_id("posts_type") ); ?>" name="<?php echo esc_attr( $this->get_field_name("posts_type") ); ?>">
			<?php foreach ($pts  as $post_type ) { ?>
			<option value="<?php echo $post_type; ?>" <?php selected( $asdbpost["posts_type"], $post_type ); ?>><?php echo $post_type; ?></option>
			<?php } ?>
			</select>
		</p>
		<p style="padding-top: 0.3em;">
			<label style="width: 100%; display: inline-block;" for="<?php echo esc_attr( $this->get_field_id("posts_style") ); ?>">Block Style:</label>
			<select style="width: 100%;" id="<?php echo esc_attr( $this->get_field_id("posts_style") ); ?>" name="<?php echo esc_attr( $this->get_field_name("posts_style") ); ?>">
			<?php foreach ($post_style  as $style =>$blockid) { ?>
			<option value="<?php echo $blockid; ?>" <?php selected( $asdbpost["posts_style"], $blockid ); ?>><?php echo $style; ?></option>
			<?php } ?>
			</select>
		</p>
		<p>
			<label style="width: 100%; display: inline-block;" for="<?php echo esc_attr( $this->get_field_id("posts_cat_id") ); ?>">Category:</label>
			<?php wp_dropdown_categories( array( 'name' => $this->get_field_name("posts_cat_id"), 'selected' => $asdbpost["posts_cat_id"], 'show_option_all' => 'All', 'show_count' => true ) ); ?>
		</p>
		<p>
			<label style="width: 100%; display: inline-block;" for="<?php echo esc_attr( $this->get_field_id("posts_tags") ); ?>">Tags slug</label>
			<input style="width:100%;" id="<?php echo esc_attr( $this->get_field_id("posts_tags") ); ?>" name="<?php echo esc_attr( $this->get_field_name("posts_tags") ); ?>" type="text" value="<?php echo $asdbpost["posts_tags"]; ?>" />
		</p>
		<p style="padding-top: 0.3em;">
			<label style="width: 100%; display: inline-block;" for="<?php echo esc_attr( $this->get_field_id("posts_orderby") ); ?>">Order by:</label>
			<select style="width: 100%;" id="<?php echo esc_attr( $this->get_field_id("posts_orderby") ); ?>" name="<?php echo esc_attr( $this->get_field_name("posts_orderby") ); ?>">
			  <option value="date"<?php selected( $asdbpost["posts_orderby"], "date" ); ?>>Most recent</option>
			  <option value="comment_count"<?php selected( $asdbpost["posts_orderby"], "comment_count" ); ?>>Most commented</option>
			  <option value="rand"<?php selected( $asdbpost["posts_orderby"], "rand" ); ?>>Random</option>
			</select>
		</p>
		<p style="padding-top: 0.3em;">
			<label style="width: 100%; display: inline-block;" for="<?php echo esc_attr( $this->get_field_id("posts_time") ); ?>">Posts from:</label>
			<select style="width: 100%;" id="<?php echo esc_attr( $this->get_field_id("posts_time") ); ?>" name="<?php echo esc_attr( $this->get_field_name("posts_time") ); ?>">
			  <option value="0"<?php selected( $asdbpost["posts_time"], "0" ); ?>>All time</option>
			  <option value="1 year ago"<?php selected( $asdbpost["posts_time"], "1 year ago" ); ?>>This year</option>
			  <option value="1 month ago"<?php selected( $asdbpost["posts_time"], "1 month ago" ); ?>>This month</option>
			  <option value="1 week ago"<?php selected( $asdbpost["posts_time"], "1 week ago" ); ?>>This week</option>
			  <option value="1 day ago"<?php selected( $asdbpost["posts_time"], "1 day ago" ); ?>>Past 24 hours</option>
			</select>
		</p>

		<hr>
		<h4>Post Info</h4>

		<p>
			<input type="checkbox" class="checkbox" id="<?php echo esc_attr( $this->get_field_id('posts_thumb') ); ?>" name="<?php echo esc_attr( $this->get_field_name('posts_thumb') ); ?>" <?php checked( (bool) $asdbpost["posts_thumb"], true ); ?>>
			<label for="<?php echo esc_attr( $this->get_field_id('posts_thumb') ); ?>">Show thumbnails</label>
		</p>
		<p>
			<input type="checkbox" class="checkbox" id="<?php echo esc_attr( $this->get_field_id('posts_category') ); ?>" name="<?php echo esc_attr( $this->get_field_name('posts_category') ); ?>" <?php checked( (bool) $asdbpost["posts_category"], true ); ?>>
			<label for="<?php echo esc_attr( $this->get_field_id('posts_category') ); ?>">Show categories</label>
		</p>
		<p>
			<input type="checkbox" class="checkbox" id="<?php echo esc_attr( $this->get_field_id('posts_date') ); ?>" name="<?php echo esc_attr( $this->get_field_name('posts_date') ); ?>" <?php checked( (bool) $asdbpost["posts_date"], true ); ?>>
			<label for="<?php echo esc_attr( $this->get_field_id('posts_date') ); ?>">Show dates</label>
		</p>
		<p>
			<input type="checkbox" class="checkbox" id="<?php echo esc_attr( $this->get_field_id('posts_excerpt') ); ?>" name="<?php echo esc_attr( $this->get_field_name('posts_excerpt') ); ?>" <?php checked( (bool) $asdbpost["posts_excerpt"], true ); ?>>
			<label for="<?php echo esc_attr( $this->get_field_id('posts_excerpt') ); ?>">Show excerpt</label>
		</p>
		<p>
			<input type="checkbox" class="checkbox" id="<?php echo esc_attr( $this->get_field_id('posts_readmore') ); ?>" name="<?php echo esc_attr( $this->get_field_name('posts_readmore') ); ?>" <?php checked( (bool) $asdbpost["posts_readmore"], true ); ?>>
			<label for="<?php echo esc_attr( $this->get_field_id('posts_readmore') ); ?>">Show readmore</label>
		</p>
		<p>
			<input type="checkbox" class="checkbox" id="<?php echo esc_attr( $this->get_field_id('loadmore') ); ?>" name="<?php echo esc_attr( $this->get_field_name('loadmore') ); ?>" <?php checked( (bool) $asdbpost['loadmore'], true ); ?>>
			<label for="<?php echo esc_attr( $this->get_field_id('loadmore') ); ?>">Show Loadmore</label>
		</p>

		<hr>

	</div>
<?php

}

}

/*  Register widget
/* ------------------------------------ */
if ( ! function_exists( 'asdb_register_widget_posts' ) ) {

	function asdb_register_widget_posts() {
		register_widget( 'AsdbPosts' );
	}

}
add_action( 'widgets_init', 'asdb_register_widget_posts' );
add_action('wp_ajax_loadmore', 'asdbload_posts');
add_action('wp_ajax_nopriv_loadmore', 'asdbload_posts');

function asdbload_posts(){
	global $pst;
	$args = unserialize(stripslashes($_POST['query']));
	$args['paged'] = $_POST['page'] + 1; // следующая страница
	$args['post_status'] = 'publish';
	$posts_thumb = $_POST['thumb'];
	$posts_date = $_POST['date'];
	$posts_category = $_POST['category'];
	$posts_excerpt = $_POST['excerpt'];
	$posts_readmore = $_POST['readmore'];
	$posts_style = $_POST['style'];

	$pst = new WP_Query($args);
	if( $pst->have_posts() ):
		while($pst->have_posts()): $pst->the_post();
			?>
	<article class="post">
		<div class="post-hover group">
		<?php get_template_part('parts/block/'.$posts_style ); ?>
		</div>
	</article>
			<?php
		endwhile;
	endif;
	wp_reset_postdata();
	die();
}
