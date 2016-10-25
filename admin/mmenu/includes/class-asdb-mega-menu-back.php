<?php

class asdb_nav_menu_edit_walker extends Walker_Nav_Menu_Edit {
    public function start_el(&$output, $item, $depth = 0, $args = array(), $id = 0) {


        $control_assa = '';

        //read the menu setting from post meta (menu id, key, single)
        $asdb_mega_menu_cat = get_post_meta($item->ID, 'asdb_mega_menu_cat', true);
        $asdb_mega_menu_page_id = get_post_meta($item->ID, 'asdb_mega_menu_page_id', true);

        //make the tree
        $asdb_category_tree = array_merge (array(' -- Not mega menu -- ' => ''), get_category2id_array(false));

        //make a new ui control ( dropdown )
        $control_assa .= '<p class="description description-wide"><br><br>';
            $control_assa .= '<label>';
                $control_assa .= 'Make this a category mega menu';
            $control_assa .= '</label>';
            $control_assa .= '<select name="asdb_mega_menu_cat[' . $item->ID . ']" id="" class="widefat code edit-menu-item-url">';
                foreach ($asdb_category_tree as $category => $category_id) {
                    $control_assa .= '<option value="' . $category_id . '"' . selected($asdb_mega_menu_cat, $category_id, false) . '>' . $category . '</option>';
                }
            $control_assa .= ' </select>';
        $control_assa .= '</p>';

        $control_assa .= '<br>OR<br>';




        //make a new ui control ( dropdown )
        $control_assa .= '<p class="description description-wide">';

            $control_assa .= '<label>';
                $control_assa .= 'Load a page in the menu (enter the page ID)';
            $control_assa .= '</label><br>';
            $control_assa .= '<input name="asdb_mega_menu_page_id[' . $item->ID . ']" type="text" value="' . $asdb_mega_menu_page_id . '" />';
            $control_assa .= '<span class="td-wpa-info"><strong>Just a tip:</strong> If you choose to load a mega menu or a page, please do not add submenus to this item. The mega menu and mega page menu have to be the top most menu item. <a href="http://forum.tagdiv.com/menus-newsmag/" target="_blank">Read more</a></span>';


        $control_assa .= '</p>';


        //run the parent and add in $assa (byref) our code via regex
        $assa = '';
        parent::start_el($assa, $item, $depth, $args, $id);
        $assa = preg_replace('/(?=<div.*submitbox)/', $control_assa, $assa);



        $output .= $assa;
    }
}



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
