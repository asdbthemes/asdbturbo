<?php
/**
 * TaxMeta API for OptionTree
 *
 * This class loads all the methods and helpers specific to build a meta fields for Category and Taxonomy.
 *
 * @package   asdbturbo
 */



add_action( 'admin_print_scripts-term.php', 'ot_admin_scripts', 11 );
add_action( 'admin_print_styles-term.php', 'ot_admin_styles', 11 );

if ( ! class_exists( 'ASDB_OT_TaxMeta' ) ) {

  class ASDB_OT_TaxMeta {

    private $meta_box;

    function __construct( $meta_box ) {
      if ( ! is_admin() )
        return;

      global $ot_meta_boxes;

      if ( ! isset( $ot_meta_boxes ) ) {
        $ot_meta_boxes = array();
      }

      $ot_meta_boxes[] = $meta_box;

      $this->meta_box = $meta_box;

		foreach( $this->meta_box['pages'] as $taxonomy ){
		add_action( $taxonomy . '_edit_form', array( &$this, 'build_taxmeta'), 10, 2 );
		}

		add_action('edit_term', array( &$this, 'save_taxmeta'), 10, 1 );

    }

    function build_taxmeta( $term_id, $metabox ) {
		echo '
		<style>
		#edittag .ot-metabox-wrapper {background: #fff;padding: 20px;}
		#edittag .format-settings {border-bottom: 1px dashed #ddd;}
		#edittag .format-settings:last-child {border-bottom: 0;}
		#edittag .format-setting-label {border-bottom:0;width:215px;font-size: 14px;font-weight: 600;display: inline-block;float:left;}
		#edittag .format-setting {width:75%;}
		</style>
		';
		echo '<div class="ot-metabox-wrapper">';
		echo '<h2>' . $this->meta_box["title"] . '</h2><hr>';
		echo '<input type="hidden" name="' . $this->meta_box['id'] . '_nonce" value="' . wp_create_nonce( $this->meta_box['id'] ) . '" />';
        echo isset( $this->meta_box['desc'] ) && ! empty( $this->meta_box['desc'] ) ? '<div class="description" style="padding-top:10px;">' . htmlspecialchars_decode( $this->meta_box['desc'] ) . '</div>' : '';

		foreach ( $this->meta_box['fields'] as $field ) {
			$field_value = get_term_meta( $_GET['tag_ID'], $field['id'], true );
				if ( isset( $field['std'] ) ) {
				$field_value = ot_filter_std_value( $field_value, $field['std'] );
				}
          $_args = array(
            'type'              => $field['type'],
            'field_id'          => $field['id'],
            'field_name'        => $field['id'],
            'field_value'       => $field_value,
            'field_desc'        => isset( $field['desc'] ) ? $field['desc'] : '',
            'field_std'         => isset( $field['std'] ) ? $field['std'] : '',
            'field_rows'        => isset( $field['rows'] ) && ! empty( $field['rows'] ) ? $field['rows'] : 10,
            'field_post_type'   => isset( $field['post_type'] ) && ! empty( $field['post_type'] ) ? $field['post_type'] : 'post',
            'field_taxonomy'    => isset( $field['taxonomy'] ) && ! empty( $field['taxonomy'] ) ? $field['taxonomy'] : 'category',
            'field_min_max_step'=> isset( $field['min_max_step'] ) && ! empty( $field['min_max_step'] ) ? $field['min_max_step'] : '0,100,1',
            'field_class'       => isset( $field['class'] ) ? $field['class'] : '',
            'field_condition'   => isset( $field['condition'] ) ? $field['condition'] : '',
            'field_operator'    => isset( $field['operator'] ) ? $field['operator'] : 'and',
            'field_choices'     => isset( $field['choices'] ) ? $field['choices'] : array(),
            'field_settings'    => isset( $field['settings'] ) && ! empty( $field['settings'] ) ? $field['settings'] : array(),
            'post_id'           => $_GET['tag_ID'],
            'meta'              => true
          );

          $conditions = '';
          if ( isset( $field['condition'] ) && ! empty( $field['condition'] ) ) {
            $conditions = ' data-condition="' . $field['condition'] . '"';
            $conditions.= isset( $field['operator'] ) && in_array( $field['operator'], array( 'and', 'AND', 'or', 'OR' ) ) ? ' data-operator="' . $field['operator'] . '"' : '';
          }
          if ( apply_filters( 'ot_override_forced_textarea_simple', false, $field['id'] ) == false && $_args['type'] == 'textarea' )
            $_args['type'] = 'textarea-simple';

          if ( ! empty( $_args['field_class'] ) ) {

            $classes = explode( ' ', $_args['field_class'] );

            foreach( $classes as $key => $value ) {

              $classes[$key] = $value . '-wrap';

            }

            $class = 'format-settings ' . implode( ' ', $classes );

          } else {

            $class = 'format-settings';

          }

          echo '<div id="setting_' . $field['id'] . '" class="' . $class . '"' . $conditions . '>';

            echo '<div class="format-setting-wrap">';

              if ( $_args['type'] != 'textblock' && ! empty( $field['label'] ) ) {
                echo '<div class="format-setting-label">';
                  echo '<label for="' . $field['id'] . '" class="label">' . $field['label'] . '</label>';
                echo '</div>';
              }

              echo ot_display_by_type( $_args );

            echo '</div>';

          echo '</div>';

        }

        echo '<div class="clear"></div>';

      echo '</div>';

    }

// function save_taxmeta ( $term_id, $post_object ) {
    function save_taxmeta ( $term_id ) {
      global $pagenow;

      if ( empty( $_POST ) || ( isset( $_POST['vc_inline'] ) && $_POST['vc_inline'] == true ) )
        return $term_id;

      if ( isset( $_POST[ $this->meta_box['id'] . '_nonce'] ) && ! wp_verify_nonce( $_POST[ $this->meta_box['id'] . '_nonce'], $this->meta_box['id'] ) )
        return $term_id;

      // check permissions
      if ( ! current_user_can( 'manage_categories', $term_id ) )
        return $term_id;

      foreach ( $this->meta_box['fields'] as $field ) {

        $old = get_term_meta( $term_id, $field['id'], true );
        $new = '';

        if ( isset( $_POST[$field['id']] ) ) {

          if ( in_array( $field['type'], array( 'list-item', 'slider' ) ) ) {

            $required_setting = array(
              array(
                'id'        => 'title',
                'label'     => __( 'Title', 'option-tree' ),
                'desc'      => '',
                'std'       => '',
                'type'      => 'text',
                'rows'      => '',
                'class'     => 'option-tree-setting-title',
                'post_type' => '',
                'choices'   => array()
              )
            );

            $settings = isset( $_POST[$field['id'] . '_settings_array'] ) ? unserialize( ot_decode( $_POST[$field['id'] . '_settings_array'] ) ) : array();

            if ( empty( $settings ) ) {
              $settings = 'slider' == $field['type'] ?
              ot_slider_settings( $field['id'] ) :
              ot_list_item_settings( $field['id'] );
            }

            $settings = array_merge( $required_setting, $settings );

            foreach( $_POST[$field['id']] as $k => $setting_array ) {

              foreach( $settings as $sub_setting ) {

                if ( isset( $sub_setting['type'] ) && isset( $_POST[$field['id']][$k][$sub_setting['id']] ) ) {

                  $_POST[$field['id']][$k][$sub_setting['id']] = ot_validate_setting( $_POST[$field['id']][$k][$sub_setting['id']], $sub_setting['type'], $sub_setting['id'] );

                }

              }

            }

            $new = $_POST[$field['id']];

          } else if ( $field['type'] == 'social-links' ) {

            $settings = isset( $_POST[$field['id'] . '_settings_array'] ) ? unserialize( ot_decode( $_POST[$field['id'] . '_settings_array'] ) ) : array();

            if ( empty( $settings ) ) {
              $settings = ot_social_links_settings( $field['id'] );
            }

            foreach( $_POST[$field['id']] as $k => $setting_array ) {

              foreach( $settings as $sub_setting ) {

                if ( isset( $sub_setting['type'] ) && isset( $_POST[$field['id']][$k][$sub_setting['id']] ) ) {

                  $_POST[$field['id']][$k][$sub_setting['id']] = ot_validate_setting( $_POST[$field['id']][$k][$sub_setting['id']], $sub_setting['type'], $sub_setting['id'] );

                }

              }

            }

            $new = $_POST[$field['id']];

          } else {

            $new = ot_validate_setting( $_POST[$field['id']], $field['type'], $field['id'] );

          }

        }
        if ( isset( $new ) && $new !== $old ) {
          update_term_meta( $term_id, $field['id'], $new );
        } else if ( '' == $new && $old ) {
          delete_term_meta( $term_id, $field['id'], $old );
        }
      }

    }

  }

}

if ( ! function_exists( 'register_taxmeta' ) ) {

  function register_taxmeta( $args ) {
    if ( ! $args )
      return;

    $ot_meta_box = new ASDB_OT_TaxMeta( $args );

  }

}
