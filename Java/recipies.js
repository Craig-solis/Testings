const recipes = {
  'Chocolate Cake': {
    title: 'Chocolate Cake',
    content: '<h2>Chocolate Cake</h2><p>A rich and moist chocolate cake recipe.</p>'
  },
  'Apple Pie': {
    title: 'Apple Pie',
    content: '<h2>Apple Pie</h2><p>Classic apple pie with a flaky crust.</p>'
  }
};

document.querySelectorAll('.recipe-item').forEach(item => {
  item.addEventListener('click', function() {
    const recipe = recipes[item.getAttribute('data-recipe')];
    const main = document.getElementById('main-recipe');
    main.innerHTML = recipe.content;
  });
});

document.querySelectorAll('.group-toggle').forEach(btn => {
  btn.addEventListener('click', function() {
    const group = btn.getAttribute('data-group');
    const list = document.getElementById(group + '-list');
    list.style.display = list.style.display === 'none' ? 'block' : 'none';
  });
});

document.getElementById('searchBar').addEventListener('input', function(e) {
  const query = e.target.value.toLowerCase();
  document.querySelectorAll('.recipe-item').forEach(item => {
    item.style.display = item.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
});