//彈出式視窗
let loginBtn = document.querySelector(".nav-button-login");
let dialog = document.querySelector(".dialog");
loginBtn.addEventListener("click", (e) => {
  dialog.style.display = "block";
});
//點此註冊
let loginToSignup = document.querySelector(".login-to-signup");
let dialogSinup = document.querySelector(".dialog-signup");
loginToSignup.addEventListener("click", (e) => {
  e.preventDefault();
  dialogSinup.style.display = "block";
  dialog.style.display = "none";
});
//點此登入
let signupToLogin = document.querySelector(".signup-to-login");
signupToLogin.addEventListener("click", (e) => {
  e.preventDefault();
  dialog.style.display = "block";
  dialogSinup.style.display = "none";
});
//會員註冊帳號
let signupForm = document.querySelector(".signup");
let signupErrorHint = document.querySelector(".signup-error-hint");

signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  let signupName = document.querySelector(".signup-name").value;
  let signupEmail = document.querySelector(".signup-email").value;
  let signupPassword = document.querySelector(".signup-password").value;
  fetch("/api/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: signupName,
      email: signupEmail,
      password: signupPassword,
    }),
  })
    .then(function (response) {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      if (result.error) {
        signupErrorHint.innerHTML = result.message;
      } else {
        signupErrorHint.innerHTML = "註冊成功，請登入！";
        signupErrorHint.style.color = "green";
      }
    })
    .catch(function (error) {
      signupErrorHint.innerHTML = "伺服器錯誤，請重試。";
      signupErrorHint.style.color = "red";
    });
});
//會員登入帳號
let loginForm = document.querySelector(".login");
let loginErrorHint = document.querySelector(".login-error-hint");
loginForm.addEventListener("submit", (e) => {
  console.log(e.target);
  e.preventDefault();
  let loginEmail = document.querySelector(".login-email").value;
  let loginPassword = document.querySelector(".login-password").value;
  fetch("/api/user/auth", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: loginEmail,
      password: loginPassword,
    }),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      if (result.error) {
        loginErrorHint.innerHTML = result.message;
        loginErrorHint.style.color = "red";
      } else {
        let jwtToken = result.token;
        localStorage.setItem("token", jwtToken);
        window.location.reload();
      }
    })
    .catch(function (error) {
      console.log(error);
    });
});
//關閉視窗
let closeWindowLogin = document.querySelector(".close-window-login");
closeWindowLogin.addEventListener("click", () => {
  dialog.style.display = "none";
});
let closeWindowSignup = document.querySelector(".close-window-signup");
closeWindowSignup.addEventListener("click", () => {
  dialogSinup.style.display = "none";
});

//確認使用者的狀態
let memberCenterBtn = document.querySelector(".nav-button-membercenter");
window.addEventListener("DOMContentLoaded", () => {
  let storedToken = localStorage.getItem("token");
  if (!storedToken) {
    loginBtn.style.display = "block";
    memberCenterBtn.style.display = "none";
  } else {
    loginBtn.style.display = "none";
    memberCenterBtn.style.display = "block";
    if (window.location.pathname != "/booking") {
      fetch("/api/user/auth", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (result) {
          if (result.data == null) {
            loginBtn.style.display = "block";
            memberCenterBtn.style.display = "none";
          } else {
            loginBtn.style.display = "none";
            memberCenterBtn.style.display = "block";
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }
});

//點選會員中心跳轉
memberCenterBtn.addEventListener("click", (e) => {
  console.log(e.target);
  window.location.href = "/membercenter";
});

//點選預定行程，確認用戶是否有登入
let navButtonBooking = document.querySelector(".nav-button-booking");
navButtonBooking.addEventListener("click", () => {
  let storedToken = localStorage.getItem("token");
  if (!storedToken) {
    dialog.style.display = "block";
  } else {
    window.location.href = "/booking";
  }
});
