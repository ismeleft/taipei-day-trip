let num = window.location.search.split("=")[1];
console.log(num);

let orderNumber = document.querySelector(".orderNumber");
orderNumber.textContent = num;
