var toggleIcon = document.querySelector(".navbar-toggler-icon");

toggleIcon.addEventListener("click", (e) => {
  console.log("gamer");

  let navbarIcon = document.querySelector(".navbar-toggler-icon");

  navbarIcon.classList.toggle("navbar-toggler-icon_on");

  if (navbarIcon.classList.contains("navbar-toggler-icon_on")) {
    toggleIcon.setAttribute("aria-expanded", "true");
    document
      .querySelector(".main-header__item-list")
      .classList.add("main-header__item-list__show");
  } else {
    toggleIcon.setAttribute("aria-expanded", "false");
    document
      .querySelector(".main-header__item-list")
      .classList.remove("main-header__item-list__show");
  }
});
