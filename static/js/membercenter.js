let logoutBtn = document.querySelector(".logout");
let storedToken = localStorage.getItem("token");
//登出清除localStorage
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.reload();
});

window.addEventListener("load", () => {
  if (storedToken) {
    getOrder();
  } else {
    window.location.href = "/";
  }
});
let orderListContainer = document.querySelector(".orderhistoty");

async function getOrder() {
  const response = await fetch("/api/order", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${storedToken}`,
    },
  });
  const ordersData = await response.json();

  for (let order of ordersData) {
    let orderData = order.data;

    let orderElement = document.createElement("div");
    orderElement.classList.add("order-item");

    orderElement.innerHTML = `
                <img class="order_attraction_img" src=${orderData.trip.attraction.image} />
                <div class="order-info">
                  <p>訂單編號：${orderData.number}</p>
                  <p>訂單景點：${orderData.trip.attraction.name}</p>
                  <p>預定地址：${orderData.trip.attraction.address}</p>
                  <p>預定日期：${orderData.trip.date}</p>                
                  <p>預定時段：${orderData.trip.time}</p>
                  <br>
                  <hr>
                  <br>
                  <p>訂單聯絡人：${orderData.contact.name}</p>
                  <p>聯絡人mail：${orderData.contact.email}</p>
                  <p>聯絡人電話：${orderData.contact.phone}</p>
                  <br>
                  <hr>
                  <br>
                  <p>訂單總價：${orderData.price}</p>
                  <p>訂單狀態：${orderData.status}</p> 
                </div>
            `;

    orderListContainer.appendChild(orderElement);
  }
}
