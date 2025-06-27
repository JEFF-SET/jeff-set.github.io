// jQuery пример, если нужно запускать анимацию по клику или событию
$(function() {
    $('.logo-animated-wrap').on('mouseenter', function(){
      $(this).addClass('hovered');
    }).on('mouseleave', function(){
      $(this).removeClass('hovered');
    });
  });