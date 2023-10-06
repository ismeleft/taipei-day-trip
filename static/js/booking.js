let loginUsername = document.querySelector(".login-username");
let contactFormName = document.querySelector(".contact-form-name");
let contactFormEmail = document.querySelector(".contact-form-email");
let contactFormPhone = document.querySelector(".contact-form-phone");
let contactNameErrorMessage = document.querySelector(
  ".error-contactName-message"
);
let contactEmailErrorMessage = document.querySelector(
  ".error-contactEmail-message"
);
let contactPhoneErrorMessage = document.querySelector(
  ".error-contactPhone-message"
);
let paymentErrorMessage = document.querySelector(".payment-error-message");
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
let attractionId;

//contact phone regex
const phoneNumberInput = document.getElementById("phone-number-input");

phoneNumberInput.addEventListener("input", function () {
  const inputValue = phoneNumberInput.value;
  const pattern = /^09\d{8}$/; // 以"09"開頭，後面接8位數字

  if (!pattern.test(inputValue)) {
    phoneNumberInput.setCustomValidity('手機號碼必須以"09"開頭，後接8位數字');
  } else {
    phoneNumberInput.setCustomValidity("");
  }
});

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
              confirmPayment.innerText =
                "總價：新台幣 " + result.data.price + "元";

              attractionId = result.data.attraction.id;
              bookingInfoTitle = result.data.attraction.name;
              bookingInfoAddress = result.data.attraction.address;
              confirmPayment = parseInt(result.data.price);
              console.log(typeof confirmPayment);
              bookingInfoTime = result.data.time;
              bookingInfoDate = result.data.date;
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

// TapPay Settings
TPDirect.setupSDK(
  137051,
  "app_ZfoOieZLI0bqwL6viwud4yM42bPkAaPi14lOaSEZBSRPeF08wpMaQuCfKkKo",
  "sandbox"
);
TPDirect.card.setup({
  fields: {
    number: {
      // css selector
      element: "#card-number",
      placeholder: "**** **** **** ****",
    },
    expirationDate: {
      // DOM object
      element: document.getElementById("card-expiration-date"),
      placeholder: "MM / YY",
    },
    ccv: {
      element: "#card-ccv",
      placeholder: "ccv",
    },
  },
  styles: {
    // Style all elements
    input: {
      color: "gray",
    },
    // Styling ccv field
    "input.ccv": {
      // 'font-size': '16px'
    },
    // Styling expiration-date field
    "input.expiration-date": {
      // 'font-size': '16px'
    },
    // Styling card-number field
    "input.card-number": {
      // 'font-size': '16px'
    },
    // style focus state
    ":focus": {
      // 'color': 'black'
    },
    // style valid state
    ".valid": {
      color: "green",
    },
    // style invalid state
    ".invalid": {
      color: "red",
    },
    // Media queries
    // Note that these apply to the iframe, not the root window.
    "@media screen and (max-width: 400px)": {
      input: {
        color: "orange",
      },
    },
  },
  // 此設定會顯示卡號輸入正確後，會顯示前六後四碼信用卡卡號
  isMaskCreditCardNumber: true,
  maskCreditCardNumberRange: {
    beginIndex: 6,
    endIndex: 11,
  },
});

let confirmBtn = document.querySelector(".confirm-btn");
let paymentfailedText = document.querySelector(".payment-fail-text");
let paymentfailedfield = document.querySelector(".payment-failed");
let transactionInProgress = document.querySelector(".transaction-in-progress");
function displayErrorMessage(element, message) {
  element.innerText = message;
}

confirmBtn.addEventListener("click", (e) => {
  e.preventDefault();
  transactionInProgress.style.display = "flex";
  setTimeout(() => {
    transactionInProgress.style.display = "none";
  }, 3000);
  let storedToken = localStorage.getItem("token");

  let contactName = contactFormName.value.trim();
  let contactEmail = contactFormEmail.value.trim();
  let contactPhone = contactFormPhone.value.trim();

  let tappayStatus = TPDirect.card.getTappayFieldsStatus();

  if (contactName === "" || contactEmail === "" || contactPhone === "") {
    console.log("聯絡資料未填妥，請檢查！");
    if (contactName === "") {
      displayErrorMessage(contactNameErrorMessage, "姓名未填妥，請檢查！");
    }
    if (contactEmail === "") {
      displayErrorMessage(contactEmailErrorMessage, "Email未填妥，請檢查！");
    }
    if (contactPhone === "") {
      displayErrorMessage(contactPhoneErrorMessage, "電話未填妥，請檢查！");
    }
  } else {
    displayErrorMessage(contactNameErrorMessage, "");
    displayErrorMessage(contactEmailErrorMessage, "");
    displayErrorMessage(contactPhoneErrorMessage, "");
  }

  if (
    tappayStatus.status.ccv === 1 ||
    tappayStatus.status.expiry === 1 ||
    tappayStatus.status.number === 1
  ) {
    displayErrorMessage(paymentErrorMessage, "信用卡資料未填妥");
  } else if (
    tappayStatus.status.ccv === 2 ||
    tappayStatus.status.expiry === 2 ||
    tappayStatus.status.number === 2
  ) {
    displayErrorMessage(paymentErrorMessage, "信用卡資料填寫有誤");
  } else {
    TPDirect.card.getPrime((result) => {
      displayErrorMessage(paymentErrorMessage, "");
      fetch("/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prime: result.card.prime,
          order: {
            price: confirmPayment,
            trip: {
              attraction: {
                id: attractionId,
                name: bookingInfoTitle,
                address: bookingInfoAddress,
                image: bookImage.src,
              },
              date: bookingInfoDate,
              time: bookingInfoTime,
            },
            contact: {
              name: contactFormName.value,
              email: contactFormEmail.value,
              phone: contactFormPhone.value,
            },
          },
        }),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.data.payment.status == 0) {
            window.location.href = `/thankyou?number=${result.data.number}`;
          } else {
            paymentfailedfield.style.display = "block";
            paymentfailedText.textContent = `交易失敗：\n您的訂單編號是${result.data.number}，
            \n請至會員中心確認狀態`;
          }
        })
        .catch((error) => {
          console.log(error);
        });
    });
  }
});
