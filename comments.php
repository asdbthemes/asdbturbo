<?php
/**
 * The template for displaying comments.
 *
 * This is the template that displays the area of the page that contains both the current comments
 * and the comment form.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package asdbTurbo
 */

/*
 * If the current post is protected by a password and
 * the visitor has not yet entered the password we will
 * return early without loading the comments.
 */

if ( post_password_required() ) {return;}
?>

<section id="comments" class="row themeform no-mobile">

	<?php if ( have_comments() ) : global $wp_query; ?>

		<ul class="tabs" data-tabs id ="comment-tabs">
			<li class="tabs-title is-active"><a href="#commentlist" aria-selected="true"><i class="fa fa-comments"></i><?php _e( 'Comments', 'asdbturbo' ); ?><span><?php echo count($wp_query->comments_by_type['comment']); ?></span></a></li>
			<li class="tabs-title"><a href="#pinglist"><i class="fa fa-link"></i><?php _e( 'Pingbacks', 'asdbturbo' ); ?><span><?php echo count($wp_query->comments_by_type['pings']); ?></span></a></li>
		</ul>

	<div class="tabs-content" data-tabs-content="comment-tabs">
		<?php if ( ! empty( $comments_by_type['comment'] ) ) { ?>
		<div class="tabs-panel is-active" id="commentlist">

			<ul class="commentlist">
				<?php
		wp_list_comments(
			array(
				'walker'            => new wpb_Comments(),
				'max_depth'         => '5',
				'style'             => '',
				'callback'          => null,
				'end-callback'      => null,
				'type'              => 'all',
				'reply_text'        => __( 'Reply', 'asdb' ),
				'page'              => '',
				'per_page'          => '',
				'avatar_size'       => 48,
				'reverse_top_level' => null,
				'reverse_children'  => '',
				'format'            => 'html5',
				'short_ping'        => false,
				'echo'  	    => true,
				'moderation' 	    => __( 'Your comment is awaiting moderation.', 'asdb' ),
			)
		);
?>

			</ul><!--/.commentlist-->

			<?php if ( get_comment_pages_count() > 1 && get_option('page_comments') ) : ?>
			<nav class="comments-nav group">
				<div class="nav-previous"><?php previous_comments_link(); ?></div>
				<div class="nav-next"><?php next_comments_link(); ?></div>
			</nav><!--/.comments-nav-->
			<?php endif; ?>

		</div>
		<?php  } ?>

		<?php  if ( ! empty( $comments_by_type['pings'] ) ) { ?>
		<div class="tabs-panel" id="pinglist">

			<ol class="pinglist">
				<?php // not calling wp_list_comments twice, as it breaks pagination
				$pings = $comments_by_type['pings'];
				foreach ($pings as $comment ) { ?>
					<li class="ping">
						<div class="ping-link"><?php comment_author_link($comment); ?></div>
						<div class="ping-meta"><?php comment_date( get_option( 'date_format' ), $comment ); ?></div>
						<div class="ping-content"><?php comment_text($comment); ?></div>
					</li>
				<?php } ?>
			</ol><!--/.pinglist-->

		</div>
	</div>
		<?php } ?>

	<?php else : // if there are no comments yet ?>

		<?php if (comments_open() ) : ?>
			<!-- comments open, no comments -->
		<?php else : ?>
			<!-- comments closed, no comments -->
		<?php endif; ?>

	<?php endif; ?>

	<?php if ( comments_open() ) {

$args = array(
	'fields'               => array(
								'author' => '<p class="medium-4 medium-pull-12 columns comment-form-author">' .
											'<input id="author" placeholder="' . __( 'Name *' ) . '" name="author" type="text" value="' . esc_attr( $commenter['comment_author'] ) . '" size="30" /></p>',
								'email'  => '<p class="medium-4 medium-pull-12 columns comment-form-email">' .
											'<input id="email" placeholder="' . __( 'Email *' ) . '" name="email" type="email"  value="' . esc_attr(  $commenter['comment_author_email'] ) . '" size="30" aria-describedby="email-notes" /></p>',
							),
	'comment_field'        => '<p class="medium-8 medium-push-4 columns comment-form-comment"><textarea id="comment" name="comment" placeholder="' . _x( 'Comment', 'asdb' ) . '" cols="45" rows="7"  aria-required="true" required="required"></textarea></p>',
	'must_log_in'          => '<p class="must-log-in"><small>' . sprintf( __( 'You must be <a href="%s">logged in</a> to post a comment.' ), wp_login_url( apply_filters( 'the_permalink', get_permalink( $post->ID ) ) ) ) . '</small></p>',
	'logged_in_as'         => '<p class="logged-in-as"><small>' . sprintf( __( '<a href="%1$s" aria-label="Logged in as %2$s. Edit your profile.">Logged in as %2$s</a>. <a href="%3$s">Log out?</a>' ), get_edit_user_link(), $user_identity, wp_logout_url( apply_filters( 'the_permalink', get_permalink( $post->ID ) ) ) ) . '</small></p>',
	'comment_notes_before' => '<p class="comment-notes"><small><span id="email-notes">' . __( 'Your email address will not be published.' ) . '</span>'.  $req . '</small></p>',
	'comment_notes_after'  => '',
	'id_form'              => 'commentform',
	'id_submit'            => 'submit',
	'class_form'           => 'comment-form',
	'class_submit'         => 'submit',
	'name_submit'          => 'submit',
	'title_reply'          => __( 'Leave a Reply' ),
	'title_reply_to'       => __( 'Leave a Reply to %s' ),
	'title_reply_before'   => '<h4 id="reply-title" class="comment-reply-title">',
	'title_reply_after'    => '</h4>',
	'cancel_reply_before'  => ' <small>',
	'cancel_reply_after'   => '</small>',
	'cancel_reply_link'    => __( 'Cancel reply' ),
	'label_submit'         => __( 'Post Comment' ),
	'submit_button'        => '<input name="%1$s" type="submit" id="%2$s" class="button %3$s" value="%4$s" />',
	'submit_field'         => '<p class="form-submit medium-4 medium-pull-12 columns">%1$s %2$s</p>',
	'format'               => 'xhtml',
);

comment_form($args); } ?>

</section><!--/#comments-->