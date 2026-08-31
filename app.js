const KEY="my-memory-v2";
const FILE="data.json";

let data={notes:[],tasks:[]},
    msalApp,
    account=null,
    cal=new Date(),
    selected=new Date().toISOString().slice(0,10);

const $=x=>document.getElementById(x),
      iso=d=>d.toISOString().slice(0,10),
      id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);

function toast(x){
  $("toast").textContent=x;
  $("toast").style.display="block";
  setTimeout(()=>$("toast").style.display="none",1800);
}

function save(){
  localStorage.setItem(KEY,JSON.stringify(data));
}

function load(){
  try{
    data=JSON.parse(localStorage.getItem(KEY))||data;
  }catch(e){}
}

function fmt(d){
  return new Date(d+"T00:00:00").toLocaleDateString(undefined,{
    day:"numeric",
    month:"short",
    year:"numeric"
  });
}

function esc(s=""){
  return s.replace(/[&<>"']/g,m=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));
}

function tab(n){
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  $(n).classList.add("active");
}

document.querySelectorAll("nav button").forEach(b=>{
  b.onclick=()=>{
    tab(b.dataset.tab);
    render();
  };
});

$("addNote").onclick=()=>{
  let t=prompt("Note title");
  if(t===null)return;

  let b=prompt("Note text");
  if(b===null)return;

  data.notes.unshift({
    id:id(),
    title:t,
    body:b,
    date:selected,
    created:new Date().toISOString()
  });

  save();
  render();
  toast("Note saved");
  cloudSaveIfSignedIn();
};

$("addTask").onclick=()=>{
  let t=prompt("Task");
  if(t===null)return;

  let d=prompt("Due date YYYY-MM-DD",selected);
  if(d===null)return;

  data.tasks.unshift({
    id:id(),
    title:t,
    due:d,
    done:false,
    priority:"Medium",
    created:new Date().toISOString()
  });

  save();
  render();
  toast("Task saved");
  cloudSaveIfSignedIn();
};

$("noteSearch").oninput=()=>renderNotes();
$("taskFilter").onchange=()=>renderTasks();

function render(){
  renderHome();
  renderNotes();
  renderTasks();
  renderCal();
  renderSelected();
}

function renderHome(){
  let d=iso(new Date()),
      n=data.notes.filter(x=>x.date===d),
      t=data.tasks.filter(x=>x.due===d);

  $("homeItems").innerHTML=
    `<div class="card">
      <b>${new Date().toLocaleDateString(undefined,{
        weekday:"long",
        month:"long",
        day:"numeric"
      })}</b>
      <p>${n.length} notes • ${t.length} tasks</p>
    </div>`+
    (n.map(x=>
      `<div class="item">
        <h3>📝 ${esc(x.title)}</h3>
        <p>${esc(x.body)}</p>
      </div>`
    ).join("")||"")+
    (t.map(x=>taskHtml(x)).join("")||"");
}

function renderNotes(){
  let q=$("noteSearch").value.toLowerCase();

  let a=data.notes.filter(x=>
    (x.title+" "+x.body).toLowerCase().includes(q)
  );

  $("notesList").innerHTML=
    a.map(x=>
      `<div class="item">
        <h3>📝 ${esc(x.title)}</h3>
        <p>${esc(x.body)}</p>
        <small>${fmt(x.date)}</small><br>
        <button onclick="editNote('${x.id}')">Edit</button>
        <button onclick="delNote('${x.id}')">Delete</button>
      </div>`
    ).join("")||
    '<p class="muted">No notes.</p>';
}

function editNote(i){
  let x=data.notes.find(a=>a.id===i);
  if(!x)return;

  let t=prompt("Title",x.title);
  let b=prompt("Text",x.body);
  let d=prompt("Date",x.date);

  if(t!==null&&b!==null&&d!==null){
    Object.assign(x,{
      title:t,
      body:b,
      date:d
    });

    save();
    render();
    cloudSaveIfSignedIn();
  }
}

function delNote(i){
  if(confirm("Delete note?")){
    data.notes=data.notes.filter(x=>x.id!==i);
    save();
    render();
    cloudSaveIfSignedIn();
  }
}

function taskHtml(x){
  return `<div class="item ${x.done?"done":""}">
    <h3>✅ ${esc(x.title)}</h3>
    <p>Due ${fmt(x.due)} • ${esc(x.priority)}</p>
    <button onclick="toggleTask('${x.id}')">
      ${x.done?"Undo":"Complete"}
    </button>
    <button onclick="editTask('${x.id}')">Edit</button>
    <button onclick="delTask('${x.id}')">Delete</button>
  </div>`;
}

function renderTasks(){
  let f=$("taskFilter").value;

  let a=data.tasks.filter(x=>
    f==="all"||
    (f==="pending"&&!x.done)||
    (f==="done"&&x.done)||
    (f==="today"&&x.due===iso(new Date()))
  );

  $("tasksList").innerHTML=
    a.map(taskHtml).join("")||
    '<p class="muted">No tasks.</p>';
}

function toggleTask(i){
  let x=data.tasks.find(a=>a.id===i);
  if(!x)return;

  x.done=!x.done;
  save();
  render();
  cloudSaveIfSignedIn();
}

function editTask(i){
  let x=data.tasks.find(a=>a.id===i);
  if(!x)return;

  let t=prompt("Task",x.title);
  let d=prompt("Due date",x.due);

  if(t!==null&&d!==null){
    x.title=t;
    x.due=d;

    save();
    render();
    cloudSaveIfSignedIn();
  }
}

function delTask(i){
  if(confirm("Delete task?")){
    data.tasks=data.tasks.filter(x=>x.id!==i);
    save();
    render();
    cloudSaveIfSignedIn();
  }
}

$("prev").onclick=()=>{
  cal.setMonth(cal.getMonth()-1);
  renderCal();
};

$("next").onclick=()=>{
  cal.setMonth(cal.getMonth()+1);
  renderCal();
};

function renderCal(){
  let y=cal.getFullYear(),
      m=cal.getMonth();

  $("month").textContent=
    new Date(y,m,1).toLocaleDateString(undefined,{
      month:"long",
      year:"numeric"
    });

  let first=new Date(y,m,1).getDay(),
      days=new Date(y,m+1,0).getDate(),
      s="";

  for(let i=0;i<42;i++){
    let num=i-first+1,
        dt=new Date(y,m,num),
        d=iso(dt),
        n=data.notes.some(x=>x.date===d),
        t=data.tasks.some(x=>x.due===d);

    s+=`<button class="day ${
      d===iso(new Date())?"today ":""
    }${
      d===selected?"sel ":""
    }" onclick="selected='${d}';renderCal();renderSelected()">
      <b>${dt.getDate()}</b>
      <div class="dot">${n?"📝":""}${t?" ✅":""}</div>
    </button>`;
  }

  let wrap=document.createElement("div");
  wrap.className="calendar";
  wrap.innerHTML=s;

  let old=$("cal");
  old.innerHTML="";
  old.appendChild(wrap);
}

function renderSelected(){
  $("selected").textContent="Selected: "+fmt(selected);

  $("selectedItems").innerHTML=
    data.notes
      .filter(x=>x.date===selected)
      .map(x=>`<div class="item">📝 ${esc(x.title)}</div>`)
      .join("")+
    data.tasks
      .filter(x=>x.due===selected)
      .map(taskHtml)
      .join("")||
    '<p class="muted">Nothing scheduled.</p>';
}


/* =========================
   MICROSOFT ENTRA LOGIN
   ========================= */

async function signIn(){
  if(!msalApp){
    return alert(
      "Add your Microsoft client ID in config.js first."
    );
  }

  try{
    let r=await msalApp.loginPopup({
      scopes:CONFIG.scopes
    });

    account=r.account;

    msalApp.setActiveAccount(account);

    $("loginBtn").textContent="Sign out";
    $("status").textContent=account.username;

    toast("Signed in");

    await cloudLoad();

  }catch(e){
    console.error(e);
    alert("Sign in failed: "+e.message);
  }
}

async function token(){
  if(!account){
    throw new Error("Not signed in");
  }

  try{
    let r=await msalApp.acquireTokenSilent({
      scopes:CONFIG.scopes,
      account:account
    });

    return r.accessToken;

  }catch(e){
    let r=await msalApp.acquireTokenPopup({
      scopes:CONFIG.scopes
    });

    return r.accessToken;
  }
}

async function graph(path,opt={}){
  let a=await token();

  opt.headers={
    ...(opt.headers||{}),
    Authorization:"Bearer "+a
  };

  return fetch(
    "https://graph.microsoft.com/v1.0"+path,
    opt
  );
}


/* =========================
   ONEDRIVE APP FOLDER
   ========================= */

async function cloudSave(){
  if(!account)return;

  let blob=new Blob(
    [JSON.stringify(data)],
    {type:"application/json"}
  );

  let r=await graph(
    "/me/drive/special/approot:/data.json:/content",
    {
      method:"PUT",
      headers:{
        "Content-Type":"application/json"
      },
      body:blob
    }
  );

  if(!r.ok){
    throw new Error(await r.text());
  }

  toast("Saved to OneDrive");
}

async function cloudSaveIfSignedIn(){
  try{
    if(account){
      await cloudSave();
    }
  }catch(e){
    console.error("Cloud save error:",e);
  }
}

async function cloudLoad(){
  try{
    if(!account)return;

    let r=await graph(
      "/me/drive/special/approot:/data.json:/content"
    );

    if(r.ok){
      let x=await r.json();

      if(x.notes&&x.tasks){
        data=x;
        save();
        render();
        toast("Cloud data loaded");
      }

    }else if(r.status===404){

      await cloudSave();

    }else{
      throw new Error(
        "OneDrive returned HTTP "+r.status
      );
    }

  }catch(e){
    console.error("Cloud sync error:",e);
    toast("Cloud sync error");
  }
}


/* =========================
   SYNC / BACKUP / RESTORE
   ========================= */

$("sync").onclick=async()=>{
  try{
    if(!account){
      return alert("Sign in first.");
    }

    await cloudSave();
    await cloudLoad();

  }catch(e){
    alert("Sync failed: "+e.message);
  }
};

$("backup").onclick=async()=>{
  try{
    if(!account){
      return alert("Sign in first.");
    }

    await cloudSave();

  }catch(e){
    alert("Backup failed: "+e.message);
  }
};

$("restore").onclick=async()=>{
  try{
    if(!account){
      return alert("Sign in first.");
    }

    await cloudLoad();

  }catch(e){
    alert("Restore failed: "+e.message);
  }
};


/* =========================
   LOCAL JSON BACKUP
   ========================= */

$("export").onclick=()=>{
  let a=document.createElement("a");

  a.href=URL.createObjectURL(
    new Blob(
      [JSON.stringify(data,null,2)],
      {type:"application/json"}
    )
  );

  a.download="my-memory-backup.json";
  a.click();
};

$("import").onchange=e=>{
  let r=new FileReader();

  r.onload=()=>{
    try{
      data=JSON.parse(r.result);

      save();
      render();

      toast("Imported");

      cloudSaveIfSignedIn();

    }catch(x){
      alert("Invalid JSON");
    }
  };

  if(e.target.files[0]){
    r.readAsText(e.target.files[0]);
  }
};


/* =========================
   LOGIN BUTTON
   ========================= */

$("loginBtn").onclick=async()=>{
  if(account){

    try{
      await msalApp.logoutPopup();
    }catch(e){
      console.error(e);
    }

    account=null;

    $("loginBtn").textContent="Sign in";
    $("status").textContent="Local mode";

  }else{

    await signIn();

  }
};


/* =========================
   START APP
   ========================= */

async function start(){

  load();

  if(
    CONFIG.clientId &&
    !CONFIG.clientId.startsWith("PASTE")
  ){

    msalApp=new msal.PublicClientApplication({
      auth:{
        clientId:CONFIG.clientId,
        authority:CONFIG.authority,
        redirectUri:CONFIG.redirectUri
      },
      cache:{
        cacheLocation:"localStorage"
      }
    });

    let a=msalApp.getAllAccounts();

    if(a.length){

      account=a[0];

      msalApp.setActiveAccount(account);

      $("loginBtn").textContent="Sign out";
      $("status").textContent=account.username;

      await cloudLoad();
    }
  }

  render();
}

start();
