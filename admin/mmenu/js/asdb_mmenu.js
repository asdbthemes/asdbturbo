jQuery(document).ready(function () {

    jQuery('#menu-list').change(function () {
        jQuery('#save_menu').click();
    });

    jQuery(".remove-image, .remove-icon").on("click", function () {
        input_id = jQuery(this).attr("id")
        jQuery("#" + input_id).val('');

    });

    jQuery(".metro-item-icon").on("click", function () {
        icon_item = jQuery(this).attr("id");
        upload = 'icon';
        tb_show('', 'media-upload.php?type=image&amp;post_id=0&amp;TB_iframe=true');

        window.send_to_editor = function (html) {
            html = '<div>' + html + '</div>';
            imgurl = jQuery('img', html).attr('src');

            if (upload == 'icon') {

                var img = new Image();
                img.onload = function () {

                    if(icon_item.indexOf('active_icon')>=0)
                    {
                        jQuery("#ac_ic_" + icon_item).attr("src", imgurl);
                        jQuery("#ac_ic_" + icon_item).css("height", "32");
                        jQuery("#ac_ic_" + icon_item).css("width", "32");
                    }
                    else
                    {
                        jQuery("#hv_ic_" + icon_item).attr("src", imgurl);
                        jQuery("#hv_ic_" + icon_item).css("width", "32");
                        jQuery("#hv_ic_" + icon_item).css("height", "32");
                    }


                    jQuery("#" + icon_item).val(imgurl);

                };
                img.src = imgurl;
            }
            tb_remove();
        }

        return false;
    });
});