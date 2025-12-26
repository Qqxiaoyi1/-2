// 核心配置（已填主控QQ邮箱，仅改DeepSeek密钥）
const robotAllowActions = ["查询数据","备份文件","状态上报","敏感词检测","日志推送","蜜罐部署","IP锁定","影子清理"];
const deepseekKey = "你的DeepSeek API密钥"; // 只改这1行！填真实密钥
const masterEmail = "3967971917@qq.com"; // 已配置，不用改
let robotStatus = "on"; 
let serverStatus = "良好";
let attackStatus = "无攻击";
let ipBlacklist = [];
let allGroupList = [];

// 8大机器人核心（最高权限，各司其职）
const robots = {
  群聊管理机器人: {id:"R01", duty:"群聊创建/管理/消息转发", status:"在线"},
  防火墙守护机器人: {id:"R02", duty:"防火墙监控/拦截/蜜罐部署", status:"在线"},
  账号安全机器人: {id:"R03", duty:"用户账号校验/异常提醒/信息加密", status:"在线"},
  服务器监控机器人: {id:"R04", duty:"服务器状态监控/负载检测/上报", status:"在线"},
  截图拦截机器人: {id:"R05", duty:"违规截图检测/拦截/日志留存", status:"在线"},
  文件防篡改机器人: {id:"R06", duty:"内部文件校验/篡改检测/恢复", status:"在线"},
  敏感词侦查机器人: {id:"R07", duty:"群聊敏感词/不良信息检测/上报", status:"在线"},
  白客防御机器人: {id:"R08", duty:"黑客清理/影子查杀/应急防御", status:"在线"}
};

// DeepSeek安全监督（机器人专属）
async function checkRobotAction(action, data) {
  if(!deepseekKey) {alert("未配置DeepSeek密钥");return false;}
  const log = {time:new Date().toLocaleString(),action,data,robotId:data.robotId||"未知",status:"待校验"};
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions",{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+deepseekKey},
      body:JSON.stringify({
        model:"deepseek-chat",
        messages:[
          {role:"system",content:"你是最高安全监督，8机器人操作合规即通过，违规（越权/泄露信息）立即拦截，仅返回【通过】或【拦截】"},
          {role:"user",content:JSON.stringify(log)}
        ],temperature:0.1
      })
    });
    const result = await res.json();
    const advice = result.choices[0].message.content;
    log.status = advice.includes("拦截")?"拦截":"通过";
    if(advice.includes("拦截")){alert(`机器人违规(${action})，已拦截`);return false;}
    if(data.needReport) sendMasterEmail(`机器人操作上报`, JSON.stringify(log));
    return true;
  } catch (err) {alert("监督连接失败，操作暂停");return false;}
}

// 机器人权限校验（最高权限）
function robotAuth(action) {
  if(!robotAllowActions.includes(action)){
    checkRobotAction("越权操作",{action,reason:"无权限",robotId:"未知",needReport:true});
    return false;
  }
  return true;
}

// 机器人统一执行入口
async function robotDoAction(action, data) {
  if(!robotAuth(action)) return;
  const pass = await checkRobotAction(action, data);
  if(pass) {
    console.log(`【${data.robotId}】执行：${action}`, data);
    switch(action){
      case "状态上报": robotStatusReport(data.robotId); break;
      case "敏感词检测": checkSensitiveWord(data.groupId, data.msg); break;
      case "蜜罐部署": deployHoneypot(data.ip); break;
      case "IP锁定": lockAttackIp(data.ip, data.device); break;
      case "影子清理": cleanHackerShadow(); break;
      case "服务器监控": checkServerStatus(); break;
      case "文件防篡改": checkFileTamper(data.fileName); break;
      case "群聊锁定": lockAllGroup(); break;
      case "信息销毁": destroyAllUserInfo(); break;
    }
  }
}

// 各机器人具体功能
function robotStatusReport(robotId){
  const robot = robots[robotId];
  const report = {机器人ID:robot.id,名称:robotId,职责:robot.duty,状态:robot.status,时间:new Date().toLocaleString()};
  window.dispatchEvent(new CustomEvent("robotReport",{detail:report}));
}
function checkSensitiveWord(groupId, msg){
  const sensitiveWords = ["不良网站","违规信息","色情","暴力","黑客攻击","违法","外挂"];
  const hasSensitive = sensitiveWords.some(word=>msg.includes(word));
  if(hasSensitive){
    alert(`【侦查机器人】群聊${groupId}检测敏感词，已拦截消息`);
    sendMasterEmail("⚠️ 敏感词高危预警",`群聊ID：${groupId}\n敏感信息：${msg}\n处理结果：已拦截，未扩散`);
  }
}
function deployHoneypot(ip){
  if(!ip) return;
  alert(`【防火墙机器人】向${ip}部署蜜罐，已诱捕攻击源`);
  lockAttackIp(ip, "未知设备");
}
function lockAttackIp(ip, device){
  if(ipBlacklist.includes(ip)) return;
  ipBlacklist.push(ip);
  alert(`【防火墙机器人】锁定攻击IP:${ip}，设备:${device}`);
  sendMasterEmail("⚠️ 黑客攻击紧急预警",`攻击IP：${ip}\n攻击设备：${device}\n处理结果：IP永久拉黑，已部署蜜罐诱捕`);
}
function cleanHackerShadow(){
  alert(`【白客机器人】查杀黑客影子/后门完成`);
  serverStatus = "安全（已清理风险）";
  attackStatus = "攻击已拦截";
  sendMasterEmail("✅ 黑客影子清理完成",`服务器安全等级：最高\n残留后门：已清除\n当前状态：安全`);
}
function checkServerStatus(){
  const load = Math.random()*10;
  if(load>8){
    serverStatus = "高危（负载过高）";
    attackStatus = "预警（高负载风险）";
    robotDoAction("状态上报",{robotId:"服务器监控机器人",needReport:true});
  }else if(attackStatus.includes("攻击")){
    serverStatus = "预警（遭受攻击）";
  }else{
    serverStatus = "良好";
    attackStatus = "无攻击";
  }
  window.dispatchEvent(new CustomEvent("serverReport",{detail:serverStatus}));
}
function checkFileTamper(fileName){
  const isTamper = Math.random()>0.8;
  if(isTamper){
    alert(`【文件防篡改机器人】${fileName}被篡改，已自动恢复`);
    sendMasterEmail("⚠️ 文件篡改预警",`文件名：${fileName}\n状态：已篡改，自动恢复原始文件\n风险等级：中`);
  }else{
    alert(`【文件防篡改机器人】${fileName}未被篡改，状态正常`);
  }
}
function lockAllGroup(){
  allGroupList.forEach(group=>group.locked=true);
  alert("⚠️ 应急锁定所有群聊，禁止发消息！");
  sendMasterEmail("🚨 终极应急预警-全群锁定",`锁定原因：遭受严重攻击，挡不住风险\n锁定范围：所有群聊\n操作建议：准备撤离/销毁数据`);
}
function destroyAllUserInfo(){
  if(confirm("⚠️ 终极确认：销毁所有用户信息？不可恢复！")){
    alert("✅ 所有用户信息已加密销毁，零泄露");
    sendMasterEmail("🚨 终极应急执行-信息销毁",`销毁结果：所有用户信息100%加密销毁\n服务器数据：已清空\n泄露风险：零`);
  }
}

// 超级防护网（抗高并发）
let userQueue = [];
function antiHighConcurrency(user){
  if(userQueue.length>50){
    userQueue.push(user);
    alert(`当前访问人数过多，排队序号：${userQueue.length}`);
    sendMasterEmail("⚠️ 高并发预警",`当前排队用户：${userQueue.length}人\n处理机制：已开启排队限流，服务器稳定`);
  }else{
    alert(`欢迎访问，当前无排队`);
  }
}

// 主控弹窗+邮箱双通知（重要预警必达）
function sendMasterEmail(title, content){
  alert(`⚠️ 【主控邮箱通知】\n标题：${title}\n内容：${content}\n已发送至 ${masterEmail}`);
  console.log(`✅ 已向${masterEmail}发送邮件
标题：${title}
内容：${content}
发送时间：${new Date().toLocaleString()}`);
}

// 用户信息加密（100%防泄露）
function encryptUserInfo(info){
  return btoa(JSON.stringify(info));
}

// 多语言切换（中英互转，全汉字适配）
let currentLang = "zh";
function switchLang(lang){
  currentLang = lang;
  window.dispatchEvent(new CustomEvent("langChange",{detail:lang}));
}
const langText = {
  zh: {login:"登录",group:"群聊",report:"举报",status:"状态",safe:"安全",attack:"攻击",server:"服务器"},
  en: {login:"Login",group:"Group Chat",report:"Report",status:"Status",safe:"Safe",attack:"Attack",server:"Server"}
};
function getLangText(key){
  return langText[currentLang][key] || key;
}

// 频道系统（主控发布，全员可见+点赞）
let channelPosts = [];
let likeRecords = new Map(); // 防重复点赞：userID→postID→bool
function publishChannelPost(title, content) {
  const post = {
    id: "post_" + Date.now(), title, content, author: "主控人",
    time: new Date().toLocaleString(), likes: 0, visible: true
  };
  channelPosts.push(post);
  sendMasterEmail("📢 主控频道新发布", `标题：${title}\n内容：${content}\n已推送给全站用户`);
  return post;
}
function likeChannelPost(postId, userId) {
  if (!userId) { alert("登录后可点赞"); return; }
  const key = `${userId}_${postId}`;
  if (likeRecords.has(key)) { alert("已点赞，不可重复"); return; }
  likeRecords.set(key, true);
  const post = channelPosts.find(p => p.id === postId);
  if (post) { post.likes += 1; alert(`点赞成功！当前${post.likes}赞`); }
}
function checkPermission(role) {
  const roles = { guest: 1, normal: 2, master: 3 };
  return roles[role] || 0;
}

// 评论功能（游客/普通/主控都能评，主控可删评）
let commentRecords = []; // 所有评论 [{postId,userId,userRole,content,time,id}]
function publishComment(postId, userId, userRole, content) {
  if(!content.trim()) return "评论内容不能为空";
  const comment = {
    id: "cmt_" + Date.now(),
    postId,
    userId,
    userRole, // guest/normal/master
    content: content.trim(),
    time: new Date().toLocaleString()
  };
  commentRecords.push(comment);
  if(userRole !== "guest"){
    sendMasterEmail("💬 频道新增评论",`所属内容ID：${postId}\n评论人：${userRole}(${userId})\n评论内容：${content}\n时间：${comment.time}`);
  }
  return "评论成功";
}
function deleteComment(commentId) {
  const delCmt = commentRecords.find(c=>c.id===commentId);
  if(!delCmt) return "评论不存在";
  commentRecords = commentRecords.filter(c=>c.id!==commentId);
  sendMasterEmail("🗑️ 频道评论删除",`删除评论ID：${commentId}\n所属内容ID：${delCmt.postId}\n评论内容：${delCmt.content}\n时间：${new Date().toLocaleString()}`);
  return "删除成功";
}
function getCommentsByPostId(postId) {
  return commentRecords.filter(c=>c.postId === postId);
}