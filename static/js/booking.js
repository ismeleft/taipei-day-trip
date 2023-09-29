//input creditcard number
const input = document.querySelector(".payment-number");
input.addEventListener(
  "input",
  () => (input.value = formatNumber(input.value.replaceAll(" ", "")))
);

const formatNumber = (number) =>
  number.split("").reduce((seed, next, index) => {
    if (index !== 0 && !(index % 4)) seed += " ";
    return seed + next;
  }, "");

//跳轉到booking頁面後，1.確認使用者是否有登入？如果沒有，跳轉回首頁
//2.如果有登入，取得尚未下單的預定行程。
let loginUsername = document.querySelector(".login-username");
let contactFormName = document.querySelector(".contact-form-name");
let contactFormEmail = document.querySelector(".contact-form-email");
let bookingWrapper = document.querySelector(".booking-wrapper");
let booking = document.querySelector(".booking");
let noBookingMessage = document.querySelector(".no-booking-message");
let bookImage = document.querySelector(".booking-img");
let bookingInfoTitle = document.querySelector(".booking-info-title");
let bookingInfoDate = document.querySelector(".booking-info-date");
let bookingInfoTime = document.querySelector(".booking-info-time");
let bookingInfoAddress = document.querySelector(".booking-info-address");
let confirmPayment = document.querySelector(".confirm-payment");
let footer = document.querySelector("footer");

window.addEventListener("load", (e) => {
  e.preventDefault();
  let storedToken = localStorage.getItem("token");
  fetch("/api/user/auth", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${storedToken}`,
    },
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.data != null) {
        loginUsername.innerHTML = result.data.name;
        contactFormName.value = result.data.name;
        contactFormEmail.value = result.data.email;

        fetch("/api/booking", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })
          .then((response) => {
            console.log(response);
            return response.json();
          })
          .then((result) => {
            if (result.data != null) {
              bookingWrapper.style.display = "block";
              noBookingMessage.style.display = "none";
              bookImage.src = result.data.attraction.image;
              bookingInfoTitle.innerText =
                "台北一日遊：" + result.data.attraction.name;
              bookingInfoTime.innerText = "時間：" + result.data.time;
              bookingInfoDate.innerText = "日期：" + result.data.date;
              bookingInfoAddress.innerText =
                "地點：" + result.data.attraction.address;
              confirmPayment.innerText = "總價：" + result.data.price;
            } else {
              bookingWrapper.style.display = "none";
              noBookingMessage.style.display = "block";
              footer.style.height = "80vh";
            }
          });
      } else {
        window.location.href = "/";
      }
    });
});

//點選刪除按鈕，呼叫刪除預定資料api
let trashBtn = document.querySelector(".trash-button");
trashBtn.addEventListener("click", () => {
  let storedToken = localStorage.getItem("token");
  fetch("/api/booking", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${storedToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (result.ok) {
        window.location.reload();
        bookingWrapper.style.display = "none";
        noBookingMessage.style.display = "block";
        footer.style.height = "80vh";
      }
    })
    .catch((error) => {
      console.error(error);
    });
});
