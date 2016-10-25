<?php


wds_register_page_builder_options( array(
    'hide_options'    => 'disabled',
    'parts_dir'       => 'pagebuilder',
    'parts_prefix'    => 'part',
    'use_wrap'        => 'on',
    'container'       => 'section',
    'container_class' => 'template-part wrap',
    'post_types'      => array( 'page','post' ),
) );
register_page_builder_area( 'hero', array( 'page' ) );
register_page_builder_area( 'footer', array( 'page' ) );



//add_action( 'after_setup_theme', 'wpb_register_page_builder_options' );
function wpb_register_page_builder_options() {
    add_theme_support( 'wds-simple-page-builder' );

    wds_register_page_builder_options( array(
        'hide_options'    => 'disabled',
        'parts_dir'       => 'pagebuilder',
        'parts_prefix'    => 'part',
        'use_wrap'        => 'on',
        'container'       => 'section',
        'container_class' => 'template-part wrap',
        'post_types'      => array( 'page' ),
    ) );
}




function cmb2_get_cat_opt( $taxonomy = 'category', $args = array() ) {

    $args['taxonomy'] = $taxonomy;
    // $defaults = array( 'taxonomy' => 'category' );
    $args = wp_parse_args( $args, array( 'taxonomy' => 'category' ) );

    $taxonomy = $args['taxonomy'];

    $terms = (array) get_terms( $taxonomy, $args );

    // Initate an empty array
    $term_options = array();
    if ( ! empty( $terms ) ) {
        foreach ( $terms as $term ) {
            $term_options[ $term->term_id ] = $term->name;
        }
    }

    return $term_options;
}


/**
 * Gets a number of terms and displays them as options
 * @param  string       $taxonomy Taxonomy terms to retrieve. Default is category.
 * @param  string|array $args     Optional. get_terms optional arguments
 * @return array                  An array of options that matches the CMB2 options array
 */
function cmb2_get_term_options( $taxonomy = 'category', $args = array() ) {

    $args['taxonomy'] = $taxonomy;
    // $defaults = array( 'taxonomy' => 'category' );
    $args = wp_parse_args( $args, array( 'taxonomy' => 'category' ) );

    $taxonomy = $args['taxonomy'];

    $terms = (array) get_terms( $taxonomy, $args );

    // Initate an empty array
    $term_options = array();
    if ( ! empty( $terms ) ) {
        foreach ( $terms as $term ) {
            $term_options[ $term->term_id ] = $term->name;
        }
    }

    return $term_options;
}

//By Daniele Mte90 Scasciafratte
//render multicheck-posttype
add_action( 'cmb2_render_multicheck_posttype', 'ds_cmb_render_multicheck_posttype', 10, 5 );
function ds_cmb_render_multicheck_posttype( $field, $escaped_value, $object_id, $object_type, $field_type_object ) {
	$cpts = get_post_types();
	unset( $cpts[ 'nav_menu_item' ] );
	unset( $cpts[ 'revision' ] );
	unset( $cpts[ 'option-tree' ] );
	unset( $cpts[ 'attachment' ] );
	$cpts = apply_filters( 'multicheck_posttype_' . $field->args[ '_id' ], $cpts );
	$options = '';
	$i = 1;
	$values = (array) $escaped_value;

	if ( $cpts ) {
		foreach ( $cpts as $cpt ) {
			$args = array(
			    'value' => $cpt,
			    'label' => $cpt,
			    'type' => 'checkbox',
			    'name' => $field->args['_name'] . '[]',
			);
			if ( in_array( $cpt, $values ) ) {
				$args[ 'checked' ] = 'checked';
			}
			$options .= $field_type_object->list_input( $args, $i );
			$i++;
		}
	}
	$classes = false === $field->args( 'select_all_button' ) ? 'cmb2-checkbox-list no-select-all cmb2-list' : 'cmb2-checkbox-list cmb2-list';
	echo $field_type_object->radio( array( 'class' => $classes, 'options' => $options ), 'multicheck_posttype' );
}


// render radio_image fields
add_action( 'cmb2_render_radio_image', 'cmb_render_radio_image', 10, 5 );

function cmb_render_radio_image( $field, $value, $object_id, $object_type, $field_type_object ) {

    $i = 1;
    $args = '';
    $options = '';
    $opt = $field->args['options'];
    $src = $field->args['src'];
    $values = (array) $value;
echo '
<script>
( function( $ ) {
      $(document).on("click", ".cmb-radio-image", function() {
        $(this).closest(".cmb-type-radio-image").find(".cmb-radio-image").removeClass("cmb-radio-image-selected");
        $(this).toggleClass("cmb-radio-image-selected");
      });
} )( jQuery );
</script>
<style>
.cmb-type-radio-image li{display:inline-block;margin-right:10px;float:left;}
.cmb-type-radio-image input[type=radio] {display:none;}
.cmb-radio-image {border:1px solid #fff;padding:2px;width:80px;}
.cmb-radio-image-selected {border:1px solid #ccc; }
</style>
';
	if ($opt) {
	echo '<div class="cmb-row cmb-type-radio-image ">';
		echo '<ul class="cmb2-radio-list cmb2-list">';

    	foreach ( $opt as $k => $v) {
            $args = array(
                'value' => $k,
                'label' => '<img src="' . esc_url( $src[$k] ) . '" alt="' . esc_attr( $v ) .'" title="' . esc_attr( $v ) .'" class="cmb-radio-image " />',
                'type' => 'radio',
                'name' => $field->args['_name'] . '[]',
            );
            if ( in_array( $k, $values ) ) {
                $args[ 'checked' ]	= 'checked';
                $args[ 'label' ]	= '<img src="' . esc_url( $src[$k] ) . '" alt="' . esc_attr( $v ) .'" title="' . esc_attr( $v ) .'" class="cmb-radio-image cmb-radio-image-selected " />';
            }


//          $options .= $field_type_object->list_input( $args, $i );
            echo $field_type_object->list_input( $args, $i );

            $i++;
        }

//		echo $field_type_object->radio( array( 'options' => $options ), 'radio-image' );


		echo '</ul>';
	echo '</div>';
    }
}


