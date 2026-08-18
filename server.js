const express=require("express"), path=require("path"), fs=require("fs");
const app=express(), PORT=3000, dataDir=path.join(__dirname,"data");
fs.mkdirSync(dataDir,{recursive:true});
const productsFile=path.join(dataDir,"products.json"), ordersFile=path.join(dataDir,"orders.json");
const seed=[
{id:1,name:"সোনা মসুরি চাল",cat:"চাল ও আটা",unit:"5 kg",mrp:360,price:320,stock:12},
{id:2,name:"মসুর ডাল",cat:"ডাল",unit:"1 kg",mrp:130,price:115,stock:18},
{id:3,name:"Fortune Soyabean Oil",cat:"তেল",unit:"1 L",mrp:180,price:165,stock:8},
{id:4,name:"আয়োডিন লবণ",cat:"মশলা ও লবণ",unit:"1 kg",mrp:32,price:28,stock:30},
{id:5,name:"হলুদ গুঁড়ো",cat:"মশলা ও লবণ",unit:"200 g",mrp:55,price:48,stock:15},
{id:6,name:"চিনি",cat:"চাল ও আটা",unit:"1 kg",mrp:55,price:50,stock:25},
{id:7,name:"Marie Biscuit",cat:"বিস্কুট",unit:"250 g",mrp:45,price:40,stock:20},
{id:8,name:"চা",cat:"পানীয়",unit:"250 g",mrp:145,price:125,stock:10}
];
if(!fs.existsSync(productsFile))fs.writeFileSync(productsFile,JSON.stringify(seed,null,2));
if(!fs.existsSync(ordersFile))fs.writeFileSync(ordersFile,"[]");
const read=f=>JSON.parse(fs.readFileSync(f)); const write=(f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,2));
app.use(express.json()); app.use(express.static(path.join(__dirname,"public")));
app.get("/api/products",(req,res)=>res.json(read(productsFile)));
app.post("/api/products",(req,res)=>{let a=read(productsFile);let id=a.length?Math.max(...a.map(x=>x.id))+1:1;let p={id,...req.body};a.push(p);write(productsFile,a);res.json(p)});
app.delete("/api/products/:id",(req,res)=>{let a=read(productsFile).filter(x=>x.id!=req.params.id);write(productsFile,a);res.sendStatus(204)});
app.put("/api/products/:id",(req,res)=>{let a=read(productsFile),i=a.findIndex(x=>x.id==req.params.id);if(i<0)return res.sendStatus(404);a[i]={...a[i],...req.body,id:a[i].id};write(productsFile,a);res.json(a[i])});
app.get("/api/orders",(req,res)=>res.json(read(ordersFile)));
app.post("/api/orders",(req,res)=>{let a=read(ordersFile),o={...req.body,no:"MS"+Date.now().toString().slice(-6),date:new Date().toLocaleString("en-IN"),status:"Order Placed"};a.unshift(o);write(ordersFile,a);res.json(o)});
app.put("/api/orders/:no",(req,res)=>{let a=read(ordersFile),o=a.find(x=>x.no===req.params.no);if(!o)return res.sendStatus(404);o.status=req.body.status;write(ordersFile,a);res.json(o)});
app.listen(PORT,()=>console.log(`Mahaprabhu Stores running at http://localhost:${PORT}`));