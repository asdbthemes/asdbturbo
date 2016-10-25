<?php
if ( ! class_exists( 'wpb_Comments' ) ) :
class wpb_Comments extends Walker_Comment{

	// Init classwide variables.
	var $tree_type = 'comment';
	var $db_fields = array( 'parent' => 'comment_parent', 'id' => 'comment_ID' );

	/** CONSTRUCTOR
	 * You'll have to use this if you plan to get to the top of the comments list, as
	 * start_lvl() only goes as high as 1 deep nested comments */
	function __construct() { ?>

        <ol class="comment-list">

    <?php }

	/** START_LVL
	 * Starts the list before the CHILD elements are added. */
	function start_lvl( &$output, $depth = 0, $args = array() ) {
		$GLOBALS['comment_depth'] = $depth + 1; ?>

                <ul class="children">
    <?php }

	/** END_LVL
	 * Ends the children list of after the elements are added. */
	function end_lvl( &$output, $depth = 0, $args = array() ) {
		$GLOBALS['comment_depth'] = $depth + 1; ?>

		</ul><!-- /.children -->

    <?php }

	/** START_EL */
	function start_el( &$output, $comment, $depth = 0, $args = array(), $id = 0 ) {
		$depth++;
		$GLOBALS['comment_depth'] = $depth;
		$GLOBALS['comment'] = $comment;
		$parent_class = ( empty( $args['has_children'] ) ? '' : 'parent' );
// Счетчик комментариев: $cnum - верхний уровень, $cnum_inner - вложенные
global $cnum, $incnum, $comment_depth;
// определяем первый номер, если включено разделение на страницы
$per_page = isset($args['per_page']) ? $args['per_page'] : $GLOBALS['wp_query']->query_vars['comments_per_page'];
if ( $per_page && ! isset($cnum) ) {
	$com_page = (int) $GLOBALS['wp_query']->query_vars['cpage'];
	if ( $com_page > 1 ) {
			$cnum = ($com_page -1) * (int) $per_page; }
}
// счетчик
if ($comment_depth > 1 ) {
	$cnum_inner = '.'. $incnum++;
} else {
	$cnum++;
	$incnum = 1;
	$cnum_inner = '.0';
}

		?>

        <li <?php comment_class( $parent_class ); ?> id="comment-<?php comment_ID() ?>">
            <article id="comment-body-<?php comment_ID() ?>" class="comment-body">


		<header class="comment-header">

			<p class="comment-meta">

			<?php printf( __( '<citate class="fn">%s</citate>', 'asdbbase' ), get_comment_author_link() ) ?>
			<time datetime="<?php echo comment_date( 'c' ) ?>"><a href="<?php echo htmlspecialchars( get_comment_link( get_comment_ID() ) ) ?>"><?php comment_date(); ?> at <?php comment_time(); ?></a></time>
			<?php edit_comment_link( '<i class="fa fa-edit alert"></i>' ); ?>


		<span class="right">
			<span class="comments-num"><span class="cnum"><?php echo $cnum ?></span><sub><?php echo $cnum_inner ?></sub></span>

		</span><!-- /.pull-right -->

			</p><!-- /.comment-meta -->


		</header>

                <div class="avatar"><?php echo get_avatar( $comment, $args['avatar_size'] ); ?></div>
                <section id="comment-content-<?php comment_ID(); ?>" class="comment">

                    <?php if ( ! $comment->comment_approved ) : ?>
                <div class="notice">
					<p class="bottom"><?php _e( 'Your comment is awaiting moderation.' ); ?></p>
				</div>
                    <?php else : comment_text(); ?>
                    <?php endif; ?>
                </section><!-- /.comment-content -->

        <footer>
            <span class="reply pull-right">
                <?php $reply_args = array(
					'depth' => $depth,
					'max_depth' => $args['max_depth'],
					'before' => '<span class="btn bg-success">',
					'after' => '</span>',
					);

				comment_reply_link( array_merge( $args, $reply_args ) );  ?>
            </span><!-- /.reply -->
        </footer>

            </article><!-- /.comment-body -->
    <?php }

	function end_el(& $output, $comment, $depth = 0, $args = array() ) { ?>

        </li><!-- /#comment-' . get_comment_ID() . ' -->

    <?php }

	/** DESTRUCTOR */
	function __destruct() { ?>

    </ol><!-- /#comment-list -->

    <?php }
}
endif;
