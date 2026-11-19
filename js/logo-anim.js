$(function () {
  var $wrap = $('.logo-animated-wrap');
  if (!$wrap.length) return;

  $wrap.on('click', function () {
    $wrap.toggleClass('expanded');
  });

  $wrap.on('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      $wrap.toggleClass('expanded');
    }
  });
});