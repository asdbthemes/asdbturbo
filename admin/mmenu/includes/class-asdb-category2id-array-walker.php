<?php
class asdb_category2id_array_walker extends Walker {
    var $tree_type = 'category';
    var $db_fields = array ('parent' => 'parent', 'id' => 'term_id');
    var $asdb_array_buffer = array();

    function start_lvl( &$output, $depth = 0, $args = array() ) {
    }

    function end_lvl( &$output, $depth = 0, $args = array() ) {
    }


    function start_el( &$output, $category, $depth = 0, $args = array(), $id = 0 ) {
        $this->asdb_array_buffer[str_repeat(' - ', $depth) .  $category->name] = $category->term_id;
    }


    function end_el( &$output, $page, $depth = 0, $args = array() ) {
    }

}


    /**
     * generates a category tree
     * @param bool $add_all_category = if true ads - All categories - at the begining of the list (used for dropdowns)
     * @return mixed
     */
    $asdb_category2id_array_walker_buffer = array();
    function get_category2id_array($add_all_category = true) {

        if (is_admin() === false) {
            return;
        }

        if (empty($asdb_category2id_array_walker_buffer)) {
            $categories = get_categories(array(
                'hide_empty' => 0,
                'number' => 1000
            ));

            $asdb_category2id_array_walker = new asdb_category2id_array_walker;
            $asdb_category2id_array_walker->walk($categories, 4);
            $asdb_category2id_array_walker_buffer = $asdb_category2id_array_walker->asdb_array_buffer;
        }


        if ($add_all_category === true) {
            $categories_buffer['- All categories -'] = '';
            return array_merge(
                $categories_buffer,
                $asdb_category2id_array_walker_buffer
            );
        } else {
            return $asdb_category2id_array_walker_buffer;
        }
    }




?>