(function () {
  const taskSummary = `
    <section class="section-card stack">
      <div class="split"><span class="badge">维修</span><span class="muted">WX202609120018</span></div>
      <div class="product-name">陈女士 · 智能坐便器维修</div>
      <div>2026-09-12（周六）14:00–16:00</div>
      <div>上海市徐汇区 · 云锦路示例花园 8 栋 602</div>
      <div class="muted">产品：智能坐便器 · 组合品番待现场核验</div>
    </section>`;

  window.TOTO_SCREENS = window.TOTO_SCREENS || {};
  window.TOTO_SCREENS.worker = {
    name: '服务人员小程序',
    tabs: [
      { label: '任务', go: 'w-tasks' },
      { label: '配件', go: 'w-parts' },
      { label: '应用', go: 'w-apps' },
      { label: '我的', go: 'w-mine' }
    ],
    screens: [
      {
        id: 'w-tasks', title: '我的任务', entry: 'W01', tab: 'w-tasks',
        goal: '快速找到当前要处理的任务，辨认预约与退回补充情况。',
        note: '任务是本人或授权范围。待完工是队列，已预约、审核退回是可组合标签；不构造单一互斥状态枚举。搜索和排序为固定样例，退回重提后的标签及计数由本次演示会话更新，真实匹配规则及默认顺序待确认。待发布和待交单暂不进入主原型，责任人及准入规则待确认。',
        body: `
          <div class="split"><div><div class="muted">2026-09-12 · 周六</div><div class="section-title">今天的服务安排</div></div><span class="badge">徐汇服务中心</span></div>
          <div class="stats"><div><div class="big-number">2</div><div class="muted">今日预约</div></div><div><div class="big-number" data-return-count>1</div><div class="muted">退回待补</div></div><div><div class="big-number" data-review-count>1</div><div class="muted">待审核</div></div></div>
          <form data-submit-go="w-detail" class="task-search">
            <label class="field"><span>查询任务</span><input name="taskSearch" type="search" placeholder="任务号、联系人或地址" required></label>
            <button class="secondary" type="submit">查询</button>
          </form>
          <div class="row"><button class="primary" data-go="w-tasks" data-pending-queue>待完工 3</button><button class="secondary" data-go="w-review" data-review-queue>待审核 1</button><button class="secondary" data-go="w-exception">异常跟进</button></div>
          <section class="section-card stack">
            <div class="split"><span class="badge">待完工 · 已预约</span><span class="muted">维修</span></div>
            <div class="product-name">14:00–16:00 · 陈女士</div>
            <div>徐汇区 · 云锦路示例花园 8 栋 602</div><div class="muted">智能坐便器 · 冲洗功能异常</div>
            <div class="muted">WX202609120018</div><button class="primary" data-go="w-detail">查看任务</button>
          </section>
          <section class="section-card stack" data-returned-card>
            <div class="split"><span class="badge" data-returned-status>待完工 · 审核退回</span><span class="muted">安装</span></div>
            <div class="product-name">赵先生 · 徐汇区龙华示例公寓</div><div class="notice">待补充：产品铭牌照片不清晰，请重新上传。</div>
            <div class="muted">AZ202609110006</div><button class="secondary" data-go="w-returned" data-returned-button>查看退回要求</button>
          </section>
          <section class="section-card stack">
            <div class="split"><span class="badge">待完工 · 已预约</span><span class="muted">安装</span></div>
            <div class="product-name">17:00–18:00 · 林女士</div><div>徐汇区 · 漕溪示例苑 2 栋 301</div>
            <div class="muted">AZ202609120021 · 智能坐便器安装</div><button class="secondary" data-action="原型反馈：该卡片用于验证列表密度；本轮主流程从陈女士的维修任务进入。">查看任务</button>
          </section>`
      },
      {
        id: 'w-detail', title: '任务详情', entry: 'W02', tab: 'w-tasks',
        goal: '看清本次预约、故障及联系历史，并进入当前可执行动作。',
        note: '联系方式为虚构脱敏数据，电话与地址操作仅模拟。只展示联系预约、现场服务和异常处理等原型动作；真实按钮须由权限与后端 actions 决定。地址补充、备用电话和备注的可编辑范围另按 Spec 核定。',
        body: `
          <div class="row"><span class="badge">待完工</span><span class="badge">已预约</span></div>
          ${taskSummary}
          <section class="section-card stack"><div class="section-title">联系客户</div><div class="split"><span>陈女士</span><span>138 **** 2608</span></div><div class="row"><button class="secondary" data-action="原型模拟：进入系统拨号确认；没有拨打电话。">拨打电话</button><button class="secondary" data-action="原型模拟：复制地址；没有写入系统剪贴板。">复制地址</button><button class="link-button" data-go="w-appointment">联系记录 / 改约</button></div></section>
          <section class="section-card stack"><div class="section-title">本次服务</div><div>故障描述：冲洗时出水断续，偶尔无法启动。</div><div>服务项目：故障检测与维修 × 1</div><div>客户备注：请到达前 20 分钟电话联系。</div><div class="muted">购买信息和产品码需现场核验，保修结论以有效资料及业务规则为准。</div></section>
          <section class="section-card stack"><div class="section-title">沟通与处理记录</div><div class="timeline"><div class="step"><strong>09-12 09:20 · 已预约</strong><div class="muted">丁师傅：客户确认今天 14:00–16:00 上门。</div></div><div class="step"><strong>09-12 08:45 · 任务派发</strong><div class="muted">徐汇服务中心分配维修任务。</div></div></div></section>`,
        footer: `<button class="secondary" data-go="w-exception">异常 / 改期</button><button class="primary" data-go="w-service">开始现场服务</button>`
      },
      {
        id: 'w-appointment', title: '联系与预约', entry: 'W02', tab: 'w-tasks',
        goal: '一次记录联系结果、约定时间和备注，不遗漏客户确认。',
        note: '联系结果和时间字段用于验证填写顺序，选项、必填条件和改期状态迁移未定版。表单提交仅跳回任务详情，不持久化或发送通知；无法联系的正式处理按断联规则确认。',
        body: `
          ${taskSummary}
          <form data-submit-go="w-detail" class="section-card stack">
            <label class="field"><span>联系结果</span><select name="contactResult" required><option value="">请选择</option><option value="confirmed">客户已确认预约</option><option value="later">客户稍后回复</option></select></label>
            <label class="field"><span>预约日期</span><input name="appointmentDate" type="date" min="2026-09-12" value="2026-09-12" required></label>
            <div class="row"><label class="field"><span>开始时间</span><input name="startTime" type="time" value="14:00" required></label><label class="field"><span>结束时间</span><input name="endTime" type="time" value="16:00" required></label></div>
            <label class="field"><span>备用电话</span><input name="backupPhone" type="tel" placeholder="本次可联系的备用号码" autocomplete="off"></label>
            <label class="field"><span>联系备注</span><textarea name="contactNote" rows="3" placeholder="记录客户要求及已确认事项" required></textarea></label>
            <button class="primary" type="submit">保存联系记录</button>
          </form>
          <button class="link-button" data-go="w-exception">客户未接听 / 需要改期</button>`
      },
      {
        id: 'w-service', title: '现场服务', entry: 'W04', tab: 'w-tasks',
        goal: '按到达、核验、处理的顺序采集资料，保留弱网恢复路径。',
        note: '现场履约采用目标需求，不声称旧系统已实现。定位、扫码及保存草稿仅显示模拟反馈，未读取位置、相机或建立离线存储。定位拒绝和扫码失败均提供人工填写路径；签到例外审批和必填字段待 Spec 确认。远程指导应另走无需签到的简化分支。',
        body: `
          ${taskSummary}
          <section class="section-card stack"><div class="section-title">1 · 到达签到</div><div class="row"><button class="secondary" data-action="原型模拟：申请单次定位并签到；未读取真实位置。">定位签到</button><button class="link-button" data-action="无法定位时，可填写下方到达说明；正式例外处理规则待确认。">无法定位</button></div><label class="field"><span>到达说明</span><textarea name="arrivalNote" rows="2" placeholder="定位不可用时，说明到达情况"></textarea></label></section>
          <form data-submit-go="w-completion" class="stack">
            <section class="section-card stack"><div class="section-title">2 · 核验产品</div><div class="row"><button class="secondary" type="button" data-action="原型模拟：打开产品码扫描入口；未调用相机。">扫描产品码</button><button class="link-button" type="button" data-action="扫描不成功时，请在下方手动录入并核对产品码。">扫码失败</button></div><label class="field"><span>制造编号 / 序列编号</span><input name="serialCode" placeholder="扫描后回填，或手动输入" value="DEMO-20260912-001" required></label><label class="field"><span>RFID</span><input name="rfid" placeholder="有 RFID 时扫描或填写"></label><label class="choice"><input type="checkbox" name="noRfid">产品未找到 RFID，提交人工核验说明</label></section>
            <section class="section-card stack"><div class="section-title">3 · 检测与处理</div><label class="field"><span>检测结果</span><textarea name="diagnosis" rows="3" placeholder="描述检查发现和故障现象" required></textarea></label><label class="field"><span>处理记录</span><textarea name="serviceResult" rows="3" placeholder="记录采取的措施及处理结果" required></textarea></label><label class="field"><span>本次配件使用</span><select name="partUsage" required><option value="">请选择</option><option value="none">本次未使用配件</option><option value="recorded">已核对并记录实际耗用配件</option></select></label><button class="link-button" type="button" data-go="w-parts">查看我的配件</button></section>
            <div class="notice">资料未提交前可继续补充；上传失败时需保留已填写内容。</div>
            <div class="row"><button class="secondary" type="button" data-action="原型模拟：草稿保存反馈。当前页面不会真正持久化数据。">保存草稿</button><button class="primary" type="submit">继续填写完工资料</button></div>
          </form>
          <button class="link-button" data-go="w-exception">需要配件 / 需再次上门</button>`
      },
      {
        id: 'w-completion', title: '提交完工资料', entry: 'W04', tab: 'w-tasks',
        goal: '提交前看清证据是否齐备，明确提交后进入审核。',
        note: '旧系统四步仅证实图片上传→产品信息→单据信息→确认费用，完整表单尚未核实。本页是按目标需求重组的评审原型；照片分类、客户确认方式、必填校验、制造编号映射与无 RFID 例外均待定。首期费用、支付、退款及结算不在本原型定案。当前照片仅为状态样例，选择照片按钮只显示模拟反馈，不读取、选择或保留本地文件；表单校验是演示规则，不等于业务验收标准。',
        body: `
          <div class="notice">提交完工后进入资料审核，工单还未关闭。</div>
          ${taskSummary}
          <form id="w-completion-form" data-submit-go="w-review" class="stack">
            <section class="section-card stack"><div class="section-title">服务结果</div><label class="field"><span>本次处理说明</span><textarea name="completionResult" rows="3" placeholder="描述处理结果和试运行情况" required></textarea></label><label class="field"><span>产品核验</span><select name="productCheck" required><option value="">请选择核验结果</option><option value="checked">产品信息与现场一致</option><option value="manual">已说明差异，需人工复核</option></select></label></section>
            <section class="section-card stack"><div class="section-title">现场照片</div><div class="list-item"><div>服务现场照片 · 1 张</div><span class="badge">已有</span></div><div class="list-item"><div>产品铭牌照片 · 1 张</div><span class="badge">已有</span></div><button class="secondary" type="button" data-action="照片状态演示：正式版会提供相机或相册选择；当前不读取或保存本地照片。">选择照片</button><label class="choice"><input name="evidenceChecked" type="checkbox" required>我已核对本次提交照片清晰、与任务相关</label></section>
            <section class="section-card stack"><div class="section-title">客户确认</div><label class="field"><span>确认情况</span><select name="customerConfirmation" required><option value="">请选择</option><option value="onsite">客户已现场确认服务结果</option><option value="exception">无法现场确认，已记录原因供审核</option></select></label><label class="field"><span>确认记录 / 例外说明</span><textarea name="confirmationNote" rows="2" placeholder="记录确认方式，或无法确认的原因" required></textarea></label></section>
            <section class="section-card stack"><div class="section-title">提交前核对</div><div class="muted">产品核验、服务结果、照片、客户确认及配件记录应与本次任务一致。</div><label class="choice"><input name="submitChecked" type="checkbox" required>已核对本次服务资料</label></section>
          </form>`,
        footer: `<button class="secondary" data-action="演示：资料保留在本次页面会话中。">暂存</button><button class="primary" type="submit" form="w-completion-form">提交完工，等待审核</button>`
      },
      {
        id: 'w-review', title: '完工提交状态', entry: 'W01 / W04', tab: 'w-tasks',
        goal: '明确提交已进入审核，用户能找到材料与处理进度。',
        note: '此为静态待审核状态，不由真实接口触发。正式版成功页必须依赖接口结果；审核通过、交单与关闭节点不能合并。审核责任人、SLA、待交单适用范围待确认，因此不显示承诺时效或自动关闭。',
        body: `
          <section class="section-card stack"><span class="badge">待审核</span><div class="product-name">完工资料已提交</div><div>接下来由有权限的审核人员核对资料。</div><div class="muted">资料审核通过后，工单仍按后续办结规则流转。</div></section>
          ${taskSummary}
          <section class="section-card stack"><div class="section-title">提交记录</div><div class="timeline"><div class="step"><strong>09-12 15:35 · 第 1 次提交</strong><div class="muted">服务结果、产品信息、照片及客户确认资料已登记。</div></div><div class="step"><strong>当前 · 等待审核</strong><div class="muted">如需补充，会显示具体退回原因。</div></div></div><button class="secondary" data-action="原型模拟：查看本次提交快照。正式实现保留原材料，不覆盖历史版本。">查看提交资料</button></section>`,
        footer: `<button class="primary" data-go="w-tasks">返回任务列表</button>`
      },
      {
        id: 'w-returned', title: '退回补充资料', entry: 'W02 / W04', tab: 'w-tasks',
        goal: '直接看到退回原因及需补充项，修正后重提并保留历史。',
        note: '审核退回属于任务队列的可组合标记。本例 AZ202609110006 与维修主线是不同样例任务。重提进入本任务第 2 次提交待审核的独立反馈屏，保留原始提交与退回记录；当前仅更新演示会话，不写入真实版本。照片仅为状态样例，选择照片按钮不读取、选择或保留本地文件。',
        body: `
          <div class="row"><span class="badge">待完工</span><span class="badge">审核退回</span></div>
          <section class="section-card stack"><div class="product-name">赵先生 · 智能坐便器安装</div><div class="muted">AZ202609110006 · 徐汇区龙华示例公寓</div><div class="notice">审核意见：产品铭牌照片模糊，无法核对制造编号。请补充清晰照片。</div><div class="muted">09-12 10:10 · 服务中心审核</div></section>
          <form data-submit-go="w-resubmitted" class="section-card stack"><div class="section-title">补充本次资料</div><label class="field"><span>补充说明</span><textarea name="resubmitNote" rows="3" placeholder="说明已经补充或修正的内容" required></textarea></label><button class="secondary" type="button" data-action="照片状态演示：补充清晰产品铭牌照片；当前不读取或保存本地照片。">选择照片</button><label class="choice"><input name="resubmitCheck" type="checkbox" required>已按退回意见核对并补齐资料</label><button class="primary" type="submit">重新提交审核</button></form>
          <section class="section-card stack"><div class="section-title">提交历史</div><div class="timeline"><div class="step"><strong>第 1 次提交 · 09-11 17:40</strong><div class="muted">原服务记录与照片保留。</div></div><div class="step"><strong>审核退回 · 09-12 10:10</strong><div class="muted">需补充清晰产品铭牌照片。</div></div></div><button class="secondary" data-action="原型模拟：打开第 1 次提交的只读材料。">查看原提交资料</button></section>`
      },
      {
        id: 'w-resubmitted', title: '资料已重新提交', entry: 'W04', tab: 'w-tasks',
        goal: '核对本任务已形成第 2 次提交并等待审核，返回列表后看到一致状态。',
        note: '本页只反馈 AZ202609110006 的演示重提，不与陈女士维修任务串单。退回后的新材料形成第 2 次提交，原始提交和退回记录保留；页面与任务列表状态仅在演示会话中更新。当前照片为状态样例，不包含真实文件。等待审核不表示审核通过或工单关闭。',
        body: `
          <section class="section-card stack"><span class="badge">第 2 次提交 · 待审核</span><div class="product-name">补充资料已重新提交</div><div>请等待审核人员核对本次补充资料。</div><div class="notice">本次提交仍需审核，工单尚未关闭。</div></section>
          <section class="section-card stack"><div class="product-name">赵先生 · 智能坐便器安装</div><div>AZ202609110006</div><div class="muted">徐汇区龙华示例公寓</div><div>本次补充：清晰产品铭牌照片及补充说明</div></section>
          <section class="section-card stack"><div class="section-title">提交与审核记录</div><div class="timeline"><div class="step"><strong>第 1 次提交 · 09-11 17:40</strong><div class="muted">原服务记录和照片作为历史版本保留。</div></div><div class="step"><strong>审核退回 · 09-12 10:10</strong><div class="muted">产品铭牌照片模糊，需补充清晰照片。</div></div><div class="step"><strong>第 2 次提交 · 本次</strong><div class="muted">补充资料已提交，等待审核。</div></div></div><button class="secondary" data-action="原型模拟：查看第 2 次提交的只读资料；第 1 次提交仍独立保留。">查看本次提交</button></section>`,
        footer: `<button class="primary" data-go="w-tasks">返回任务列表</button>`
      },
      {
        id: 'w-exception', title: '异常与后续安排', entry: 'W02 / W04', tab: 'w-tasks',
        goal: '遇到缺件、改期或断联时，记录原因并留下下一步。',
        note: '此页验证异常记录结构，不提供任意状态编辑器。异常选项、原因字典、谁能取消或恢复及通知规则待确认。补充的下次跟进日期是可选设计建议，不视为已确认字段；保存仅跳转示例任务，不真正改变状态。',
        body: `
          ${taskSummary}
          <form data-submit-go="w-detail" class="section-card stack"><label class="field"><span>本次情况</span><select name="exceptionType" required><option value="">请选择</option><option value="parts">缺件，需要后续处理</option><option value="reschedule">客户要求改期</option><option value="unreachable">暂时无法联系客户</option></select></label><label class="field"><span>原因与已做处理</span><textarea name="exceptionReason" rows="4" placeholder="记录缺少的配件、改期原因或联系情况" required></textarea></label><label class="field"><span>下次跟进日期</span><input name="followupDate" type="date" min="2026-09-12"></label><label class="field"><span>后续安排</span><textarea name="nextStep" rows="3" placeholder="记录到件后联系、重新确认预约等安排" required></textarea></label><button class="primary" type="submit">保存处理记录</button></form>
          <section class="section-card stack"><div class="section-title">缺件时继续处理</div><div class="muted">先核对可用库存，再申请配件；到件后联系客户确认后续安排。</div><button class="secondary" data-go="w-requisition">查询配件并领件</button></section>`
      },
      {
        id: 'w-parts', title: '我的配件', entry: 'W05', tab: 'w-parts',
        goal: '看清自己能使用的库存，快速进入领料和记录。',
        note: '展示虚构配件和库存，个人库存与库房可领数量明确分开。价格与合计金额口径待确认，首轮不展示推测费用。退料仅模拟入口，审批、实物确认和库存回补规则不从旧截图推导。',
        body: `
          <section class="section-card stack"><div class="split"><div><div class="muted">丁师傅 · 徐汇服务中心</div><div class="section-title">个人可用库存</div></div><span class="badge">2 类 · 3 件</span></div><div class="row"><button class="primary" data-go="w-requisition">领件</button><button class="secondary" data-go="w-records">查看配件记录</button></div></section>
          <label class="field"><span>查找我的配件</span><input name="myPartSearch" type="search" placeholder="配件型号或名称"></label><button class="secondary" data-action="原型反馈：当前展示两类个人库存样例，正式版按型号或名称查询。">查询</button>
          <section class="section-card stack"><div class="split"><div class="product-name">进水过滤组件</div><span class="badge">可用 2 件</span></div><div class="muted">示例型号 DEMO-P001</div><div>来源：个人库存</div><button class="secondary" data-action="原型模拟：查看配件适用品番和库存流水。">查看详情</button><button class="link-button" data-action="原型模拟：进入退料申请；原因、数量和实物确认规则需按正式契约实现。">申请退料</button></section>
          <section class="section-card stack"><div class="split"><div class="product-name">连接密封圈</div><span class="badge">可用 1 件</span></div><div class="muted">示例型号 DEMO-P002</div><div>来源：个人库存</div><button class="secondary" data-action="原型模拟：查看配件适用品番和库存流水。">查看详情</button></section>`,
        footer: `<button class="secondary" data-go="w-service">返回现场服务</button><button class="primary" data-go="w-requisition">申请补充配件</button>`
      },
      {
        id: 'w-requisition', title: '领件申请', entry: 'W06', tab: 'w-parts',
        goal: '区分配件与来源库存，填写数量后提交申请。',
        note: '本轮只走同一服务中心库房来源的单项领料，避免擅自定义跨来源拆单和人员间调拨。申请不代表库存已扣减。可领数量为样例，正式版提交时须校验权限、库存及并发；是否锁库存和审批节点待确认。',
        body: `
          <section class="section-card stack"><div class="section-title">选择配件与来源</div><label class="field"><span>配件型号</span><input name="requisitionSearch" type="search" value="DEMO-P001" placeholder="输入配件型号查询"></label><button class="secondary" data-action="原型模拟：展示 DEMO-P001 的库房来源结果。">查询</button></section>
          <form data-submit-go="w-records" class="stack"><section class="section-card stack"><div class="product-name">进水过滤组件</div><div class="muted">DEMO-P001 · 具体适用产品请核对资料</div><label class="field"><span>库存来源</span><select name="stockSource" required><option value="">请选择来源</option><option value="xuhui">徐汇服务中心库房 · 可领 8 件</option></select></label><label class="field"><span>申请数量</span><input name="quantity" type="number" min="1" max="8" step="1" value="1" required></label><label class="field"><span>关联任务</span><input name="relatedTask" value="WX202609120018" placeholder="可填写本次维修任务号"></label><label class="field"><span>申请说明</span><textarea name="requisitionNote" rows="3" placeholder="说明维修所需或备料用途"></textarea></label></section><section class="section-card stack"><div class="section-title">待提交申请</div><div>来源：徐汇服务中心库房</div><div class="muted">提交后查看处理状态；领料确认前不计入个人可用库存。</div><button class="primary" type="submit">提交领料申请</button></section></form>`
      },
      {
        id: 'w-technical', title: '技术资料', entry: 'W13', tab: 'w-apps',
        goal: '现场按品番或问题定位资料，并快速返回原任务。',
        note: '资料均为标题示例，不含未经核实的维修指导。旧截图仅证明检索结果，预览、版本、生效范围和下载权限仍需确认。本原型只模拟打开动作；正式资料的可信来源与适用品番必须核定。',
        body: `
          <section class="section-card stack"><label class="field"><span>按品番或关键词查询</span><input name="technicalSearch" type="search" placeholder="产品品番、故障关键词" value="智能坐便器"></label><label class="field"><span>资料类型</span><select name="technicalType"><option>全部资料</option><option>安装手册</option><option>维修手册</option><option>使用说明</option><option>视频资料</option></select></label><button class="secondary" data-action="原型反馈：已展示智能坐便器相关的资料标题样例。">查询资料</button></section>
          <section class="section-card stack"><span class="badge">维修手册</span><div class="product-name">智能坐便器 · 常见故障检查资料</div><div class="muted">适用范围与版本：以正式发布资料为准</div><button class="primary" data-action="原型模拟：打开维修资料预览。当前没有加载真实技术文件。">查看资料</button></section>
          <section class="section-card stack"><span class="badge">安装手册</span><div class="product-name">智能坐便器 · 安装核对资料</div><div class="muted">适用范围与版本：以正式发布资料为准</div><button class="secondary" data-action="原型模拟：打开安装资料预览。当前没有加载真实技术文件。">查看资料</button></section>`,
        footer: `<button class="primary" data-go="w-service">返回现场服务</button>`
      },
      {
        id: 'w-apps', title: '应用', entry: 'W08', tab: 'w-apps',
        goal: '集中进入资料查询与配件记录，保留清楚的四 Tab 结构。',
        note: '沿用原始截图的资料查询与配件记录分组，不增加额外 Tab。延保、退料和调拨为本轮非主流程模拟入口；资料权限、调拨接收确认与库存一致性仍由正式契约约束。',
        body: `
          <section class="section-card stack"><div class="section-title">资料查询</div><button class="list-item" data-go="w-technical"><span>技术资料</span><span>安装、维修与使用说明 ›</span></button><button class="list-item" data-action="原型模拟：进入延保资料查询。查询范围、数据来源和保修判定关系待确认。"><span>延保资料</span><span>查看适用范围与有效期 ›</span></button></section>
          <section class="section-card stack"><div class="section-title">配件记录</div><button class="list-item" data-go="w-records"><span>领料单</span><span>申请与处理记录 ›</span></button><button class="list-item" data-action="原型模拟：进入退料单列表。实物确认和库存回补规则待确认。"><span>退料单</span><span>退料与处理记录 ›</span></button><button class="list-item" data-action="原型模拟：进入授权范围内的调拨记录。没有执行调拨或接收确认。"><span>调拨单</span><span>调拨与接收记录 ›</span></button></section>`
      },
      {
        id: 'w-mine', title: '我的', entry: 'W14 / W15 / W16', tab: 'w-mine',
        goal: '清楚展示当前企业身份，集中处理账号和反馈。',
        note: '当前使用虚构身份，不把服务人员端绑定为客服助手。切换企业必须重算权限与数据范围，退出必须使本地及服务端登录态失效；本轮仅模拟反馈，不执行身份变更。企业切换、登录和反馈责任流程待确认。',
        body: `
          <section class="section-card stack"><div class="product-name">丁师傅</div><div>徐汇服务中心</div><div class="muted">当前企业：上海示例服务企业</div><span class="badge">服务人员</span></section>
          <section class="section-card stack"><button class="list-item" data-action="原型模拟：打开问题反馈表单；不向任何人发送消息。"><span>问题反馈</span><span>›</span></button><button class="list-item" data-action="原型模拟：进入修改密码，正式版需要旧密码或二次验证。"><span>修改密码</span><span>›</span></button><button class="list-item" data-action="原型模拟：打开企业选择；切换前应处理未提交资料，切换后重新计算权限与数据范围。"><span>切换企业</span><span>上海示例服务企业 ›</span></button><button class="list-item" data-action="原型模拟：退出确认。没有改变真实登录状态。"><span>退出登录</span><span>›</span></button></section>`
      },
      {
        id: 'w-records', title: '领料记录', entry: 'W09', tab: 'w-apps',
        goal: '区分申请已提交、领料处理中和已确认入个人库存。',
        note: '状态页签有旧截图证据；本页为固定样例，不会因上一页数量而改变。领料中不等于已经扣库或入个人库存；审批、撤销权限和库存事务由后端定义。申请后进入此页仅用于走查原型，不代表真实提交成功。',
        body: `
          <div class="row"><button class="primary" data-go="w-records">领料中 1</button><button class="secondary" data-action="原型反馈：已领料列表暂无其他样例。">已领料</button><button class="secondary" data-action="原型反馈：已拒绝列表暂无样例；正式版应显示拒绝原因。">已拒绝</button><button class="secondary" data-action="原型反馈：已撤销列表暂无样例；撤销权限和条件待确认。">已撤销</button></div>
          <section class="section-card stack"><div class="split"><span class="badge">领料中</span><span class="muted">LL202609120003</span></div><div class="product-name">进水过滤组件 · 1 件</div><div class="muted">DEMO-P001</div><div>来源：徐汇服务中心库房</div><div>关联任务：WX202609120018</div><div class="muted">申请时间：2026-09-12 13:30</div><div class="notice">配件处理完成前，个人可用库存不会因本申请自动增加。</div><button class="secondary" data-action="原型模拟：查看申请与处理时间线；未更新真实库存。">查看处理记录</button></section>`,
        footer: `<button class="secondary" data-go="w-parts">我的配件</button><button class="primary" data-go="w-detail">返回关联任务</button>`
      }
    ]
  };
})();
