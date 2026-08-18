 let products = [];
let cart = JSON.parse(localStorage.ms_cart || "[]");

let selectedProduct = null;
let selectedVariant = null;
let selectedQty = 1;


/* =========================
   API
========================= */

async function api(url, options){

  const response = await fetch(url, options);

  return response.json();
}


/* =========================
   LOAD PRODUCTS
========================= */

async function load(){

  products = await api("/api/products");

  render();

  save();
}


/* =========================
   PRODUCT LIST
========================= */

function render(){

  let q =
    (document.getElementById("q").value || "")
      .toLowerCase();


  document.getElementById("products").innerHTML =

    products

      .filter(p =>
        p.name.toLowerCase().includes(q)
      )

      .map(p => {

        return `

          <article
            onclick="productOpen(${p.id})"
            style="cursor:pointer"
          >

            <div class="pic">

              ${
                p.image

                ? `
                  <img
                    src="${p.image}"
                    alt="${p.name}"
                  >
                `

                : "🛍️"
              }

            </div>


            <small>
              ${p.cat} · ${p.unit}
            </small>


            <h3>
              ${p.name}
            </h3>


            <span class="old">

              ${
                p.mrp > p.price
                ? "₹" + p.mrp
                : ""
              }

            </span>


            <b>
              ₹${p.price}
            </b>


            <div>

              ${
                p.stock
                ? `Stock: ${p.stock}`
                : "Out of Stock"
              }

            </div>


            <button
              onclick="event.stopPropagation();productOpen(${p.id})"
              ${!p.stock ? "disabled" : ""}
            >

              ${
                p.stock
                ? "View Product"
                : "Out of Stock"
              }

            </button>

          </article>

        `;

      })

      .join("");
}


/* =========================
   PRODUCT DETAILS OPEN
========================= */

function productOpen(id){

  selectedProduct =
    products.find(p => p.id === id);


  if(!selectedProduct)
    return;


  selectedQty = 1;


  /*
    Admin থেকে options এসেছে কিনা
  */

  const options =
    selectedProduct.options || {};


  const variants =
    options.variants ||
    options.weights ||
    [];


  /*
    প্রথম variant automatically select
  */

  if(variants.length){

    selectedVariant = variants[0];

  }else{

    selectedVariant = null;

  }


  renderProductDetails();


  document.getElementById("productModal")
    .style.display = "flex";
}


/* =========================
   PRODUCT DETAILS UI
========================= */

function renderProductDetails(){

  const p = selectedProduct;


  const options =
    p.options || {};


  const variants =
    options.variants ||
    options.weights ||
    [];


  let price =
    selectedVariant
      ? Number(selectedVariant.price)
      : Number(p.price);


  document.getElementById(
    "productDetailsContent"
  ).innerHTML = `

    ${
      p.image

      ? `
        <div class="detailsImage">

          <img
            src="${p.image}"
            alt="${p.name}"
          >

        </div>
      `

      : `
        <div class="detailsImage">
          🛍️
        </div>
      `
    }


    <small>
      ${p.cat}
    </small>


    <h2>
      ${p.name}
    </h2>


    ${
      p.mrp > price

      ? `
        <span class="old">
          ₹${p.mrp}
        </span>
      `

      : ""
    }


    <h2 class="detailsPrice">
      ₹${price}
    </h2>


    ${
      variants.length

      ? `

        <h3>
          Select Option
        </h3>


        <div class="variantList">

          ${
            variants.map((v,i)=>`

              <button
                class="
                  variantButton
                  ${selectedVariant === v ? "selected" : ""}
                "
                onclick="selectVariant(${i})"
              >

                ${v.weight || v.name}

                <span>
                  ₹${v.price}
                </span>

              </button>

            `).join("")
          }

        </div>

      `

      : ""
    }


    <div class="detailsStock">

      ${
        p.stock
        ? `📦 ${p.stock} available`
        : "❌ Out of Stock"
      }

    </div>


    ${
      p.stock

      ? `

        <div class="detailsQty">

          <button onclick="changeDetailQty(-1)">
            −
          </button>


          <strong>
            ${selectedQty}
          </strong>


          <button onclick="changeDetailQty(1)">
            +
          </button>

        </div>


        <button
          class="detailsAdd"
          onclick="addSelectedToCart()"
        >

          🛒 Add to Cart

        </button>

      `

      : `

        <button disabled>
          Out of Stock
        </button>

      `
    }

  `;
}


/* =========================
   SELECT VARIANT
========================= */

function selectVariant(index){

  const options =
    selectedProduct.options || {};


  const variants =
    options.variants ||
    options.weights ||
    [];


  selectedVariant =
    variants[index];


  renderProductDetails();
}


/* =========================
   DETAIL QUANTITY
========================= */

function changeDetailQty(change){

  if(!selectedProduct)
    return;


  selectedQty += change;


  if(selectedQty < 1)
    selectedQty = 1;


  if(selectedQty > selectedProduct.stock){

    selectedQty =
      selectedProduct.stock;

    alert(
      "এই product-এর এত stock নেই।"
    );

  }


  renderProductDetails();
}


/* =========================
   ADD SELECTED PRODUCT
========================= */

function addSelectedToCart(){

  if(!selectedProduct)
    return;


  const variantKey =
    selectedVariant
      ? (
          selectedVariant.weight ||
          selectedVariant.name
        )
      : "default";


  let item =
    cart.find(x =>
      x.id === selectedProduct.id &&
      x.variant === variantKey
    );


  if(item){

    item.qty += selectedQty;

  }else{

    cart.push({

      id: selectedProduct.id,

      qty: selectedQty,

      variant: variantKey,

      price:
        selectedVariant
          ? Number(selectedVariant.price)
          : Number(selectedProduct.price)

    });

  }


  save();

  productClose();

  alert("🛒 Cart-এ যোগ হয়েছে");

}


/* =========================
   PRODUCT CLOSE
========================= */

function productClose(){

  document.getElementById(
    "productModal"
  ).style.display = "none";

}


/* =========================
   SAVE CART
========================= */

function save(){

  localStorage.ms_cart =
    JSON.stringify(cart);


  document.getElementById(
    "count"
  ).textContent =
    cart.reduce(
      (a,x)=>a+x.qty,
      0
    );

}


/* =========================
   CART
========================= */

function cartOpen(){

  document.getElementById(
    "modal"
  ).style.display = "flex";


  let sum = 0;


  document.getElementById(
    "cart"
  ).innerHTML =

    cart.map((x,index)=>{

      const p =
        products.find(
          a => a.id === x.id
        );


      if(!p)
        return "";


      const price =
        Number(
          x.price ?? p.price
        );


      const total =
        price * x.qty;


      sum += total;


      return `

        <div class="cartItem">

          <div>

            <b>
              ${p.name}
            </b>


            ${
              x.variant !== "default"

              ? `
                <small>
                  ${x.variant}
                </small>
              `

              : ""
            }


            <div>
              ₹${price} × ${x.qty}
            </div>

          </div>


          <div>

            <b>
              ₹${total}
            </b>


            <button
              onclick="removeItem(${index})"
            >
              −
            </button>

          </div>

        </div>

      `;

    }).join("")

    || "<p>Cart খালি</p>";


  let delivery =
    sum >= 500 ? 0 : 30;


  document.getElementById(
    "total"
  ).innerHTML = `

    <p>
      Subtotal ₹${sum}
    </p>

    <p>
      Delivery ${
        delivery
          ? "₹" + delivery
          : "FREE"
      }
    </p>

    <h3>
      Total ₹${sum + delivery}
    </h3>

  `;

}


/* =========================
   REMOVE CART ITEM
========================= */

function removeItem(index){

  if(!cart[index])
    return;


  cart[index].qty--;


  if(cart[index].qty <= 0){

    cart.splice(index,1);

  }


  save();

  render();

  cartOpen();

}


/* =========================
   CART CLOSE
========================= */

function cartClose(){

  document.getElementById(
    "modal"
  ).style.display = "none";

}


/* =========================
   CHECKOUT
========================= */

async function checkout(){

  if(!cart.length)
    return alert("Cart খালি");


  let name =
    prompt("Customer Name?");


  let mobile =
    prompt("Mobile Number?");


  let address =
    prompt("Delivery Address?");


  if(!name || !mobile || !address)
    return;


  let subtotal =
    cart.reduce(
      (sum,x)=>{

        return sum +
          Number(x.price) *
          x.qty;

      },
      0
    );


  let delivery =
    subtotal >= 500
      ? 0
      : 30;


  let o =
    await api(
      "/api/orders",
      {

        method:"POST",

        headers:{
          "Content-Type":
            "application/json"
        },

        body:JSON.stringify({

          name,

          mobile,

          address,

          total:
            subtotal +
            delivery,

          items:cart

        })

      }
    );


  alert(
    "Order #" +
    o.no +
    " placed"
  );


  cart = [];


  save();

  render();

  cartClose();

}


/* =========================
   START
========================= */

load();
