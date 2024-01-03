const $ = element => document.querySelector(element);

// 404 browser window buttons
$('#js-browser__close').addEventListener('click', () => {
  location.href = './index.html';
});

$('#js-browser__minimize').addEventListener('click', () => {
  if ($('#js-browser').classList.contains('browser--is-full-screen')) {
    $('#js-browser').classList.remove('browser--is-full-screen');
  }
  $('#js-browser').classList.toggle('browser--is-minimized');
});

$('#js-browser__maximize').addEventListener('click', () => {
  if ($('#js-browser').classList.contains('browser--is-minimized')) {
    $('#js-browser').classList.remove('browser--is-minimized');
  }
  $('#js-browser').classList.toggle('browser--is-full-screen');
});