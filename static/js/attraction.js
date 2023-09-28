//取得網址id
let urlId = location.pathname.split("/")[2];
let attractionCarousel = document.querySelector(".attraction-carousel");
let attractionImgContainer = document.querySelector(".attractionImg-container");
let profile = document.querySelector(".profile");
let infos = document.querySelector(".infos");
let dotContainer = document.querySelector(".dot-container");

//連接/api/attraction
async function attraction(urlId) {
  const response = await fetch(`/api/attraction/${urlId}`);
  const result = await response.json();
  const data = result.data;
  // console.log(data);
  createAttraction(data);
  showSlide();
}

function createAttraction(data) {
  //創建區塊
  //image
  let src = data.images[0].split(",");
  for (let i = 0; i < src.length; i++) {
    let attractionImg = document.createElement("img");
    attractionImgContainer.appendChild(attractionImg);
    let file = src[i];
    // console.log(file);
    attractionImg.setAttribute("src", file);
    attractionImg.setAttribute("class", "attraction-image");
    //根據圖片數量製作圓點
    let dot = document.createElement("div");
    dotContainer.appendChild(dot);
    dot.setAttribute("class", "dot");
    dot.addEventListener("click", () => {
      slideIndex = i;
      showSlide();
    });
  }

  //attractionInfo
  let attractionInfo = document.createElement("div");
  profile.appendChild(attractionInfo);
  attractionInfo.classList.add("attractionInfo", "normal", "margin-bottom-15");

  //cat
  let attractionCat = document.createElement("div");
  attractionInfo.appendChild(attractionCat);
  attractionCat.classList.add("attractionCat", "normal", "margin-bottom-15");
  attractionCat.textContent = data.category;

  //at
  let at = document.createElement("p");
  attractionInfo.appendChild(at);
  at.setAttribute("class", "at");
  at.textContent = " at ";

  //mrt
  let attractionMrt = document.createElement("div");
  attractionInfo.appendChild(attractionMrt);
  attractionMrt.classList.add("attractionMrt", "normal", "margin-bottom-15");
  attractionMrt.textContent = data.mrt;

  //name
  let attractionName = document.createElement("div");
  profile.appendChild(attractionName);
  attractionName.classList.add("atrractionName", "bold", "margin-bottom-15");
  attractionName.textContent = data.name;

  //description
  let attractionDescription = document.createElement("div");
  infos.appendChild(attractionDescription);
  attractionDescription.classList.add(
    "attraction-description",
    "margin-bottom-30",
    "normal-400"
  );
  attractionDescription.textContent = data.description;

  let address = document.createElement("p");
  infos.appendChild(address);
  address.classList.add("address", "bold");
  address.textContent = "景點地址：";

  //address
  let attractionAddress = document.createElement("div");
  infos.appendChild(attractionAddress);
  attractionAddress.classList.add(
    "attraction-address",
    "margin-bottom-30",
    "normal-400"
  );
  attractionAddress.textContent = data.address;

  let transport = document.createElement("p");
  infos.appendChild(transport);
  transport.classList.add("transport", "bold");
  transport.textContent = "交通方式：";

  //transport
  let attractionTransport = document.createElement("div");
  infos.appendChild(attractionTransport);
  attractionTransport.classList.add(
    "attraction-transport",
    "normal-400",
    "margin-bottom-30"
  );
  attractionTransport.textContent = data.transport;
}
attraction(urlId);

//進到畫面時先預設上半天
let morningRadio = document.getElementById("morning-radio");
let afternoonRadio = document.getElementById("afternoon-radio");
let bookingPrice = document.querySelector(".price");

window.addEventListener("load", () => {
  bookingPrice.innerHTML = "新台幣 2000元";
  morningRadio.addEventListener("click", () => {
    bookingPrice.innerHTML = "新台幣 2000元";
  });

  afternoonRadio.addEventListener("click", () => {
    bookingPrice.innerHTML = "新台幣 2500元";
  });
});
let startBooking = document.querySelector(".booking-submit");
let bookingDateInput = document.querySelector("#custom-calendar");

startBooking.addEventListener("click", (e) => {
  e.preventDefault();

  let storedToken = localStorage.getItem("token");
  if (!storedToken) {
    dialog.style.display = "block";
  } else {
    let bookingDate = bookingDateInput.value;
    let selectedTime = morningRadio.checked ? "上半天" : "下半天";
    let selectedPrice =
      selectedTime === "上半天" ? "新台幣 2000元" : "新台幣 2500元";

    fetch("/api/booking", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${storedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: urlId,
        date: bookingDate,
        time: selectedTime,
        price: selectedPrice,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        if (result.ok) {
          window.location.href = "/booking";
        } else {
          let bookingErrorHint = document.querySelector(".booking-error-hint");
          bookingErrorHint.innerHTML = result.message;
          bookingErrorHint.style.color = "red";
        }
      });
  }
});

//輪播圖
let slideIndex = 0;
let leftArrow = document.querySelector(".left-arrow");
let rightArrow = document.querySelector(".right-arrow");
let translateXValue;

function showSlide() {
  let imgs = document.querySelectorAll(".attraction-image");
  let dots = document.querySelectorAll(".dot");
  let imgCount = imgs.length;

  if (slideIndex > imgCount - 1) {
    slideIndex = 0;
  }
  if (slideIndex < 0) {
    slideIndex = imgCount - 1;
  }
  translateXValue = -slideIndex * 100;
  attractionImgContainer.style.transform = `translateX(${translateXValue}%)`;
  for (let i = 0; i < imgCount; i++) {
    dots[i].classList.remove("active");
    // imgs[i].style.display="none";
  }
  dots[slideIndex].classList.add("active");
  // imgs[slideIndex].style.display="block";
}
function next() {
  slideIndex++;
  showSlide();
}
function prev() {
  slideIndex--;
  showSlide();
}
leftArrow.addEventListener("click", () => {
  prev();
});
rightArrow.addEventListener("click", () => {
  next();
});

//強迫用戶只能選今天及今天以後的日期
let today = new Date().toISOString().split("T")[0];
bookingDateInput.min = today;
