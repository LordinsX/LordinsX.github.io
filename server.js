const express=require('express'),http=require('http'),{Server}=require('socket.io');
const path=require('path'),fs=require('fs'),{v4:uuidv4}=require('uuid'),QRCode=require('qrcode');
const app=express(),server=http.createServer(app),io=new Server(server,{cors:{origin:'*'}});
const PORT=process.env.PORT||3000,DB_PATH=path.join(__dirname,'data','db.json');

let CONFIG={};
try{const r=fs.readFileSync(path.join(__dirname,'public','config.js'),'utf8');const m=r.match(/const CONFIG=({[\s\S]*});/);if(m)CONFIG=eval(`(${m[1]})`);}catch(e){}
const ADMIN_PASS=process.env.ADMIN_PASS||CONFIG.adminPass||'admin123';
const WP_LIFE=(CONFIG.game?.waypointLifetimeMin||10)*60000;

let db={squads:{},players:{},pois:{},waypoints:{},vectors:{},game:{status:'waiting',timer:null,scores:{red:0,blue:0},broadcasts:[],captures:[]},events:[]};
function loadDB(){try{if(fs.existsSync(DB_PATH))db=JSON.parse(fs.readFileSync(DB_PATH,'utf8'));}catch(e){}
['squads','players','pois','waypoints','vectors','events'].forEach(k=>{if(!db[k])db[k]={};});
if(!db.game)db.game={status:'waiting',timer:null,scores:{red:0,blue:0},broadcasts:[],captures:[]};
if(Array.isArray(db.players))db.players={};if(!Array.isArray(db.events))db.events=[];saveDB();}
function saveDB(){fs.writeFileSync(DB_PATH,JSON.stringify(db,null,2));}
loadDB();

app.use(express.static(path.join(__dirname,'public'),{setHeaders:(r,f)=>{if(f.endsWith('manifest.json'))r.setHeader('Content-Type','application/manifest+json');}}));
app.use(express.json());
app.post('/api/auth',(req,res)=>{req.body.password===ADMIN_PASS?res.json({success:true}):res.status(401).json({error:'Bad pass'});});
app.get('/api/qr',async(req,res)=>{try{res.json({dataUrl:await QRCode.toDataURL(req.query.url,{width:300})});}catch(e){res.status(500).json({error:e.message});}});

io.on('connection',s=>{
  s.emit('init',db);
  s.on('player:join',p=>{db.players[p.id]={...p,socketId:s.id,status:'online',updatedAt:Date.now()};saveDB();io.emit('players:update',db.players);addEvent('PLAYER_JOIN',{player:p.name,team:p.team});});
  s.on('player:update',d=>{if(!db.players[d.id])return;const prev=db.players[d.id];const dt=(Date.now()-prev.updatedAt)/1000;const vel=(dt>0&&dt<30&&prev.lat)?{dLat:(d.lat-prev.lat)/dt,dLng:(d.lng-prev.lng)/dt}:null;db.players[d.id]={...db.players[d.id],...d,velocity:vel,updatedAt:Date.now()};saveDB();io.emit('players:update',db.players);});
  s.on('player:leave',id=>{delete db.players[id];saveDB();io.emit('players:update',db.players);});
  
  s.on('player:sos',d=>{if(db.players[d.id]){db.players[d.id].status='sos';saveDB();io.emit('players:update',db.players);addEvent('SOS',{player:d.name,team:d.team});io.emit('notification',{type:'sos',title:'🆘 SOS',text:`${d.name}: ТРЕВОГА`});}});
  s.on('player:unsos',id=>{if(db.players[id]){db.players[id].status='online';db.players[id].updatedAt=Date.now();saveDB();io.emit('players:update',db.players);addEvent('SOS_CANCELLED',{player:db.players[id].name,team:db.players[id].team});io.emit('notification',{type:'',title:'✅ SOS СНЯТ',text:`${db.players[id].name}: тревога отменена`});}});
  s.on('player:kick',id=>{delete db.players[id];saveDB();io.emit('players:update',db.players);});

  s.on('squad:create',d=>{const id=uuidv4().slice(0,8).toUpperCase();db.squads[id]={...d,id,createdAt:Date.now()};saveDB();io.emit('squads:update',db.squads);s.emit('squad:created',{id});addEvent('SQUAD_CREATED',{squad:id,name:d.name});});
  s.on('squad:delete',id=>{delete db.squads[id];saveDB();io.emit('squads:update',db.squads);});
  s.on('poi:create',d=>{const id=uuidv4();db.pois[id]={...d,id,createdAt:Date.now()};saveDB();io.emit('pois:update',db.pois);addEvent('POI_CREATED',{name:d.name,type:d.type});});
  s.on('poi:delete',id=>{delete db.pois[id];saveDB();io.emit('pois:update',db.pois);});
  s.on('zone:capture',d=>{if(db.pois[d.pointId]){db.pois[d.pointId].capturedBy=d.team;db.game.scores[d.team]=(db.game.scores[d.team]||0)+1;saveDB();io.emit('pois:update',db.pois);io.emit('scores:update',db.game.scores);io.emit('notification',{type:'capture',title:'🚩 ЗАХВАТ',text:`${d.player} захватил ${d.pointName}`});addEvent('ZONE_CAPTURED',{point:d.pointName,team:d.team,player:d.player});}});
  s.on('zone:reset',id=>{if(db.pois[id]){delete db.pois[id].capturedBy;saveDB();io.emit('pois:update',db.pois);}});
  
  s.on('waypoint:create',d=>{const id=uuidv4();db.waypoints[id]={...d,name:(d.name||'').slice(0,30),id,createdAt:Date.now(),expiresAt:Date.now()+WP_LIFE};saveDB();io.emit('waypoints:update',db.waypoints);});
  s.on('waypoint:delete',id=>{delete db.waypoints[id];saveDB();io.emit('waypoints:update',db.waypoints);});

  // === ATTACK VECTORS ===
  s.on('vector:create',d=>{const id=uuidv4();db.vectors[id]={...d,id,createdAt:Date.now(),expiresAt:Date.now()+15*60000};saveDB();io.emit('vectors:update',db.vectors);addEvent('VECTOR_CREATED',{squad:d.squad,type:d.type,by:d.createdBy});});
  s.on('vector:delete',id=>{delete db.vectors[id];saveDB();io.emit('vectors:update',db.vectors);});
  s.on('vector:clearSquad',sq=>{for(const[id,v]of Object.entries(db.vectors)){if(v.squad===sq)delete db.vectors[id];}saveDB();io.emit('vectors:update',db.vectors);});

  s.on('game:start',m=>{db.game.status='running';db.game.timer={mode:'countdown',endTime:Date.now()+m*60000};saveDB();io.emit('game:update',db.game);addEvent('GAME_START',{duration:m});});
  s.on('game:stop',()=>{db.game.status='ended';db.game.timer=null;saveDB();io.emit('game:update',db.game);});
  s.on('game:resetScores',()=>{db.game.scores={red:0,blue:0};saveDB();io.emit('scores:update',db.game.scores);});
  s.on('broadcast:send',d=>{db.game.broadcasts.push({...d,time:Date.now()});saveDB();io.emit('broadcast',d);addEvent('BROADCAST',{target:d.target});});
  s.on('reset:players',()=>{db.players={};saveDB();io.emit('players:update',db.players);});
  s.on('reset:all',()=>{db={squads:{},players:{},pois:{},waypoints:{},vectors:{},game:{status:'waiting',timer:null,scores:{red:0,blue:0},broadcasts:[],captures:[]},events:[]};saveDB();io.emit('init',db);});
  s.on('disconnect',()=>{for(const[id,p]of Object.entries(db.players)){if(p.socketId===s.id){delete db.players[id];saveDB();io.emit('players:update',db.players);break;}}});
});
function addEvent(type,data){db.events.push({type,...data,time:Date.now()});if(db.events.length>500)db.events=db.events.slice(-500);saveDB();io.emit('events:update',db.events);}
server.listen(PORT,()=>console.log(`🛡️ SQUADRON v7.0 on http://localhost:${PORT}`));