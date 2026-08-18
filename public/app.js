   let products=[],cart=JSON.parse(localStorage.ms_cart||"[]");

async function load(){
  products=await (await fetch("/api/products")).json();
  render();
  save();
}

function render(){

  let q=(document.getElementById("q").value||"").toLowerCase();

  document.getElementById("products").innerHTML=
    products
    .filter(p=>p.name.toLowerCase().includes(q))
    .map(p=>{

      let item=cart.find(x=>x.id===p.id);
      let qty=item?item.qty:0;

      return `
      <article>

        <div class="pic">
          ${p.image
            ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;border-radius:12px">`
            : "🛍️"
          }
        </div>

        <small>${p.cat} · ${p.unit}</small>

        <h3>${p.name}</h3>

        <span class="old">
          ${p.mrp>p.price?"₹"+p.mrp:""}
        </span>

        <b>₹${p.price}</b>

        <div>
          ${p.stock?`Stock: ${p.stock}`:"Out of Stock"}
        </div>

        ${
          p.stock
          ? `
            <div class="qty-control">

              <button onclick="changeQty(${p.id},-1)">
                −
              </button>

              <strong>${qty}</strong>

              <button onclick="changeQty(${p.id},1)">
                +
              </button>

            </div>
          `
          : `
            <button disabled>
              Out of Stock
            </button>
          `
        }

      </article>
      `;
    }).join("");
}

function changeQty(id,change){

  let p=products.find(x=>x.id===id);

  if(!p || !p.stock)return;

  let item=cart.find(x=>x.id===id);

  if(!item){

    if(change>0){
      cart.push({
        id:id,
        qty:1
      });
    }

  }else{

    item.qty+=change;

    if(item.qty<=0){
      cart=cart.filter(x=>x.id!==id);
    }

    if(item.qty>p.stock){
      item.qty=p.stock;
      alert("এই product-এর এত stock নেই।");
    }
  }

  save();
  render();
}

function add(id){
  changeQty(id,1);
}

function save(){

  localStorage.ms_cart=JSON.stringify(cart);

  document.getElementById("count").textContent=
    cart.reduce((a,x)=>a+x.qty,0);
}

function cartOpen(){

  document.getElementById("modal").style.display="flex";

  let sum=0;

  document.getElementById("cart").innerHTML=

    cart.map(x=>{

      let p=products.find(a=>a.id===x.id);

      if(!p)return "";

      let t=p.price*x.qty;

      sum+=t;

      return `
        <p>
          ${p.name} × ${x.qty} = ₹${t}

          <button onclick="removeItem(${x.id})">
            −
          </button>
        </p>
      `;

    }).join("") || "<p>Cart খালি</p>";

  let d=sum>=500?0:30;

  document.getElementById("total").innerHTML=
    `<p>Subtotal ₹${sum}</p>
     <p>Delivery ${d?"₹"+d:"FREE"}</p>
     <h3>Total ₹${sum+d}</h3>`;
}

function removeItem(id){

  let x=cart.find(a=>a.id===id);

  if(!x)return;

  x.qty--;

  if(x.qty<=0){
    cart=cart.filter(a=>a.id!==id);
  }

  save();
  render();
  cartOpen();
}

function cartClose(){
  document.getElementById("modal").style.display="none";
}

async function checkout(){

  if(!cart.length)
    return alert("Cart খালি");

  let name=prompt("Customer Name?");
  let mobile=prompt("Mobile Number?");
  let address=prompt("Delivery Address?");

  if(!name||!mobile||!address)return;

  let total=
    cart.reduce(
      (s,x)=>
        s+products.find(p=>p.id===x.id).price*x.qty,
      0
    );

  let o=await(
    await fetch("/api/orders",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        name,
        mobile,
        address,
        total:total+(total>=500?0:30),
        items:cart
      })
    })
  ).json();

  alert("Order #"+o.no+" placed");

  cart=[];

  save();
  render();
  cartClose();
}

load();

