let fetching = false;
let nextPage = 0;
let attractionSize = 12;
let keyword;

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

const slideMrt = (currentIndex, data) => {
  currentIndex = (currentIndex + data.data[0].length) % data.data[0].length;
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
      console.log(data.data[0]);

      carousel.innerHTML = "";

      data.data[0].forEach((station) => {
        let spanElement = document.createElement("span");
        spanElement.textContent = station;
        carousel.appendChild(spanElement);

        spanElement.addEventListener("click", () => {
          document.querySelector("#searchInput").value = station;
          searchAttractions(station);
        });
      });
    });
}

getMrt();

let attraction = document.querySelector(".attraction");

function fetchAttractions(url) {
  fetching = true;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      fetching = false;
      if (data.data.length === 0) {
        displayErrorMessage("找不到搜尋結果，請重試");
      } else {
        handleAttractionData(data);
      }
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      fetching = false;
    });
}

function handleAttractionData(data) {
  for (let index = 0; index < data.data.length; index++) {
    let attractionCard = document.createElement("div");
    attractionCard.setAttribute("class", "attractionCard");

    let atrractionImg = document.createElement("img");
    attractionCard.appendChild(atrractionImg);

    let src = data.data[index].images[0].split(",")[0];
    atrractionImg.setAttribute("src", src);

    let attractionName = document.createElement("div");
    attractionCard.appendChild(attractionName);
    attractionName.setAttribute("class", "attractionName");
    attractionName.textContent = data.data[index].name;

    let attractionInfo = document.createElement("div");
    attractionCard.appendChild(attractionInfo);
    attractionInfo.setAttribute("class", "attractionInfo");

    let attractionMrt = document.createElement("div");
    attractionInfo.appendChild(attractionMrt);
    attractionMrt.setAttribute("class", "attractionMrt");
    attractionMrt.textContent = data.data[index].mrt;

    let attractionCat = document.createElement("div");
    attractionInfo.appendChild(attractionCat);
    attractionCat.setAttribute("class", "attractionCat");
    attractionCat.textContent = data.data[index].category;

    attraction.appendChild(attractionCard);
  }

  nextPage = data.nextPage;
  console.log(nextPage);

  if (nextPage === null) {
    observer.unobserve(footer);
  }
}

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
          fetchAttractions(url);
        } else {
          const url = `/api/attractions?page=${nextPage}&keyword=${encodeURIComponent(keyword)}`;
          fetchAttractions(url);
        }
        nextPage++;
      }
    }
  });
}

//keyword search
const searchBtn = document.querySelector(".searchBtn");
searchBtn.addEventListener("click", () => {
  const searchInput = document.querySelector("#searchInput").value;
  keyword = searchInput;
  nextPage = 0;
  attraction.innerHTML = "";
  searchAttractions(searchInput);
});

function searchAttractions(stationName) {
  keyword = stationName;
  nextPage = 0;
  attraction.innerHTML = "";

  if (!keyword) {
    fetchAttractions(`/api/attractions?page=${nextPage}`);
  } else {
    fetchAttractions(`/api/attractions?page=${nextPage}&keyword=${encodeURIComponent(keyword)}`);
  }
}

// 錯誤訊息的提醒
function displayErrorMessage(message) {
  attraction.innerHTML = "";

  const errorMessage = document.createElement("div");
  errorMessage.setAttribute("class", "error-message");
  errorMessage.textContent = message;
  attraction.appendChild(errorMessage);
}
