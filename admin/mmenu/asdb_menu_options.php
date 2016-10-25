<?php

include_once('includes/functions.php');


function my_theme_options($menu_settings)
{
    ?>
<div class="wrap">
    <div id="icon-themes" class="icon32"><br></div>
    <?php echo "<h2>" . __('ASDB Mega Menu Options', 'asdbturbo') . "</h2>"; ?>
    <?php
}

function get_main_menu_selectbox($slug_menu)
{
    echo __('Select menu:', 'asdbturbo') . '<br>';
    echo '<select id="menu-list" name="menu_slug_name">';

    $menus = get_terms('nav_menu');

    foreach ($menus as $menu) {
        if ($menu->slug == $slug_menu) $selected = ' selected = "selected" '; else $selected = '';
        echo '<option value="' . $menu->slug . '" ' . $selected . '  >' . $menu->name . '</option>';

    }
    echo '</select>';
}

function get_mega_menu_items($name, $mega_menu_item, $checked, $mega_menu_color, $mega_menu_hover)
{
    static $crumina_mega_menu_items;

    if (empty($crumina_mega_menu_items)) {
        $args = array('post_type' => 'asdb_mega_menu', 'numberposts'=> '10');
        $crumina_mega_menu_items = get_posts($args);
    } else {
        $crumina_mega_menu_items;
    }

    if (count($crumina_mega_menu_items) > 0) {
        echo '<td style="width:10%;"><input type="checkbox" name="' . $name . '[mega_menu_active]" ' . $checked . '>
              <label for="upload_image">' . __('Use Mega Menu?', 'asdbturbo') . '</label><br>';

        echo '<label>' . __('Select Mega Menu Item', 'asdbturbo') . '</label><br>';
        echo '<select name="' . $name . '[mega_menu_item]" style="width:100%;" >';
        foreach ($crumina_mega_menu_items as $menu_item) {
            if ($menu_item->ID == $mega_menu_item) $selected = ' selected = "selected" '; else $selected = '';
            echo "<option value='$menu_item->ID' $selected >" . $menu_item->post_title . "</option>";
        }
        echo '</select>';

        echo '<label for="upload_image">' . __('Mega Menu Color', 'asdbturbo') . '</label>
              <input size="36" name="' . $name . '[mega_menu_color]" type="text" value = "' . $mega_menu_color . '" />
              <br>';
        echo '<label for="upload_image">' . __('Mega Menu Hover', 'asdbturbo') . '</label>
              <input size="36" name="' . $name . '[mega_menu_hover]" type="text" value = "' . $mega_menu_hover . '" />
              <br>';

    } else {
        echo '<b>' . __('If you want use MegaMenu, first you need create mega menu items', 'asdbturbo') . '</b></td>';
    }

}

function show_crum_menus_items_list($slug_menu)
{
    if (empty($slug_menu)) $slug_menu = 'primary-navigation';

    $menu_items = wp_get_nav_menu_items($slug_menu);
    $menu_settings = get_menu_settings();

    echo '<br><br><div>';

    echo "<form method='POST' action=''>";
    echo "<input type='hidden' name='func' value='save_menu_settings'>";

    ?>

    <div style="width: 150px;">
        <br>
        <?php
        get_main_menu_selectbox($slug_menu);
        ?>
    </div>

    <?php

    foreach ($menu_items as $menu_item) {
        if ($menu_item->menu_item_parent == 0) {

//            $menu_title = str_replace(" ", "-", strtolower($menu_item->title));
            $menu_title = $menu_item->ID;

            if (is_array($menu_settings)) {
                $menu_icon = (isset($menu_settings[$slug_menu][$menu_title]['active_icon'])) ? $menu_settings[$slug_menu][$menu_title]['active_icon'] : '';
                $menu_hover_icon = (isset($menu_settings[$slug_menu][$menu_title]['hover_icon'])) ? $menu_settings[$slug_menu][$menu_title]['hover_icon'] : '';
                $mega_menu_color = (isset($menu_settings[$slug_menu][$menu_title]['mega_menu_color'])) ? $menu_settings[$slug_menu][$menu_title]['mega_menu_color'] : '';
                $mega_menu_hover = (isset($menu_settings[$slug_menu][$menu_title]['mega_menu_hover'])) ? $menu_settings[$slug_menu][$menu_title]['mega_menu_hover'] : '';
                $mega_menu_item = (isset($menu_settings[$slug_menu][$menu_title]['mega_menu_item'])) ? $menu_settings[$slug_menu][$menu_title]['mega_menu_item'] : '';
                $mega_menu_active = (isset($menu_settings[$slug_menu][$menu_title]['mega_menu_active'])) ? $menu_settings[$slug_menu][$menu_title]['mega_menu_active'] : '';
            }

            echo '<table class="mmenu-item"><tr>';

            ?>

                <td>
                <nav id="top-menu" class="fake">
                    <ul id="menu-main-menu" class="menu">
                        <li class="current-menu-item has-submenu" id="main-menu-help"
                            style="background-color: #FFFFFF;">
                <span class="menu-item-wrap">
                    <a href="http://dev.crumina.net/maestro/" style="">
                        <span class="tile-icon">
                            <img id="ac_ic_menu_data<?php echo $menu_item->post_type . $menu_title ?>active_icon"
                                 src="<?php echo $menu_icon; ?>" class="active-icon"
                                 style="display: inline;width: 32px;height: 32px;border:0px;">
                            <img id="hv_ic_menu_data<?php echo $menu_item->post_type . $menu_title ?>hover_icon"
                                 src="<?php echo $menu_hover_icon; ?>" class="normal-icon"
                                 style="display: none;width: 32px;height: 32px;border:0px;">
                        </span>
                        <span class="link-text"><?php echo $menu_item->title; ?> </span>
                    </a>
                </span>

                            <div class="under"></div>
                        </li>

                    </ul>
                </nav>
                </td>

        <?php


            echo '
            <td>
            <label for="upload_image">Menu Icon </label>
            <input id="menu_data' . $menu_item->post_type . $menu_title . 'active_icon" name="menu_data[' . $slug_menu . '][' . $menu_title . '][active_icon]" size="36"
            class="metro-item-icon icon-item-' . $menu_item->ID . '" data-item="menu_data[' . $menu_item->post_type . '][' . $menu_title . '][active_icon]" type="text"
              value = "' . $menu_icon . '"/>
            <input class="button-secondary remove-icon" id="menu_data' . $menu_item->post_type . $menu_title . 'active_icon"  value="Remove Icon" type="button" /> </label>
            <br>';

            echo '
            <label for="upload_image"> Menu Hover Icon
            <input id="menu_data' . $menu_item->post_type . $menu_title . 'hover_icon" size="36" name="menu_data[' . $slug_menu . '][' . $menu_title . '][hover_icon]"
            class="metro-item-icon icon-item-' . $menu_item->ID . '" data-item="' . $menu_item->ID . '" type="text"
            value = "' . $menu_hover_icon . '" />


            <input class="button-secondary remove-icon" id="menu_data' . $menu_item->post_type . $menu_title . 'hover_icon"  value="Remove Icon" type="button" /> </label>
            <br><br>';

            if ($mega_menu_active == 'on') {
                $checked = 'checked';
            } else {
                $checked = '';
            }

            echo get_mega_menu_items('menu_data[' . $slug_menu . '][' . $menu_title . ']', $mega_menu_item, $checked, $mega_menu_color, $mega_menu_hover );

            echo '</div></td>';

        }
    }

    echo '</tr></table>';

    echo '<div class="clear"></div> ';
    echo '<br><input class="button-primary" style="float:none;" type="submit" id="save_menu" value="Save">';
    echo "</form>";
}


$menu_slug_name = get_menu_slug();

construct();

my_theme_options(get_js_settings());
show_crum_menus_items_list($menu_slug_name);