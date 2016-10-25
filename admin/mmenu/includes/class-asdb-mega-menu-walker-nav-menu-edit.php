<?php
/**
 * Mega Menu Nav Walker.
 *
 * @package ASDB_Mega_Menu
 */

if ( ! class_exists( 'ASDB_Mega_Menu_Walker_Nav_Menu_Edit' ) ) {
	require_once ABSPATH . 'wp-admin/includes/nav-menu.php'; // We'll need the nav menu stuff here.

	/**
	 * Nav walker customizations.
	 *
	 * @package  ASDB_Mega_Menu
	 * @since  0.1.0
	 * @uses Walker_Nav_Menu_Edit
	 */
	class ASDB_Mega_Menu_Walker_Nav_Menu_Edit extends Walker_Nav_Menu_Edit {
		/**
		 * Override the start of elements in the walker.
		 *
		 * @param string $output (Required) Passed by reference. Used to append additional content.
		 * @param object $item   (Required) Menu item data object.
		 * @param int    $depth  (Required) Depth of menu item. Used for padding.
		 * @param array  $args   Not used.
		 * @param int    $id     Not used.
		 * @since 0.1.0
		 */
		function start_el( &$output, $item, $depth = 0, $args = array(), $id = 0 ) {
			$item_output = '';

			parent::start_el( $item_output, $item, $depth, $args );

			$new_fields  = $this->field_display( $item->ID, array(
				'args'        => $args,
				'depth'       => $depth,
				'item'        => $item,
				'item_output' => $item_output,
			) );

			$item_output = preg_replace( '/(?=<p[^>]+class="[^"]*field-move)/', $new_fields, $item_output );
			$output .= $item_output;

		}

		/**
		 * Create the markup for our custom field
		 *
		 * @param  int   $id   Menu item ID.
		 * @param  array $args Array of arguments passed from start_el.
		 * @return string      The markup for the custom field.
		 * @since  0.1.0
		 */
		public function field_display( $id, $args = array() ) {
			ob_start();

			$args = wp_parse_args( $args, array(
				'args'        => array(),
				'depth'       => false,
				'item'        => false,
				'item_output' => false,
			) );

			// Disable on obile.
			if ( isset( $args['depth'] ) && false == $args['depth'] ) :
				$hide_on_mobile = get_post_meta( $id, 'hide_menu_on_mobile', true );
				?>
					<div class="description description-wide">
					<p>
						<div class="hide-menu-on-mobile">
							<label for="hide-menu-on-mobile">
								<input type="checkbox" <?php echo ( $hide_on_mobile ) ? 'checked="checked"' : ''; ?> name="hide-menu-on-mobile[<?php echo absint( $id ); ?>]" /> <?php esc_html_e( 'Hide this on mobile?', 'asdbturbo' ); ?>
							</label>
						</div>
					</p>
				    <hr>
					</div>

				<?php
			endif;
			/**
			 * Filter what depths these custom fields are allowed on.
			 *
			 * E.g.
			 *
			 *     function my_filter( $depth ) {
			 *     	return array( 1 ); // Only allow at depth 1
			 *     }
			 *     add_filter( 'asdb_mega_menu_walker_nav_menu_edit_allowed_depths', 'my_filter' );
			 */
			$allowed_depths = apply_filters( 'asdb_mega_menu_walker_nav_menu_edit_allowed_depths', array() );
			if ( ! empty( $allowed_depths ) && in_array( $args['depth'], $allowed_depths ) ) :

				$img_id  = get_post_thumbnail_id( $id );
				$img_url = wp_get_attachment_image_src( $img_id, 'large' );
				?>
					<!--
					<p class="description description-wide">
						<p class="description"><?php esc_html_e( 'Menu Item Icon', 'asdb-mega-menu' ); ?></p>
							<select id="<?php echo esc_attr( absint( $id ) ); ?>_icon" name="menu-item-icon[<?php echo esc_attr( absint( $id ) ); ?>]">
								<?php $current_value = get_post_meta( $id, '_menu_item_icon', true ); ?>
								<option value=""<?php selected( $current_value, '' ); ?>><?php esc_html_e( '- No Icon -', 'asdb-mega-menu' ); ?></option>
								<?php
								$options = $this->get_svg_list();
								foreach ( $options as $slug => $name ) {
									echo '<option value="' . esc_attr( $slug ) . '"' . selected( esc_attr( $slug ), $current_value, false ) . '>' . esc_html( $slug ) . '</option>';
								}
								?>
							</select>
					</p>

					<p class="description description-wide">
						<p class="description">
							<?php esc_html_e( 'Menu Item Image', 'asdb-mega-menu' ); ?><br />
							<small><?php esc_html_e( 'Images should be 130px wide by 250px high to prevent cropping.', 'asdb-mega-menu' ); ?></small>
						</p>
						<p class="hide-if-no-js">
							<button title="<?php esc_html_e( 'Set Menu Item Image', 'asdb-mega-menu' ); ?>" href="javascript:void(0);" id="set-menu-item-image-<?php echo esc_attr( absint( $id ) ); ?>"><?php esc_html_e( 'Set menu item image', 'asdb-mega-menu' ); ?></button>
						</p>
						<p id="menu-item-image-container-<?php echo esc_attr( absint( $id ) ); ?>" class="hidden menu-item-image-container">
							<img src="<?php echo esc_url( $img_url[0] ); ?>" alt="" title="" style="width: 130px;" />
							<input id="menu-item-image-<?php echo esc_attr( absint( $id ) ); ?>" name="menu-item-image[<?php echo esc_attr( absint( $id ) ); ?>]" type="hidden" value="<?php echo esc_attr( $img_id ); ?>" />
						</p>
						<p class="hide-if-no-js hidden">
								<button title="<?php esc_html_e( 'Remove Menu Item Image', 'asdb-mega-menu' ); ?>" href="javascript:;" id="remove-menu-item-image-<?php echo esc_attr( absint( $id ) ); ?>"><?php esc_html_e( 'Remove menu item image', 'asdb-mega-menu' ); ?></button>
						</p>
					</p>
					-->
		<?php $current_type = get_post_meta( $id, '_menu_item_mmenu_type', true ); ?>
					<script>
						(function( $ ) {

							asdb_mega_menu_renderFeaturedImage( $, <?php echo esc_attr( absint( $id ) ); ?> );


							function asdb_mega_menu_change() {
								jQuery('.field-menu-item-widget-area,.field-menu-item-category,.field-menu-item-mmenu-page').hide();
								var selected_mmenu_type = jQuery('#mmenu-type-<?php echo esc_attr( absint( $id ) ); ?>').val();
								jQuery('.field-menu-item-'+selected_mmenu_type).show();
								}


							'use strict';

							$(function() {
								$( '#mmenu-type-<?php echo esc_attr( absint( $id ) ); ?>' ).on( 'change', function( e ) {
									e.preventDefault();
									asdb_mega_menu_change(<?php echo ""; ?>);
								});

								$( '#set-menu-item-image-<?php echo esc_attr( absint( $id ) ); ?>' ).on( 'click', function( e ) {
									e.preventDefault();
									asdb_mega_menu_renderMediaUploader(<?php echo esc_attr( absint( $id ) ); ?>);
								});

								$( '#remove-menu-item-image-<?php echo esc_attr( absint( $id ) ); ?>' ).on( 'click', function( evt ) {

									// Stop the anchor's default behavior
									evt.preventDefault();

									// Remove the image, toggle the anchors
									asdb_mega_menu_resetUploadForm( $, <?php echo esc_attr( absint( $id ) ); ?> );

								});

							});

						})( jQuery );
					</script>

				<?php $current_fa = get_post_meta( $id, '_menu_item_fa_icon', true ); ?>
				<div class="description description-wide">
				<p>
					<p class="description"><?php esc_html_e( 'FontAwesome class Icon (example: fa fa-home)', 'asdbturbo' ); ?></p>
					<input type="text" id="item-fa-icon-<?php echo esc_attr( absint( $id ) ); ?>" class="widefat code edit-menu-item-classes" name="menu-item-fa-icon[<?php echo esc_attr( absint( $id ) ); ?>]" value="<?php echo $current_fa; ?>">
				</p>
				</div>

				<div class="field-menu-item-mmenu-type description description-wide">
				<p>
					<p class="description"><?php esc_html_e( 'Select MegaMenu Type', 'asdbturbo' ); ?></p>
						<select id="mmenu-type-<?php echo esc_attr( absint( $id ) ); ?>" class="mmenu-select-type" name="menu-item-mmenu-type[<?php echo esc_attr( absint( $id ) ); ?>]">
							<option value="" <?php selected( $current_type, '' ); ?>><?php esc_html_e( '- Select MegaMenu Type -', 'asdbturbo' ); ?></option>
							<option value="widget-area" <?php selected( 'widget-area', $current_type, true );?>>Widget</option>
							<option value="category" <?php selected( 'category', $current_type, true );?>>Category</option>
							<option value="mmenu-page" <?php selected( 'mmenu-page', $current_type, true );?>>MegaMenu Page</option>
						</select>
				</p>
				</div>
				<div class="field-menu-item-widget-area description description-wide" <?php if ($current_type=='widget-area') {echo 'style="display:block"';} else {echo 'style="display:none"';} ?>>
				<p>
						<p class="description"><?php esc_html_e( 'Select Widget Area to Display', 'asdbturbo' ); ?></p>
							<select id="widget-area-<?php echo esc_attr( absint( $id ) ); ?>" name="menu-item-widget-area[<?php echo esc_attr( absint( $id ) ); ?>]">
								<?php $current_area = get_post_meta( $id, '_menu_item_widget_area', true ); ?>
								<option value=""<?php selected( $current_area, '' ); ?>><?php esc_html_e( '- Select Widget Area -', 'asdbturbo' ); ?></option>
								<?php
								global $wp_registered_sidebars;
								foreach ( $wp_registered_sidebars as $sidebar ) {
									echo '<option value="' . esc_attr( $sidebar['id'] ) . '"' . selected( $sidebar['id'], $current_area, false ) . '>' . esc_html( $sidebar['name'] ) . '</option>';
								} ?>
							</select>
				</p>
				</div>
				<div class="field-menu-item-category description description-wide" <?php if ($current_type=='category') {echo 'style="display:block"';} else {echo 'style="display:none"';} ?>>
				<p>
					<p class="description"><?php esc_html_e( 'Select Category for Mega Menu', 'asdbturbo' ); ?></p>
						<select id="mmenu-category-<?php echo esc_attr( absint( $id ) ); ?>" name="menu-item-mmenu-category[<?php echo esc_attr( absint( $id ) ); ?>]">
							<?php $current_mmenu_category = get_post_meta( $id, '_menu_item_mmenu_category', true ); ?>
							<option value=""<?php selected( $current_mmenu_category, '' ); ?>><?php esc_html_e( '- Select Category for Mega Menu -', 'asdbturbo' ); ?></option>
							<?php
							$asdb_category_tree = get_category2id_array(false);
			                foreach ($asdb_category_tree as $category => $category_id) {
            				    echo '<option value="' . esc_attr( $category_id ) . '"' . selected( $current_mmenu_category, $category_id, false ) . '>' . esc_html( $category ) . '</option>';
            					}
							?>
						</select>
				</p>
				</div>
				<div class="field-menu-item-mmenu-page description description-wide" <?php if ($current_type=='mmenu-page') {echo 'style="display:block"';} else {echo 'style="display:none"';} ?>>
				<p>
					<p class="description"><?php esc_html_e( 'Select Mega Menu Page to Display', 'asdbturbo' ); ?></p>
						<select id="mmenu-page-<?php echo esc_attr( absint( $id ) ); ?>" name="menu-item-mmenu-page[<?php echo esc_attr( absint( $id ) ); ?>]">
							<?php $current_mmenu_page = get_post_meta( $id, '_menu_item_mmenu_page', true ); ?>
							<option value=""<?php selected( $current_mmenu_page, '' ); ?>><?php esc_html_e( '- Select Mega Menu Page -', 'asdbturbo' ); ?></option>
							<?php
							$args = array('post_type' => 'asdb_mega_menu', 'numberposts'=> '10');
					        $mmega_items = get_posts($args);
							foreach ( $mmega_items as $page ) {
								echo '<option value="' . esc_attr( $page->ID ) . '"' . selected( $page->ID, $current_mmenu_page, false ) . '>' . esc_html( $page->post_title ) . '</option>';
							}
							wp_reset_postdata();
							?>
						</select>
				</p>
				</div>

				<?php
			endif;

			return ob_get_clean();
		}

		/**
		 * Get the SVGs.
		 * @todo   Need to provide a fallback to use SVGs in the plugin.
		 * @return array An array of all the SVG names/slugs.
		 */
		public function get_svg_list() {
			$svgs = array();
			foreach ( glob( get_stylesheet_directory() . '/assets/images/svg/*.svg' ) as $svg ) {
				$slug          = str_replace( array( get_stylesheet_directory() . '/assets/images/svg/', '.svg' ), '', $svg );
				$svgs[ $slug ] = $this->get_svg( $slug ) . ' ' . ucfirst( str_replace( '-', ' ', $slug ) );
			}

			return $svgs;
		}

		/**
		 * Return the SVG icon markup.
		 * @param  string $icon_name The SVG icon name/slug (based on the original filename).
		 * @return string            The SVG markup.
		 */
		function get_svg( $icon_name ) {

			$svg = '<svg class="icon icon-' . esc_html( $icon_name ) . '">';
			$svg .= '	<use xlink:href="#icon-' . esc_html( $icon_name ) . '"></use>';
			$svg .= '</svg>';

			return $svg;
		}
	} // class ASDB_Mega_Menu_Walker_Nav_Menu_Edit.

	// We don't have the requirements to do this.
} else {
	$asdb_mega_menu = false; // Destroy our instance!
} // class ASDB_Mega_Menu_Walker_Nav_Menu_Edit exists.
