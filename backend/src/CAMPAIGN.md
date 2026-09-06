# 法庭闯关内容来源

10 个关卡的名称、顺序、简介和难度来自 Git 提交 `33b0175` 的
`frontend/public/argus-original.html`（`campaignLevels`，903 行附近）。
旧版 `levelCases` 只定义了第 1、3 关，后续代码补充第 2 关；
`startLevel` 对缺失案件使用 `levelCases[1]`，是历史串案问题的来源之一。
当前 React 版此前也只读取 `/api/campaign/demo`。

- 第 1 关沿用当前租赁搜证材料，补全转账、清单、交接的原件定位。
- 第 2 关保留旧版普通手提包、899 元、第 3 日退货、吊牌完好的事实。
- 第 3 关保留标准工时、月薪 12000 元、放弃协议、4.8 万元请求，并补充主管安排与计算边界。
- 第 4–10 关根据旧版主题新编虚构案情，不宣称是从 Git 恢复的既有正文。
- 不沿用无证据默认扣除 500 元清洁费、固定追加 25% 加班费补偿等旧版结论。

## 数据与接口

`campaign-cases.js` 是地图、案件、证据、卡牌话术和裁决内容的唯一配置来源。
每份证据具有跨关卡唯一 ID，均可从场景热点或关联原件获得。
每关关键证据数量不超过 6 个行动点，第 10 关需完整取得 6 份。

- `GET /api/campaign/levels`：10 关目录。
- `GET /api/campaign/cases/:id`：按案件 ID 或关卡数字载入案件，不含预设裁决。
- `GET /api/campaign/demo`：兼容原来的第 1 关入口。
- `POST /api/campaign/respond`：提交当前 `caseId`、论点和 `evidenceIds`。
- `POST /api/campaign/verdict`：提交当前 `caseId`、`evidenceIds` 及必填的 `gameResult`（`player_win` 或 `opponent_win`）。最终裁决的胜负、得分和支持结论由游戏结果决定；证据链只用于解释本局过程，不再决定是否胜诉。

兼容旧客户端省略案件编号时使用第 1 关；显式未知编号返回 404。
其他案件、虚构或重复证据不能计入当前关卡的得分与关键证据链。
裁决为规则化训练反馈，不能验证原件真实性或替代真实法律程序。

## 验证

在仓库根目录运行 `npm test`、`npm run typecheck`、`npm run build`。
界面验证需逐关检查地图标题、案情、角色、原件、卡牌陈词及裁决；
切回地图或进入下一关时，证据、行动点与庭审记录均应重新初始化。
