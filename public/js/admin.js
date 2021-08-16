const deleteProduct = (btn) => {
  const prodId = btn.parentNode.querySelector("[name=productId]").value;

  const csrfToken = btn.parentNode.querySelector("[name=_csrf]").value;

  const productElement = btn.closest(".card");

  fetch("/admin/adminProducts-list/" + prodId, {
    method: "DELETE",
    headers: {
      "csrf-token": csrfToken,
    },
  })
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      productElement.parentNode.removeChild(productElement);
    })
    .catch((err) => {
      console.log(err);
    });
};
