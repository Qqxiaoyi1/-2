// 8大机器人专属群（仅主控可见，职责对应）
let robotGroup = [
  { id: "R01", name: "群聊管理机器人", role: "群聊创建/管理/消息转发", status: "离线" },
  { id: "R02", name: "防火墙守护机器人", role: "蜜罐部署/IP锁定/防黑客", status: "离线" },
  { id: "R03", name: "账号安全机器人", role: "用户账号校验/信息加密防泄", status: "离线" },
  { id: "R04", name: "服务器监控机器人", role: "服务器状态/负载/攻击监控", status: "离线" },
  { id: "R05", name: "截图拦截机器人", role: "违规截图检测/拦截/留存", status: "离线" },
  { id: "R06", name: "文件防篡改机器人", role: "内部文件校验/篡改自动恢复", status: "离线" },
  { id: "R07", name: "敏感词侦查机器人", role: "群聊敏感词/不良信息检测上报", status: "离线" },
  { id: "R08", name: "白客防御机器人", role: "黑客影子查杀/应急防御清理", status: "离线" }
];
let groupChatRecords = []; // 仅主控可见记录

// 机器人发消息
function sendGroupChat(senderId, senderName, content) {
  const msg = {
    id: "msg_" + Date.now(),
    senderId,
    senderName,
    content: content.trim(),
    time: new Date().toLocaleString(),
    senderType: senderId.includes("R") ? "robot" : "master"
  };
  groupChatRecords.push(msg);
  if (msg.senderType === "robot" && (content.includes("启动") || content.includes("异常") || content.includes("警告"))) {
    sendMasterEmail("🤖 机器人群聊上报", `发送者：${senderName}\n内容：${content}\n时间：${msg.time}`);
  }
  return msg;
}

// 机器人自动应答（贴合职责，回复更贴心）
function robotAutoReply(msg) {
  if (msg.senderType !== "master") return;
  const onlineRobots = robotGroup.filter(r => r.status === "在线");
  if (onlineRobots.length === 0) {
    setTimeout(()=>{
      sendGroupChat("sys", "系统提示", "⚠️ 当前无在线机器人，请先启动机器人");
      refreshGroupChat();
    },800);
    return;
  }
  const randomRobot = online  const randomRobot = onlineRobots[Math.floor(Math.random() * onlineRobots.length)];
  let reply = "";
  if (msg.content.includes("状态")) reply = `✅ 在线机器人${onlineRobots.length}个｜我是${randomRobot.name}｜负责${randomRobot.role}｜当前运行正常`;
  else if (msg.content.includes("黑客") || msg.content.includes("攻击")) reply = `🚨 防火墙已部署蜜罐｜攻击IP自动锁定｜白客机器人待命｜服务器无异常`;
  else if (msg.content.includes("备份") || msg.content.includes("篡改")) reply = `📦 核心文件实时监控中｜篡改自动恢复｜每小时自动备份｜无风险`;
  else if (msg.content.includes("敏感词")) reply = `🔍 所有群聊侦查员到位｜不良信息秒拦截｜同步上报主控邮箱｜管控正常`;
  else if (msg.content.includes("账号")) reply = `🔐 用户信息100%加密｜无异常登录｜防泄露机制已开启`;
  else reply = `我是${randomRobot.name}｜职责：${randomRobot.role}｜随时听候主控指令`;
  
  setTimeout(() => {
    sendGroupChat(randomRobot.id, randomRobot.name, reply);
    refreshGroupChat();
  }, 1000);
}

// 刷新机器人列表（适配UI卡片）
function refreshRobotList() {
  const list = document.getElementById("robotList");
  if (!list) return;
  let html = "";
  robotGroup.forEach(robot => {
    html += `
    <div class="robot-item ${robot.status === "在线" ? "online" : "offline"}">
      <div class="robot-info">
        <span class="robot-id">${robot.id}</span>
        <span class="robot-name">${robot.name}</span>
        <span class="status">${robot.status}</span>
      </div>
      <div>
        <button class="btn-sm start" onclick="startRobot('${robot.id}')">启</button>
        <button class="btn-sm stop" onclick="stopRobot('${robot.id}')">停</button>
      </div>
    </div>`;
  });
  list.innerHTML = html;
}

// 刷新群聊（适配气泡UI）
function refreshGroupChat() {
  const content = document.getElementById("chatContent");
  if (!content) return;
  if (groupChatRecords.length === 0) {
    content.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.5);padding:50px 0;">🤖 机器人群聊就绪｜仅主控可见｜发送指令即可唤醒机器人</div>`;
    return;
  }
  let html = "";
  groupChatRecords.forEach(msg => {
    html += `
    <div class="chat-msg ${msg.senderType === "robot" ? "robot-msg" : "master-msg"}">
      <span class="msg-sender">${msg.senderType === "master" ? "【主控】" : "【机器人】"}${msg.senderName}</span>
      <div class="msg-content">${msg.content}</div>
      <span class="msg-time">${msg.time}</span>
    </div>`;
  });
  content.innerHTML = html;
  content.scrollTop = content.scrollHeight; // 自动滚到底部
}

// 启停单个机器人
function startRobot(robotId) {
  const robot = robotGroup.find(r => r.id === robotId);
  if (!robot) return;
  robot.status = "在线";
  sendGroupChat(robot.id, robot.name, `✅ 已启动｜职责：${robot.role}｜随时待命`);
  refreshRobotList();
  refreshGroupChat();
}
function stopRobot(robotId) {
  const robot = robotGroup.find(r => r.id === robotId);
  if (!robot) return;
  robot.status = "离线";
  sendGroupChat(robot.id, robot.name, "❌ 已停止｜等待主控重启");
  refreshRobotList();
  refreshGroupChat();
}