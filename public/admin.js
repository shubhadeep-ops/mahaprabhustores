async function api(u,o){let r=await fetch(u,o);return r.status===204?null:r.json()}

async function load(){
  let p=await api("/api/products"),o=await api("/api/orders");
  let sales=o.reduce((s,x)=>s+x.total,0);

  document.getElementById("stats").innerHTML=
    `<div>Orders <b>${o.length}</b></div>
     <div>Pending <b>${o.filter(x=>x.status==="Order Placed").length}</b></div>
     <div>Sales <b>₹${sales}</b></div>`;

  document.getElementById("products").innerHTML=p.map(x=>`
    <div class="row">
      ${x.image?`<img src="${x.image}" style="width:60px;height:60px;object-fit:contain;border-radius:8px">`:""}
      <b>${x.name}</b>
      <input value="${x.cat}" id="c${x.id}">
      <input value="${x.unit}" id="u${x.id}">
      <input value="${x.mrp}" id="m${x.id}" type="number">
      <input value="${x.price}" id="p${x.id}" type="number">
      <input value="${x.stock}" id="s${x.id}" type="number">
      <button onclick="edit(${x.id})">Save</button>
      <button class="danger" onclick="del(${x.id})">Delete</button>
    </div>
  `).join("");

  document.getElementById("orders").innerHTML=o.length?
    o.map(x=>`
      <div class="row">
        <b>#${x.no}</b> ${x.name} · ${x.mobile} · ₹${x.total}
        <select onchange="status('${x.no}',this.value)">
          ${["Order Placed","Confirmed","Out for Delivery","Delivered","Cancelled"]
          .map(s=>`<option ${s===x.status?"selected":""}>${s}</option>`).join("")}
        </select>
        <button onclick="bill('${x.no}')">🧾 Bill</button>
      </div>
    `).join("")
    :"No orders yet.";
}

function previewImage(event){
  const file=event.target.files[0];
  if(!file)return;

  const preview=document.getElementById("imagePreview");
  preview.src=URL.createObjectURL(file);
  preview.style.display="block";
}

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

  await api("/api/products",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      name,
      cat:newCat.value||"Other",
      unit:newUnit.value||"1 pcs",
      mrp:+newMrp.value||0,
      price:+newPrice.value||0,
      stock:+newStock.value||0,
      image
    })
  });

  document.querySelectorAll(".formgrid input").forEach(x=>x.value="");

  document.getElementById("newImage").value="";
  document.getElementById("imagePreview").style.display="none";
  document.getElementById("imagePreview").src="";

  alert("Product added");
  load();
}

async function edit(id){

  await api("/api/products/"+id,{
    method:"PUT",
    headers:{"Content-Type":"application/json"},
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

async function del(id){
  if(!confirm("এই product delete করবেন?"))return;
  await api("/api/products/"+id,{method:"DELETE"});
  load();
}

async function status(no,status){
  await api("/api/orders/"+no,{
    method:"PUT",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({status})
  });
  load();
}

function bill(no){
  location.href="/bill.html?no="+encodeURIComponent(no);
}
