<?php

function construct()
{
    $function = (isset($_POST["func"])) ? $_POST["func"] : '';

    switch ($function):
        case 'save_js_settings':
            $user_animation = $_POST['menu_user_animation'];
            $user_speed = $_POST['menu_user_speed'];
            $menu_active_icon_hover = (isset($_POST['menu_active_icon_hover'])) ? $_POST['menu_active_icon_hover'] : '';

            save_js_settings($user_animation, $user_speed, $menu_active_icon_hover);
            break;

        case 'save_menu_settings':
            $menu_data = $_POST['menu_data'];

            save_menu_settings($menu_data);
            break;

        default:

            break;

    endswitch;

}

function save_js_settings($user_animation, $user_speed, $menu_active_icon_hover)
{
    $tmp_array       = array();

    $tmp_array['user_animation'] = $user_animation;
    $tmp_array['user_speed']     = $user_speed;
    $tmp_array['menu_active_icon_hover'] = $menu_active_icon_hover;

    update_option('asdb_mmenu', $tmp_array);
}

function get_js_settings()
{
    return get_option('asdb_mmenu');
}

function save_menu_settings($menu_data)
{
    $menu_saved_data = get_menu_settings();
    $menu_slug_name  = key($menu_data);

    if(isset($menu_saved_data[$menu_slug_name]))
    {
        $menu_saved_data[$menu_slug_name] = $menu_data[$menu_slug_name];
        $menu_data = $menu_saved_data;
    }
    else
    {
        if(is_array($menu_saved_data))
        {
            $menu_data = array_merge($menu_saved_data, $menu_data);
        }
    }

    update_option('asdb_mmenu_data', $menu_data);
}

function get_menu_settings()
{
    return get_option('asdb_mmenu_data');
}

function get_menu_slug()
{
    if(isset($_POST['menu_slug_name']))
    {
        $menu_slug_name = $_POST['menu_slug_name'];
    }
    else
    {
        $locations = array();
        $locations = wp_get_nav_menus();

        if(count($locations) > 0)
        {
            $menu_slug_name = $locations[0]->slug;
        }
    }

    return $menu_slug_name;
}
