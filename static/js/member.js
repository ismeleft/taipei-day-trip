//彈出式視窗
let loginBtn= document.querySelector(".nav-button-login");
let dialog = document.querySelector(".dialog");
loginBtn.addEventListener("click",(e)=>{
  dialog.style.display="block";
})
//點此註冊
let loginToSignup = document.querySelector(".login-to-signup");
let dialogSinup = document.querySelector(".dialog-signup");
loginToSignup.addEventListener("click",(e)=>{
  e.preventDefault();
  dialogSinup.style.display="block";
  dialog.style.display="none";

})
//點此登入
let signupToLogin = document.querySelector(".signup-to-login");
signupToLogin.addEventListener("click",(e)=>{
  e.preventDefault();
  dialog.style.display="block";
  dialogSinup.style.display="none";
})
//會員註冊帳號
let signup = document.querySelector(".signup-button");
let signupErrorHint = document.querySelector(".signup-error-hint");

signup.addEventListener("click",(e)=>{
  e.preventDefault();
  let signupName = document.querySelector(".signup-name").value;
  let signupEmail = document.querySelector(".signup-email").value;
  let signupPassword = document.querySelector(".signup-password").value;
  fetch("/api/user",{
    method : "POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      "name":signupName,
      "email":signupEmail,
      "password":signupPassword

    })
  }).then(function(response){
    return response.json();
  })
  .then(result=>{
    console.log(result);
    if(result.error){
      signupErrorHint.innerHTML=result.message;
    }else{
      signupErrorHint.innerHTML="註冊成功，請登入！"
      signupErrorHint.style.color="green";
    }
  }).catch(function(error){
    signupErrorHint.innerHTML = "伺服器錯誤，請重試。";
    signupErrorHint.style.color = "red";
  })

})
//會員登入帳號
let login = document.querySelector(".login-button");
let loginErrorHint = document.querySelector(".login-error-hint");
login.addEventListener("click",(e)=>{
  console.log(e.target);
  e.preventDefault();
  let loginEmail = document.querySelector(".login-email").value;
  let loginPassword = document.querySelector(".login-password").value;
  fetch("/api/user/auth",{
    method:"PUT",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      "email":loginEmail,
      "password":loginPassword
    })
  }).then(function(response){
    return response.json();
  }).then(function(result){
    console.log(result);
    if(result.error){
      loginErrorHint.innerHTML=result.message;
      loginErrorHint.style.color="red";
    }else{
      let jwtToken = result.token;
      localStorage.setItem("token", jwtToken);
      window.location.reload();

    }
  }).catch(function(error){
    console.log(error);
  })

})
//關閉視窗
let closeWindowLogin = document.querySelector(".close-window-login");
closeWindowLogin.addEventListener("click",()=>{
  dialog.style.display="none";
})
let closeWindowSignup = document.querySelector(".close-window-signup");
closeWindowSignup.addEventListener("click",()=>{
  dialogSinup.style.display="none";
})

//確認使用者的狀態
let logoutBtn = document.querySelector(".nav-button-logout");
window.addEventListener("load",()=>{
  let storedToken=localStorage.getItem("token");
  if (!storedToken) {
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
  } else{
    fetch("/api/user/auth",{
      method:"GET",
      headers:{
        'Authorization': `Bearer ${storedToken}`
      }
    }).then(function(response){
      return response.json();
    }).then(function(result){
      console.log(result);
      if(result.data == null){
        loginBtn.style.display="block";
        logoutBtn.style.display="none";
      }else{
        loginBtn.style.display="none";
        logoutBtn.style.display="block";
      }
    }).catch(function(error){
      console.log(error);
    })
  }
  
})

//登出清除localStorage
logoutBtn.addEventListener("click",()=>{
  localStorage.removeItem("token");
  window.location.reload();
})

