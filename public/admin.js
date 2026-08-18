async function api(u,o){
  let r=await fetch(u,o);
  return r.status===204?null:r.json();
}


/* =========================
   LOAD ADMIN DATA
========================= */

async function load(){

  let p=await api("/api/products");
  let o=await api("/api/orders");

  let sales=o.reduce((s,x)=>s+x.total,0);

  document.getElementById("stats").innerHTML=
    `<div>Orders <b>${o.length}</b></div>
     <div>Pending <b>${o.filter(x=>x.status==="Order Placed").length}</b></div>
     <div>Sales <b>₹${sales}</b></div>`;


  document.getElementById("products").innerHTML=p.map(x=>`

    <div class="row">

      ${x.image
        ? `<img src="${x.image}"
             style="width:60px;height:60px;object-fit:contain;border-radius:8px">`
        : ""
      }

      <b>${x.name}</b>

      <input value="${x.cat}" id="c${x.id}">

      <input value="${x.unit}" id="u${x.id}">

      <input value="${x.mrp}" id="m${x.id}" type="number">

      <input value="${x.price}" id="p${x.id}" type="number">

      <input value="${x.stock}" id="s${x.id}" type="number">

      <button onclick="edit(${x.id})">
        Save
      </button>

      <button class="danger" onclick="del(${x.id})">
        Delete
      </button>

    </div>

  `).join("");


  document.getElementById("orders").innerHTML=o.length?

    o.map(x=>`

      <div class="row">

        <b>#${x.no}</b>

        ${x.name} · ${x.mobile} · ₹${x.total}

        <select onchange="status('${x.no}',this.value)">

          ${[
            "Order Placed",
            "Confirmed",
            "Out for Delivery",
            "Delivered",
            "Cancelled"
          ]
          .map(s=>`
            <option ${s===x.status?"selected":""}>
              ${s}
            </option>
          `).join("")}

        </select>

        <button onclick="bill('${x.no}')">
          🧾 Bill
        </button>

      </div>

    `).join("")

    :"No orders yet.";
}


/* =========================
   IMAGE PREVIEW
========================= */

function previewImage(event){

  const file=event.target.files[0];

  if(!file)return;

  const preview=document.getElementById("imagePreview");

  preview.src=URL.createObjectURL(file);

  preview.style.display="block";
}


/* =========================
   WEIGHT OPTIONS
========================= */

function addWeightOption(value="",price=""){

  const box=document.getElementById("weightOptions");

  const row=document.createElement("div");

  row.className="optionRow";

  row.innerHTML=`

    <input
      class="weightName"
      placeholder="Weight (e.g. 500 g)"
      value="${value}"
    >

    <input
      class="weightPrice"
      type="number"
      placeholder="Price ₹"
      value="${price}"
    >

    <button
      type="button"
      class="danger"
      onclick="this.parentElement.remove()"
    >
      ×
    </button>

  `;

  box.appendChild(row);
}


/* =========================
   COLOUR OPTIONS
========================= */

function addColourOption(value=""){

  const box=document.getElementById("colourOptions");

  const row=document.createElement("div");

  row.className="optionRow";

  row.innerHTML=`

    <input
      class="colourName"
      placeholder="Colour (e.g. Brown)"
      value="${value}"
    >

    <button
      type="button"
      class="danger"
      onclick="this.parentElement.remove()"
    >
      ×
    </button>

  `;

  box.appendChild(row);
}


/* =========================
   GET WEIGHT OPTIONS
========================= */

function getWeightOptions(){

  return [...document.querySelectorAll(".optionRow")]
    .map(row=>{

      const name=row.querySelector(".weightName");

      const price=row.querySelector(".weightPrice");

      if(!name || !price)return null;

      const weight=name.value.trim();

      const amount=Number(price.value);

      if(!weight || !amount)return null;

      return {
        weight,
        price:amount
      };

    })
    .filter(Boolean);
}


/* =========================
   GET COLOUR OPTIONS
========================= */

function getColourOptions(){

  return [...document.querySelectorAll(".colourName")]
    .map(x=>x.value.trim())
    .filter(Boolean);
}


/* =========================
   ADD PRODUCT
========================= */

async function addProduct(){

  let name=newName.value.trim();

  if(!name)
    return alert("Product name দিন");


  let image="";

  const file=document.getElementById("newImage").files[0];


  if(file){

    if(file.size>2*1024*1024)
      return alert("Image size 2 MB-এর মধ্যে রাখুন");


    image=await new Promise((resolve,reject)=>{

      const reader=new FileReader();

      reader.onload=()=>resolve(reader.result);

      reader.onerror=reject;

      reader.readAsDataURL(file);

    });

  }


  const weights=getWeightOptions();

  const colours=getColourOptions();


  await api("/api/products",{

    method:"POST",

    headers:{
      "Content-Type":"application/json"
    },

    body:JSON.stringify({

      name,

      cat:newCat.value||"Other",

      unit:newUnit.value||"1 pcs",

      mrp:+newMrp.value||0,

      price:+newPrice.value||0,

      stock:+newStock.value||0,

      image,

      options:{
        weights,
        colours
      }

    })

  });


  document.querySelectorAll(".formgrid input")
    .forEach(x=>x.value="");


  document.getElementById("newImage").value="";

  document.getElementById("imagePreview").style.display="none";

  document.getElementById("imagePreview").src="";


  document.getElementById("weightOptions").innerHTML="";

  document.getElementById("colourOptions").innerHTML="";


  alert("✅ Product added");

  load();
}


/* =========================
   EDIT PRODUCT
========================= */

async function edit(id){

  await api("/api/products/"+id,{

    method:"PUT",

    headers:{
      "Content-Type":"application/json"
    },

    body:JSON.stringify({

      cat:document.getElementById("c"+id).value,

      unit:document.getElementById("u"+id).value,

      mrp:+document.getElementById("m"+id).value,

      price:+document.getElementById("p"+id).value,

      stock:+document.getElementById("s"+id).value

    })

  });


  alert("Product updated");

  load();
}


/* =========================
   DELETE PRODUCT
========================= */

async function del(id){

  if(!confirm("এই product delete করবেন?"))
    return;

  await api("/api/products/"+id,{
    method:"DELETE"
  });

  load();
}


/* =========================
   ORDER STATUS
========================= */

async function status(no,status){

  await api("/api/orders/"+no,{

    method:"PUT",

    headers:{
      "Content-Type":"application/json"
    },

    body:JSON.stringify({
      status
    })

  });

  load();
}


/* =========================
   BILL
========================= */

function bill(no){

  location.href="/bill.html?no="+encodeURIComponent(no);

}


/* =========================
   NOTIFICATIONS
========================= */

async function enableNotifications(){

  if(!("Notification" in window)){

    return alert(
      "এই browser notification support করে না।"
    );

  }


  const permission=
    await Notification.requestPermission();


  if(permission!=="granted"){

    return alert(
      "Notification permission Allow করতে হবে।"
    );

  }


  alert(
    "🔔 Notification permission দেওয়া হয়েছে।"
  );


  new Notification("Mahaprabhu Stores",{

    body:
      "Order notification এখন এই ফোনে চালু হয়েছে."

  });

}


/* =========================
   START
========================= */

load();
