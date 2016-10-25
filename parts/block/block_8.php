<?php
global $asdbblock;
$thumb ='thumb-medium';
if ( isset($asdbblock['thumb']) ) {$thumb = $asdbblock['thumb'];}
?>

<div class="mod8 mod_wrap">
<?php echo get_blocks_image($thumb);?>

<div class="item-info">
    <?php echo get_blocks_title();?>
</div>

</div>
