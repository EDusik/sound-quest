(function () {
  var t = localStorage.getItem("theme");
  var dark = t !== "light";
  if (dark) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
  var href = dark ? "/icon.svg" : "/icon-dark.svg";
  var links = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
  for (var i = 0; i < links.length; i++) links[i].href = href;
})();
