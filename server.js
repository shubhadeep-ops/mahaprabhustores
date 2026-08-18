const express=require("express"), path=require("path"), fs=require("fs"), crypto=require("crypto");
const admin=require("firebase-admin");

const app=express(), PORT=process.env.PORT||3000, dataDir=path.join(__dirname,"data");

const serviceAccount=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential:admin.credential.cert(serviceAccount)
});

const messaging=admin.messaging();

const ADMIN_USERNAME=process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD;
const SESSION_SECRET=process.env.SESSION_SECRET;

if(!ADMIN_USERNAME || !ADMIN_PASSWORD || !SESSION_SECRET){
  console.error("Missing ADMIN_USERNAME, ADMIN_PASSWORD, or SESSION_SECRET environment variables.");
  process.exit(1);
}

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
const read=f=>JSON.parse(fs.readFileSync(f));
const write=(f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,2));

app.set("trust proxy",1);
app.use(express.json());
app.use(express.urlencoded({extended:false}));

const sessions=new Map();
function parseCookies(req){
  const out={};
  (req.headers.cookie||"").split(";").forEach(part=>{const i=part.indexOf("=");if(i>0)out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim())});
  return out;
}
function getSession(req){
  const token=parseCookies(req).admin_session;
  if(!token)return null;
  const item=sessions.get(token);
  if(!item || item.expires<Date.now()){sessions.delete(token);return null;}
  return {token,...item};
}
function setSession(res){
  const token=crypto.randomBytes(32).toString("hex");
  const expires=Date.now()+1000*60*60*8;
  sessions.set(token,{expires});
  res.cookie("admin_session",token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:1000*60*60*8});
}
const requireAdmin=(req,res,next)=>{
  if(getSession(req))return next();
  if(req.path.startsWith("/api/"))return res.status(401).json({error:"Admin login required"});
  return res.redirect("/admin-login");
};

// Public login/logout endpoints.
app.get("/admin-login",(req,res)=>{
  if(getSession(req))return res.redirect("/manage-7f3k9");
  res.sendFile(path.join(__dirname,"public","login.html"));
});
app.post("/admin-login",(req,res)=>{
  const {username,password}=req.body;
  if(username===ADMIN_USERNAME && password===ADMIN_PASSWORD){
    setSession(res);
    return res.redirect("/manage-7f3k9");
  }
  return res.redirect("/admin-login?error=1");
});
app.post("/admin-logout",requireAdmin,(req,res)=>{
  const current=getSession(req); if(current)sessions.delete(current.token); res.clearCookie("admin_session"); res.redirect("/admin-login");
});

// Protect old/direct admin files too, while the actual admin URL stays separate.
app.get(["/admin.html","/admin.js","/manage-7f3k9"],requireAdmin,(req,res)=>{
  if(req.path==="/admin.js")return res.sendFile(path.join(__dirname,"public","admin.js"));
  return res.sendFile(path.join(__dirname,"public","admin.html"));
});

app.get("/api/products",(req,res)=>res.json(read(productsFile)));
app.post("/api/products",requireAdmin,(req,res)=>{let a=read(productsFile);let id=a.length?Math.max(...a.map(x=>x.id))+1:1;let p={id,...req.body};a.push(p);write(productsFile,a);res.json(p)});
app.delete("/api/products/:id",requireAdmin,(req,res)=>{let a=read(productsFile).filter(x=>x.id!=req.params.id);write(productsFile,a);res.sendStatus(204)});
app.put("/api/products/:id",requireAdmin,(req,res)=>{let a=read(productsFile),i=a.findIndex(x=>x.id==req.params.id);if(i<0)return res.sendStatus(404);a[i]={...a[i],...req.body,id:a[i].id};write(productsFile,a);res.json(a[i])});

app.get("/api/orders",requireAdmin,(req,res)=>res.json(read(ordersFile)));
app.post("/api/orders",(req,res)=>{let a=read(ordersFile),o={...req.body,no:"MS"+Date.now().toString().slice(-6),date:new Date().toLocaleString("en-IN"),status:"Order Placed"};a.unshift(o);write(ordersFile,a);res.json(o)});
app.put("/api/orders/:no",requireAdmin,(req,res)=>{let a=read(ordersFile),o=a.find(x=>x.no===req.params.no);if(!o)return res.sendStatus(404);o.status=req.body.status;write(ordersFile,a);res.json(o)});

app.use(express.static(path.join(__dirname,"public")));
app.listen(PORT,()=>console.log(`Mahaprabhu Stores running on port ${PORT}`));
