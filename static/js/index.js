let fetching = false;
let nextPage = 0;
let keyword;

//建立list-bar，左右滾動的功能
let listBar = document.querySelector(".list-bar");
let buttonPrev = document.querySelector(".btn-prev");
let buttonNext = document.querySelector(".btn-next");
let carousel = document.querySelector(".carousel");

let currentIndex = 0;
let data;

buttonPrev.addEventListener("click", () => {
  if (currentIndex === 0) {
    return;
  }
  currentIndex -= 1 / data.data[0].length;
  console.log(currentIndex);
  slideMrt(currentIndex, data);
});

buttonNext.addEventListener("click", () => {
  if (window.innerWidth < 600) {
    if (currentIndex === 0.3125) {
      return;
    }
  } else if (window.innerWidth < 1200) {
    if (currentIndex === 0.1875) {
      return;
    }
  } else {
    if (currentIndex === 0.0625) {
      return;
    }
  }

  currentIndex += 1 / data.data[0].length;
  console.log(currentIndex);
  slideMrt(currentIndex, data);
});

const slideMrt = (currentIndex) => {
  if (window.innerWidth < 600) {
    carousel.style.transform = `translate(-${currentIndex * 3 * 100}%)`;
  } else if (window.innerWidth < 1200) {
    carousel.style.transform = `translate(-${currentIndex * 5 * 100}%)`;
  } else {
    carousel.style.transform = `translate(-${currentIndex * 14 * 100}%)`;
  }
};

// 抓取 api/mrts 的資料
function getMrt() {
  fetch("/api/mrts")
    .then((response) => response.json())
    .then((responseData) => {
      data = responseData;

      carousel.innerHTML = "";

      //每個捷運站名都用 span 包起來
      data.data[0].forEach((station) => {
        let spanElement = document.createElement("span");
        spanElement.textContent = station;
        carousel.appendChild(spanElement);

        // 點選 span 時，searchInput = station -> 執行搜尋
        spanElement.addEventListener("click", () => {
          document.querySelector("#searchInput").value = station;
          searchAttractions(station);
        });
      });
    });
}

getMrt();

function searchAttractions(stationName) {
  keyword = stationName;
  nextPage = 0;
  attraction.innerHTML = "";

  if (!keyword) {
    fetchData(`/api/attractions?page=${nextPage}`);
  } else {
    fetchData(
      `/api/attractions?page=${nextPage}&keyword=${encodeURIComponent(keyword)}`
    );
  }
}

//關鍵字搜尋
const searchBtn = document.querySelector(".searchBtn");
searchBtn.addEventListener("click", () => {
  const searchInput = document.querySelector("#searchInput").value;
  keyword = searchInput;
  nextPage = 0;
  attraction.innerHTML = "";
  searchAttractions(searchInput);
  observer.observe(footer);
});
//關鍵字搜尋－enter
searchInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    const searchValue = searchInput.value;
    keyword = searchValue;
    nextPage = 0;
    attraction.innerHTML = "";
    searchAttractions(searchValue);
    observer.observe(footer);
  }
});

//從api/atrractions抓資料
const loadingIndicator = document.querySelector(".loading-indicator");

function fetchData(url) {
  fetching = true;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      fetching = false;
      if (data.data.length === 0) {
        displayErrorMessage(`找不到 ${keyword} 的搜尋結果，請重試`);
      } else {
        loadingIndicator.style.display = "flex";
        setTimeout(() => {
          loadingIndicator.style.display = "none";
        }, 2000);
        getData(data);
        loadingIndicator.style.display = "none";
      }
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      fetching = false;
    });
}

//創建attraction區塊
let attraction = document.querySelector(".attraction");
function getData(data) {
  for (let index = 0; index < data.data.length; index++) {
    // 創建attractionCard
    let attractionCard = document.createElement("div");
    attractionCard.setAttribute("class", "attractionCard");
    //連結到/attraction/id
    attractionCard.addEventListener("click", () => {
      let attractionId = data.data[index].id;
      window.location.href = `/attraction/${attractionId}`;
    });

    // 圖片區域 attractionCard > img
    let atrractionImg = document.createElement("img");
    attractionCard.appendChild(atrractionImg);

    let src = data.data[index].images[0].split(",")[0];
    atrractionImg.setAttribute("src", src);

    // 文字區域
    // 景點名稱 attractionCard > attractionName
    let attractionName = document.createElement("div");
    attractionCard.appendChild(attractionName);
    attractionName.setAttribute("class", "attractionName");
    attractionName.textContent = data.data[index].name;

    // mrt & 類別用同一個div包起來 attractionCard > attractionInfo
    let attractionInfo = document.createElement("div");
    attractionCard.appendChild(attractionInfo);
    attractionInfo.setAttribute("class", "attractionInfo");

    // mrt名稱 attractionInfo > attractionMrt
    let attractionMrt = document.createElement("div");
    attractionInfo.appendChild(attractionMrt);
    attractionMrt.setAttribute("class", "attractionMrt");
    attractionMrt.textContent = data.data[index].mrt;

    // 類別 attractionInfo > attractionCat
    let attractionCat = document.createElement("div");
    attractionInfo.appendChild(attractionCat);
    attractionCat.setAttribute("class", "attractionCat");
    attractionCat.textContent = data.data[index].category;

    // 將新的資料附加到現有資料上
    attraction.appendChild(attractionCard);
  }

  // 更新 nextPage
  nextPage = data.nextPage;
  if (nextPage === null) {
    observer.unobserve(footer);
  }
}

// infinite scroll
const options = {
  root: null,
  rootMargin: "0px",
  threshold: 0.5,
};

const footer = document.querySelector("footer");
const observer = new IntersectionObserver(infiniteScroll, options);
observer.observe(footer);

function infiniteScroll(entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      if (fetching === false) {
        if (!keyword) {
          const url = `/api/attractions?page=${nextPage}`;
          fetchData(url);
        } else {
          const url = `/api/attractions?page=${nextPage}&keyword=${encodeURIComponent(
            keyword
          )}`;
          fetchData(url);
        }
      }
    }
  });
}

// 錯誤訊息的提醒
function displayErrorMessage(message) {
  attraction.innerHTML = "";

  const errorMessage = document.createElement("div");
  errorMessage.setAttribute("class", "error-message");
  errorMessage.textContent = message;
  attraction.appendChild(errorMessage);
}
