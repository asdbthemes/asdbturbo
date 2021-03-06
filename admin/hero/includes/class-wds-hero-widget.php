<?php

// Exit if accessed directly
if ( ! defined ( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'WDS_Hero_Widget_Widget' ) ) :
	/**
	 * Handles the Hero Widget for Widget Areas.
	 *
	 * @since  1.0.0
	 * @package  wds-hero-widget
	 */
	class WDS_Hero_Widget_Widget extends WP_Widget {

		/**
		 * Unique identifier for this widget.
		 *
		 * Will also serve as the widget class.
		 *
		 * @since  1.0.0
		 *
		 * @var string
		 */
		protected $widget_slug = 'wds-hero-widget';

		/**
		 * Widget name displayed in Widgets dashboard.
		 * Set in __construct since __() shouldn't take a variable.
		 *
		 * @since  1.0.0
		 *
		 * @var string
		 */
		protected $widget_name = '';

		/**
		 * Default widget title displayed in Widgets dashboard.
		 * Set in __construct since __() shouldn't take a variable.
		 *
		 * @since  1.0.0
		 *
		 * @var string
		 */
		protected $default_widget_title = '';

		/**
		 * Shortcode name for this widget
		 *
		 * @since  1.0.0
		 *
		 * @var string
		 */
		protected $shortcode = 'wds_hero';

		/**
		 * All the text inputs used in the Widget
		 *
		 * @since  1.0.0
		 *
		 * @var array
		 */
		protected $text_inputs;

		/**
		 * All the types of Hero's
		 *
		 * @since  1.0.0
		 *
		 * @var array
		 */
		protected $types;

		/**
		 * Construct.
		 *
		 * @since  1.0.0
		 */
		public function __construct( $widget_name = false ) {
			// For backwards compatibility.
			if ( ! $widget_name ) {
				$this->widget_name          = esc_html__( 'Hero', 'asdbturbo' );
				$this->default_widget_title = esc_html__( 'Hero', 'asdbturbo' );
			} else {
				$this->widget_name          = esc_html__( $widget_name, 'asdbturbo' );
				$this->default_widget_title = esc_html__( $widget_name, 'asdbturbo' );
			}

			// WordPress Widget startup!
			parent::__construct(
				$this->widget_slug,
				$this->widget_name,
				array(
					'classname'   => $this->widget_slug,
					'description' => esc_html__( 'Hero widget.', 'asdbturbo' ),
				)
			);

			// Some widget specific hooks.
			add_action( 'save_post',    array( $this, 'flush_widget_cache' ) );
			add_action( 'deleted_post', array( $this, 'flush_widget_cache' ) );
			add_action( 'switch_theme', array( $this, 'flush_widget_cache' ) );

			// Make sure we can use this as a shortcode too!
			add_shortcode( $this->shortcode, array( $this, 'get_widget' ) );

			// Types of Heros
			$this->types = array(
				'primary',
				'secondary',
				'secondary-paralaxed'
			);

			// Text inputs for Hero Widgets.
			$this->text_inputs = array(
				array(
					'label'       => __( 'ID', 'asdbturbo' ),
					'slug'        => 'id',
					'description' => __( 'Add a unique ID name to this hero', 'asdbturbo' ),
					'placeholder' => 'id-name',
					'default'     => '',
				),
				array(
					'label'       => __( 'Classes', 'asdbturbo' ),
					'slug'        => 'class',
					'description' => __( 'Any additional classes you would like to add to this Hero.', 'asdbturbo' ),
					'placeholder' => 'my-class my-class-2',
					'default'     => '',
				),
				array(
					'label'       => __( 'Background Image URL', 'asdbturbo' ),
					'slug'        => 'image',
					'description' => __( 'The image to apply as the background image.', 'asdbturbo' ),
					'placeholder' => 'http://example.com/background-image.png',
					'default'     => '',
				),
				array(
					'label'       => __( 'Background Video URL', 'asdbturbo' ),
					'slug'        => 'video',
					'description' => __( 'Must be a .mp4 video.', 'asdbturbo' ),
					'placeholder' => 'http://example.com/background-video.mp4',
					'default'     => '',
				),
				array(
					'label'       => __( 'Primary Heading', 'asdbturbo' ),
					'slug'        => 'heading',
					'description' => __( 'Large Heading (top)', 'asdbturbo' ),
					'placeholder' => __( 'My Heading', 'asdbturbo' ),
					'default'     => '',
				),
				array(
					'label'       => __( 'Sub Heading', 'asdbturbo' ),
					'slug'        => 'sub_heading',
					'description' => __( 'Smaller Heading (below primary)', 'asdbturbo' ),
					'placeholder' => __( 'Sub Heading', 'asdbturbo' ),
					'default'     => '',
				),
				array(
					'label'       => __( 'Button Text', 'asdbturbo' ),
					'slug'        => 'button_text',
					'description' => __( 'Displayed below headings.', 'asdbturbo' ),
					'placeholder' => __( 'Button Text', 'asdbturbo' ),
					'default'     => '',
				),
				array(
					'label'       => __( 'Button URL', 'asdbturbo' ),
					'slug'        => 'button_link',
					'description' => __( 'What URL should the button open?', 'asdbturbo' ),
					'placeholder' => 'http://example.com/another/page',
					'default'     => '',
				),
				array(
					'label'       => __( 'Overlay Transparency', 'asdbturbo' ),
					'slug'        => 'overlay',
					'description' => __( 'Will automatically calculate CSS safe value.', 'asdbturbo' ),
					'placeholder' => '0',
					'default'     => '',
				),
				array(
					'label'       => __( 'Overlay Color', 'asdbturbo' ),
					'slug'        => 'overlay_color',
					'description' => esc_html__( 'The color of the overlay. Include # or use colors like "red"', 'asdbturbo' ),
					'placeholder' => '#000',
					'default'     => '#000',
				),
			);
		}

		/**
		 * Delete this widget's cache.
		 *
		 * Note: Could also delete any transients
		 * delete_transient( 'some-transient-generated-by-this-widget' );
		 *
		 * @since  1.0.0
		 */
		public function flush_widget_cache() {
			wp_cache_delete( $this->widget_slug, 'widget' );
		}

		/**
		 * Front-end display of widget.
		 *
		 * @since  1.0.0
		 *
		 * @param  array  $args      The widget arguments set up when a sidebar is registered.
		 * @param  array  $instance  The widget settings as set by user.
		 */
		public function widget( $args, $instance ) {
			$args = array(
				'before_widget' => $args['before_widget'],
				'after_widget'  => $args['after_widget'],
				'before_title'  => $args['before_title'],
				'after_title'   => $args['after_title'],
			);

			// The inputs
			$inputs = $this->get_all_the_input_slugs();

			// Add the inputs.
			foreach ( $inputs as $input_slug ) {
				if ( isset( $instance[ $input_slug ] ) ) {
					$args[ $input_slug ] = $instance[ $input_slug ];
				}
			}

			// Add the slider_id
			if ( isset( $instance['slider_id'] ) ) {
				$args['slider_id'] = $instance['slider_id'];
			} else {
				$args['slider_id'] = false;
			}

			echo $this->get_widget( $args );
		}

		/**
		 * Return the widget/shortcode output.
		 *
		 * @since  1.0.0
		 *
		 * @param  array  $atts Array of widget/shortcode attributes/args
		 * @return string       Widget output
		 */
		public function get_widget( $atts ) {
			$widget = '';

			// Before widget hook
			$widget .= $atts['before_widget'];

				// This function does the magic!
				$widget .= wds_hero_widget()->wds_hero( array(
					'type'                  => ( isset( $atts['type'] ) && ! empty( $atts['type'] ) ) ? $atts['type'] : 'primary',
					'id'                    => ( isset( $atts['id'] ) && ! empty( $atts['id'] ) ) ? $atts['id'] : false,
					'class'                 => ( isset( $atts['class'] ) && ! empty( $atts['class'] ) ) ? $atts['class'] : false,
					'image'                 => ( isset( $atts['image'] ) && ! empty( $atts['image'] ) ) ? $atts['image'] : false,
					'video'                 => ( isset( $atts['video'] ) && ! empty( $atts['video'] ) ) ? $atts['video'] : false,

					'echo'                  => false,

					'heading'               => ( isset( $atts['heading'] ) && ! empty( $atts['heading'] ) ) ? $atts['heading'] : false,
					'sub_heading'           => ( isset( $atts['sub_heading'] ) && ! empty( $atts['sub_heading'] ) ) ? $atts['sub_heading'] : false,
					'button_text'           => ( isset( $atts['button_text'] ) && ! empty( $atts['button_text'] ) ) ? $atts['button_text'] : false,
					'button_link'           => ( isset( $atts['button_link'] ) && ! empty( $atts['button_link'] ) ) ? $atts['button_link'] : false,

					'custom_content_action' => false,

					'overlay'               => ( isset( $atts['overlay'] ) && ! empty( $atts['overlay'] ) ) ? $atts['overlay'] : false,
					'overlay_color'         => ( isset( $atts['overlay_color'] ) && ! empty( $atts['overlay_color'] ) ) ? $atts['overlay_color'] : '#000',

					'slider_id'         => ( isset( $atts['slider_id'] ) && ! empty( $atts['slider_id'] ) ) ? $atts['slider_id'] : false,
				) );

			// After widget hook
			$widget .= $atts['after_widget'];

			return $widget;
		}

		/**
		 * Condenses all the inputs into a simple array of slugs.
		 *
		 * @since  1.0.0
		 *
		 * @return array Simplified inputs
		 */
		function get_all_the_input_slugs() {
			$inputs[] = 'type'; // Type inputs (not a basic text input).
			foreach ( $this->text_inputs as $input ) {
				$inputs[] = $input['slug'];
			}
			return $inputs;
		}

		/**
		 * Update form values as they are saved.
		 *
		 * @since  1.0.0
		 *
		 * @param  array  $new_instance  New settings for this instance as input by the user.
		 * @param  array  $old_instance  Old settings for this instance.
		 * @return array  Settings to save or bool false to cancel saving.
		 */
		public function update( $new_instance, $old_instance ) {
			// Previously saved values
			$instance = $old_instance;

			// Get all the inputs
			$inputs = $this->get_all_the_input_slugs();

			// Sanitizations
			add_filter( 'wds_widget_update_video',           array( $this, 'sanitize_url' ) );
			add_filter( 'wds_widget_update_button_link',     array( $this, 'sanitize_url' ) );
			add_filter( 'wds_widget_update_image',           array( $this, 'sanitize_url' ) );
			add_filter( 'wds_widget_update_overlay',         array( $this, 'sanitize_overlay' ) );

			// Save the inputs and add filter for sanitizing.
			foreach ( $inputs as $slug ) {
				$instance[ $slug ] = apply_filters( "wds_widget_update_$slug", $new_instance[ $slug ] );
			}

			// Save the slider_id input.
			$instance[ 'slider_id' ] = apply_filters( 'wds_widget_update_slider_id', $new_instance[ 'slider_id' ] );

			// Flush cache
			$this->flush_widget_cache();

			return $instance;
		}

		/**
		 * Makes sure we set a float for transparency.
		 *
		 * @since  1.0.0
		 *
		 * @param  string $overlay The string set by the user
		 *
		 * @return float           The decimal value it should use instead.
		 */
		function sanitize_overlay( $overlay ) {
			if ( absint( $overlay ) ) {
				return $overlay / 100;
			} else if ( is_float( $overlay ) ) {
				return $overlay;
			} else {
				return (float) $overlay;
			}
		}

		/**
		 * Make sure we're storing a sanitized URL in the DB.
		 *
		 * @since  1.0.0
		 *
		 * @param  string $url The URL set by the user.
		 *
		 * @return string      Sanitized URL going to the DB.
		 */
		function sanitize_url( $url ) {
			return esc_url( $url );
		}

		/**
		 * Back-end widget form with defaults.
		 *
		 * @since  1.0.0
		 *
		 * @param  array  $instance  Current settings.
		 */
		public function form( $instance ) {

			// Condense Meta & Defaults
			$widget_meta = array();
			foreach ( $this->text_inputs as $input ) {
				$widget_meta[ $input['slug'] ] = ( isset( $input[ 'default' ] ) ? $input[ 'default' ] : '' );
			}
			$widget_meta['slider_id'] = ( isset( $input[ 'slider_id' ] ) ? $input[ 'slider_id' ] : '' );
			$instance = wp_parse_args( (array) $instance, array_merge( $widget_meta, array(
				// Type isn't added via the basic text inputs because it is a <select>.
				'type'  => 'primary', // Default hero type.
			) ) );

			$sliders = get_posts( array(
				'posts_per_page'   => -1,
				'orderby'          => 'title',
				'order'            => 'ASC',
				'post_type'        => 'wds-hero-slider',
				'post_status'      => 'publish',
				'suppress_filters' => true,
				'fields'           => 'ids',
			) );

			?>

				<!-- Type input (select) -->
				<p>
					<label for="<?php echo esc_attr( $this->get_field_id( 'type' ) ); ?>">
						<?php esc_html_e( 'Hero Type', 'asdbturbo' ); ?>
					</label>
					<select id="<?php echo esc_attr( $this->get_field_id( 'type' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'type' ) ); ?>">
						<?php foreach( $this->types as $type ) : ?>
							<option value="<?php echo esc_attr( $type ); ?>" <?php selected( $type, $instance['type'] ); ?>><?php echo esc_attr( ucwords( str_replace( '-', ' ', $type ) ) ); ?></option>
						<?php endforeach; ?>
					</select>
				</p>

				<!-- Sliders -->
				<?php if ( ! defined( 'DISABLE_WDS_SLIDER_CPT' ) || false === DISABLE_WDS_SLIDER_CPT ) : ?>
					<p>
						<label for="<?php echo esc_attr( $this->get_field_id( 'slider_id' ) ); ?>">
							<?php _e( 'Choose Hero Slider:', 'asdbturbo' ); ?>
						</label>
						<select id="<?php echo esc_attr( $this->get_field_id( 'slider_id' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'slider_id' ) ); ?>" style="max-width: 100%; min-width: 100%;">
							<option><?php echo sprintf( __( '%s None %s', 'asdbturbo' ), '&mdash;', '&mdash;' ); ?></option>

							<!-- Logo Train ID -->
							<?php if ( is_array( $sliders ) ) : ?>
								<?php foreach( $sliders as $slider_id ) : ?>
									<option value="<?php echo esc_attr( $slider_id ); ?>" <?php selected( $slider_id, $instance['slider_id'] ); ?>><?php echo get_the_title( $slider_id ); ?></option>
								<?php endforeach; ?>
							<?php endif; ?>
						</select>
					</p>

					<p class="description"><?php echo sprintf( __( 'Uses any %sHero Slider%s to slide images in the background.', 'asdbturbo' ), '<em>', '</em>' ); ?></p>
				<?php endif; ?>

				<!-- Text inputs -->
				<?php foreach( $this->text_inputs as $input ): ?>
					<p>
						<label for="<?php echo esc_attr( $this->get_field_id( $input['slug'] ) ); ?>">
							<?php echo esc_html( $input['label'] ) . ': '; ?>
						</label>
						<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( $input['slug'] ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( $input['slug'] ) ); ?>" value="<?php echo esc_attr( $instance[ $input['slug'] ] ); ?>" placeholder="<?php echo esc_attr( $input['placeholder'] ); ?>" /><br />
					</p>

					<?php if ( $input['description'] ): ?>
						<p class="description"><?php echo esc_html( $input['description' ] ); ?></p>
					<?php endif; ?>
				<?php endforeach; ?>

			<?php
		}
	}
endif;
