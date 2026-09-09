// Imported from /Users/andylyu/Downloads/eazo-project/src/lib/argus/levels.ts (original levels 1-10).
// IDs are namespaced so these cases cannot share evidence with the native campaign.
const eazoCampaignCases = [
  {
    "id": "eazo-rental-deposit-001",
    "levelId": 11,
    "levelTitle": "租赁押金争议",
    "desc": "EAZO 导入 · 房屋租赁合同纠纷",
    "title": "租赁押金争议：墙面划痕是谁造成？",
    "type": "房屋租赁合同纠纷",
    "difficulty": 1,
    "playerSide": "原告 · 租客张某",
    "opponentSide": "被告 · 房东李某",
    "goal": "证明房东无权扣留全部押金，并指出维修金额缺乏真实凭证。",
    "summary": "案件：租赁押金争议——租客退租时被房东扣留全部押金 3000 元，房东称墙面划痕需维修 2500 元。",
    "actionPoints": 6,
    "focus": [
      "损坏是否由租客造成",
      "房东是否有权扣除全部押金",
      "维修金额是否有证据"
    ],
    "scenes": [
      {
        "id": "eazo-rental-deposit-001-scene-rental-room",
        "title": "场景一 · 出租屋",
        "description": "退租当天的出租屋。墙面、家具、钥匙和验收单都可能留下时间线线索。",
        "hotspots": [
          {
            "id": "eazo-rental-deposit-001-scene-hotspot-wall",
            "title": "墙面划痕",
            "icon": "🧱",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-movein-photo",
            "hint": "刮痕边缘已有旧灰尘。"
          },
          {
            "id": "eazo-rental-deposit-001-scene-hotspot-furniture",
            "title": "旧家具",
            "icon": "🪑",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-inventory",
            "hint": "入住清单记载已有磨损。"
          },
          {
            "id": "eazo-rental-deposit-001-scene-hotspot-keys",
            "title": "钥匙与验收单",
            "icon": "🔑",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-checkout",
            "hint": "退租交接没有双方签字。"
          }
        ]
      },
      {
        "id": "eazo-rental-deposit-001-scene-phone",
        "title": "场景二 · 手机聊天",
        "description": "连续微信对话、转账记录和房东发送的维修报价。",
        "hotspots": [
          {
            "id": "eazo-rental-deposit-001-scene-hotspot-chat",
            "title": "微信对话",
            "icon": "💬",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-chat",
            "hint": "房东曾说“墙面本来就有几道痕”。"
          },
          {
            "id": "eazo-rental-deposit-001-scene-hotspot-transfer",
            "title": "押金转账",
            "icon": "💴",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-transfer",
            "hint": "3000 元押金有完整流水。"
          }
        ]
      },
      {
        "id": "eazo-rental-deposit-001-scene-document-desk",
        "title": "场景三 · 文件桌",
        "description": "完整租赁合同、入住照片和维修报价单。点击原件中的黄色区域获得证据。",
        "hotspots": [
          {
            "id": "eazo-rental-deposit-001-scene-hotspot-contract",
            "title": "租赁合同",
            "icon": "📄",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-contract",
            "hint": "第5条约定无损坏应在7日内退还押金。"
          },
          {
            "id": "eazo-rental-deposit-001-scene-hotspot-repair",
            "title": "维修报价单",
            "icon": "🧾",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-repair",
            "hint": "只有报价，没有付款凭证。"
          }
        ]
      }
    ],
    "documents": [
      {
        "id": "eazo-rental-deposit-001-document-doc-contract",
        "name": "房屋租赁合同（完整）",
        "type": "doc",
        "content": "【虚构训练材料】\n《房屋租赁合同》\n第一条 租赁房屋位于杭州市西湖区某小区，租期自2025年3月1日至2026年2月28日。\n第二条 月租金5000元，乙方于签约时支付押金3000元。\n第五条 租赁期满，乙方无违约行为且房屋无损坏的，甲方应在7日内全额退还押金。\n第六条 退租时双方应共同验收并签署交接单。",
        "hotspots": [
          {
            "id": "eazo-rental-deposit-001-source-doc-contract-deposit",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-contract",
            "label": "第五条：7日内全额退还押金"
          },
          {
            "id": "eazo-rental-deposit-001-source-eazo-rental-deposit-001-evidence-ev-inventory",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-inventory",
            "label": "证据定位：入住清单：家具旧磨损"
          },
          {
            "id": "eazo-rental-deposit-001-source-eazo-rental-deposit-001-evidence-ev-checkout",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-checkout",
            "label": "证据定位：退租交接：未共同签字"
          }
        ]
      },
      {
        "id": "eazo-rental-deposit-001-document-doc-chat",
        "name": "微信聊天记录（完整）",
        "type": "chat",
        "content": "【虚构训练材料】\n2026-02-20 09:14 张某：今天晚上可以验收吗？\n2026-02-20 09:18 李某：我先看看，墙面本来就有几道痕，之前没来得及处理。\n2026-02-20 18:32 张某：那几道痕入住时照片里就有。\n2026-02-20 18:40 李某：我核对一下照片。\n2026-02-28 10:05 李某：维修报价要 2500 元，押金先全部扣着。",
        "hotspots": [
          {
            "id": "eazo-rental-deposit-001-source-doc-chat-old-damage",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-chat",
            "label": "房东确认墙面本来就有痕迹"
          },
          {
            "id": "eazo-rental-deposit-001-source-eazo-rental-deposit-001-evidence-ev-transfer",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-transfer",
            "label": "证据定位：押金转账：3000元"
          }
        ]
      },
      {
        "id": "eazo-rental-deposit-001-document-doc-photo",
        "name": "入住照片与元数据",
        "type": "img",
        "content": "【虚构训练材料】\n照片 IMG_0301.jpg\n形成时间：2025-03-01 12:06\n拍摄位置：客厅东侧墙面\n可见：与退租时相同位置存在浅色横向划痕。",
        "hotspots": [
          {
            "id": "eazo-rental-deposit-001-source-doc-photo-scratch",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-movein-photo",
            "label": "入住当天已存在同位置划痕"
          }
        ]
      },
      {
        "id": "eazo-rental-deposit-001-document-doc-repair",
        "name": "维修报价单",
        "type": "doc",
        "content": "【虚构训练材料】\n墙面修补及家具清洁报价：2500元。\n出具方：个人维修联系人。\n缺少：维修完成照片、付款流水、盖章发票和分项明细。",
        "hotspots": [
          {
            "id": "eazo-rental-deposit-001-source-doc-repair-no-proof",
            "evidenceId": "eazo-rental-deposit-001-evidence-ev-repair",
            "label": "报价单没有付款和分项凭证"
          }
        ]
      }
    ],
    "evidence": [
      {
        "id": "eazo-rental-deposit-001-evidence-ev-movein-photo",
        "title": "入住照片：旧划痕",
        "type": "image",
        "sourceDocumentId": "eazo-rental-deposit-001-document-doc-photo",
        "sourceRange": "IMG_0301.jpg · 2025-03-01 12:06",
        "description": "入住当天同一墙面已经存在浅色横向划痕。",
        "proofPurpose": "证明损坏形成时间早于租客退租。",
        "authenticity": "原始文件待核验",
        "relevance": "高",
        "credibility": 9
      },
      {
        "id": "eazo-rental-deposit-001-evidence-ev-chat",
        "title": "微信确认：墙面本来就有痕",
        "type": "chat",
        "sourceDocumentId": "eazo-rental-deposit-001-document-doc-chat",
        "sourceRange": "2026-02-20 09:18",
        "description": "房东在聊天中先于争议确认墙面原本已有痕迹。",
        "proofPurpose": "证明相对方对既有损坏有先行陈述。",
        "authenticity": "含上下文",
        "relevance": "高",
        "credibility": 8
      },
      {
        "id": "eazo-rental-deposit-001-evidence-ev-contract",
        "title": "合同第5条：7日退还押金",
        "type": "document",
        "sourceDocumentId": "eazo-rental-deposit-001-document-doc-contract",
        "sourceRange": "第五条",
        "description": "无违约且无损坏时，房东应在7日内全额退还押金。",
        "proofPurpose": "证明押金退还条件和期限。",
        "authenticity": "合同原件",
        "relevance": "高",
        "credibility": 9
      },
      {
        "id": "eazo-rental-deposit-001-evidence-ev-repair",
        "title": "维修报价：缺少实际支出凭证",
        "type": "receipt",
        "sourceDocumentId": "eazo-rental-deposit-001-document-doc-repair",
        "sourceRange": "报价单全文",
        "description": "报价单没有付款流水、发票和分项明细。",
        "proofPurpose": "质疑损失金额和证明力。",
        "authenticity": "待核验",
        "relevance": "高",
        "credibility": 6
      },
      {
        "id": "eazo-rental-deposit-001-evidence-ev-transfer",
        "title": "押金转账：3000元",
        "type": "payment",
        "sourceDocumentId": "eazo-rental-deposit-001-document-doc-chat",
        "sourceRange": "转账记录（完整）",
        "description": "租客支付3000元押金的流水。",
        "proofPurpose": "证明押金实际交付。",
        "authenticity": "银行流水截图",
        "relevance": "中",
        "credibility": 8
      },
      {
        "id": "eazo-rental-deposit-001-evidence-ev-inventory",
        "title": "入住清单：家具旧磨损",
        "type": "document",
        "sourceDocumentId": "eazo-rental-deposit-001-document-doc-contract",
        "sourceRange": "附件一 · 入住清单",
        "description": "清单记载家具已有轻微磨损，退租验收未单独标注新增损坏。",
        "proofPurpose": "证明房屋原状及损耗背景。",
        "authenticity": "附件原件",
        "relevance": "中",
        "credibility": 7
      },
      {
        "id": "eazo-rental-deposit-001-evidence-ev-checkout",
        "title": "退租交接：未共同签字",
        "type": "document",
        "sourceDocumentId": "eazo-rental-deposit-001-document-doc-contract",
        "sourceRange": "第六条及交接记录",
        "description": "房东单方面查看并扣押押金，交接单没有双方签字。",
        "proofPurpose": "质疑验收程序和单方扣款。",
        "authenticity": "待核验",
        "relevance": "高",
        "credibility": 7
      }
    ],
    "keyEvidenceIds": [
      "eazo-rental-deposit-001-evidence-ev-movein-photo",
      "eazo-rental-deposit-001-evidence-ev-chat",
      "eazo-rental-deposit-001-evidence-ev-contract",
      "eazo-rental-deposit-001-evidence-ev-repair"
    ],
    "cards": [
      {
        "id": "recorded",
        "name": "已为您记录",
        "type": "damage",
        "cost": 1,
        "value": 2,
        "hint": "用原件固定关键事实",
        "text": "依据「入住照片：旧划痕」：入住当天同一墙面已经存在浅色横向划痕。证明损坏形成时间早于租客退租。"
      },
      {
        "id": "verify",
        "name": "正在核实",
        "type": "damage",
        "cost": 2,
        "value": 4,
        "hint": "核对争议材料的证明力",
        "text": "依据「微信确认：墙面本来就有痕」：房东在聊天中先于争议确认墙面原本已有痕迹。证明相对方对既有损坏有先行陈述。"
      },
      {
        "id": "script",
        "name": "标准话术",
        "type": "defense",
        "cost": 1,
        "value": 2,
        "hint": "护盾 +3，回复一点精力",
        "text": "依据「合同第5条：7日退还押金」：无违约且无损坏时，房东应在7日内全额退还押金。证明押金退还条件和期限。"
      },
      {
        "id": "question",
        "name": "交叉质询",
        "type": "damage",
        "cost": 3,
        "value": 7,
        "hint": "围绕本案争点串联证据",
        "text": "依据「维修报价：缺少实际支出凭证」：报价单没有付款流水、发票和分项明细。质疑损失金额和证明力。"
      }
    ],
    "keywords": [
      [
        "损坏是否由租客造成",
        "入住照片",
        "旧划痕",
        "入住当天同一墙面已经存在浅色横向划痕"
      ],
      [
        "房东是否有权扣除全部押金",
        "微信确认",
        "墙面本来就有痕",
        "房东在聊天中先于争议确认墙面原本已有痕迹"
      ],
      [
        "维修金额是否有证据",
        "合同第5条",
        "7日退还押金",
        "无违约且无损坏时",
        "房东应在7日内全额退还押金"
      ]
    ],
    "adversary": [
      "请围绕“损坏是否由租客造成”回应。尽量反驳原告：强调划痕由租客造成、维修确有真实损失、合同“无损坏”是扣款前提，但不得编造不存在的证据。 被告方代理人（房东李某的律师），强硬、专业、会在证据细节上较真的对手。",
      "请围绕“房东是否有权扣除全部押金”回应。尽量反驳原告：强调划痕由租客造成、维修确有真实损失、合同“无损坏”是扣款前提，但不得编造不存在的证据。",
      "请围绕“维修金额是否有证据”回应。尽量反驳原告：强调划痕由租客造成、维修确有真实损失、合同“无损坏”是扣款前提，但不得编造不存在的证据。"
    ],
    "judgment": {
      "award": "建议房东退还押金 2500 元；其余 500 元需有合理清洁或维修凭证。",
      "reasoning": "原告已就损坏形成时间与押金返还条件提供相互印证材料；房东对 2500 元维修损失的证明不足，全部扣留押金缺少充分依据。",
      "sources": [
        {
          "title": "《中华人民共和国民法典》第 710 条：合理使用损耗不担责",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://www.court.gov.cn/zixun/xiangqing/233181.html",
          "status": "训练用法律检索线索 · 请核验现行文本"
        },
        {
          "title": "《中华人民共和国民法典》第 713 条：维修义务与费用负担",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://www.court.gov.cn/zixun/xiangqing/233181.html",
          "status": "训练用法律检索线索 · 请核验现行文本"
        }
      ]
    }
  },
  {
    "id": "eazo-online-refund-002",
    "levelId": 12,
    "levelTitle": "网购退货之争",
    "desc": "EAZO 导入 · 网络购物合同纠纷",
    "title": "网购退货之争：七天无理由为何被拒？",
    "type": "网络购物合同纠纷",
    "difficulty": 2,
    "playerSide": "原告 · 买家王某",
    "opponentSide": "被告 · 电商商家",
    "goal": "证明商品属可七天无理由退货情形，且商家拒绝退货没有合同与法律依据。",
    "summary": "案件：买家购买普通针织开衫后第 4 天申请七天无理由退货，商家称该商品属“定制不支持退换”而拒收。",
    "actionPoints": 6,
    "focus": [
      "商品是否适用“七天无理由退货”",
      "是否属于商家声明的“定作/鲜活等不宜退货”例外",
      "退货运费与完好标准的认定"
    ],
    "scenes": [
      {
        "id": "eazo-online-refund-002-scene-phone-orders",
        "title": "场景一 · 手机订单",
        "description": "购买页面、平台规则和交易快照能还原下单时的承诺与提示。",
        "hotspots": [
          {
            "id": "eazo-online-refund-002-scene-hotspot-order",
            "title": "订单快照",
            "icon": "🛒",
            "evidenceId": "eazo-online-refund-002-evidence-l2-order",
            "hint": "页面并未提示“不支持七天无理由”。"
          },
          {
            "id": "eazo-online-refund-002-scene-hotspot-notice",
            "title": "商家承诺",
            "icon": "📌",
            "evidenceId": "eazo-online-refund-002-evidence-l2-notice",
            "hint": "商品页写有“支持七天无理由退换”。"
          }
        ]
      },
      {
        "id": "eazo-online-refund-002-scene-delivery-desk",
        "title": "场景二 · 收货现场",
        "description": "签收、开箱、穿着与返件记录记录商品状态与时间线。",
        "hotspots": [
          {
            "id": "eazo-online-refund-002-scene-hotspot-opening",
            "title": "开箱视频",
            "icon": "📹",
            "evidenceId": "eazo-online-refund-002-evidence-l2-opening",
            "hint": "全程未拆吊牌，仅试穿一次。"
          },
          {
            "id": "eazo-online-refund-002-scene-hotspot-return",
            "title": "返件物流",
            "icon": "📦",
            "evidenceId": "eazo-online-refund-002-evidence-l2-return",
            "hint": "收货后第 4 天已寄回，商家拒收。"
          }
        ]
      }
    ],
    "documents": [
      {
        "id": "eazo-online-refund-002-document-l2-doc-page",
        "name": "商品购买页面快照",
        "type": "doc",
        "content": "【虚构训练材料】\n商品：针织开衫（非定制、非现制、非鲜活）。\n页面标注：支持七天无理由退换，运费险已投保。\n签收之日起 7 日内可申请退货，商品需不影响二次销售。",
        "hotspots": [
          {
            "id": "eazo-online-refund-002-source-l2-hs-page",
            "evidenceId": "eazo-online-refund-002-evidence-l2-notice",
            "label": "商家明示支持七天无理由"
          },
          {
            "id": "eazo-online-refund-002-source-eazo-online-refund-002-evidence-l2-order",
            "evidenceId": "eazo-online-refund-002-evidence-l2-order",
            "label": "证据定位：订单交易快照"
          }
        ]
      },
      {
        "id": "eazo-online-refund-002-document-l2-doc-log",
        "name": "物流与申请记录",
        "type": "chat",
        "content": "【虚构训练材料】\n2026-03-02 收货并签收\n2026-03-04 申请七天无理由退货\n2026-03-04 商家驳回：称该款为“特殊定制，不支持退换”\n2026-03-05 买家将商品原样寄回，商家拒收退回。",
        "hotspots": [
          {
            "id": "eazo-online-refund-002-source-l2-hs-log",
            "evidenceId": "eazo-online-refund-002-evidence-l2-return",
            "label": "第 4 天寄回且被拒收"
          },
          {
            "id": "eazo-online-refund-002-source-eazo-online-refund-002-evidence-l2-opening",
            "evidenceId": "eazo-online-refund-002-evidence-l2-opening",
            "label": "证据定位：开箱视频：吊牌未拆"
          }
        ]
      }
    ],
    "evidence": [
      {
        "id": "eazo-online-refund-002-evidence-l2-order",
        "title": "订单交易快照",
        "type": "document",
        "sourceDocumentId": "eazo-online-refund-002-document-l2-doc-page",
        "sourceRange": "订单信息",
        "description": "购买时间、金额与所选尺码颜色均与页面一致。",
        "proofPurpose": "证明双方成立网购合同及商品属性。",
        "authenticity": "交易平台快照",
        "relevance": "高",
        "credibility": 8
      },
      {
        "id": "eazo-online-refund-002-evidence-l2-notice",
        "title": "商家“七天无理由”承诺",
        "type": "document",
        "sourceDocumentId": "eazo-online-refund-002-document-l2-doc-page",
        "sourceRange": "商品页公告",
        "description": "页面明确标注支持七天无理由退货。",
        "proofPurpose": "证明承诺与可退货属性。",
        "authenticity": "页面快照",
        "relevance": "高",
        "credibility": 9
      },
      {
        "id": "eazo-online-refund-002-evidence-l2-opening",
        "title": "开箱视频：吊牌未拆",
        "type": "video",
        "sourceDocumentId": "eazo-online-refund-002-document-l2-doc-log",
        "sourceRange": "视频元数据",
        "description": "全程录制开箱与试穿，吊牌保持完整。",
        "proofPurpose": "证明商品完好、未影响二次销售。",
        "authenticity": "含连续时间戳",
        "relevance": "中",
        "credibility": 7
      },
      {
        "id": "eazo-online-refund-002-evidence-l2-return",
        "title": "返件与拒收物流",
        "type": "log",
        "sourceDocumentId": "eazo-online-refund-002-document-l2-doc-log",
        "sourceRange": "退货申请记录",
        "description": "签收后第 4 天申请并寄回，被商家以“定制”为由拒收。",
        "proofPurpose": "证明在法定期限内主张且商家无正当理由拒绝。",
        "authenticity": "平台记录",
        "relevance": "高",
        "credibility": 8
      }
    ],
    "keyEvidenceIds": [
      "eazo-online-refund-002-evidence-l2-notice",
      "eazo-online-refund-002-evidence-l2-opening",
      "eazo-online-refund-002-evidence-l2-return"
    ],
    "cards": [
      {
        "id": "recorded",
        "name": "已为您记录",
        "type": "damage",
        "cost": 1,
        "value": 2,
        "hint": "用原件固定关键事实",
        "text": "依据「商家“七天无理由”承诺」：页面明确标注支持七天无理由退货。证明承诺与可退货属性。"
      },
      {
        "id": "verify",
        "name": "正在核实",
        "type": "damage",
        "cost": 2,
        "value": 4,
        "hint": "核对争议材料的证明力",
        "text": "依据「开箱视频：吊牌未拆」：全程录制开箱与试穿，吊牌保持完整。证明商品完好、未影响二次销售。"
      },
      {
        "id": "script",
        "name": "标准话术",
        "type": "defense",
        "cost": 1,
        "value": 2,
        "hint": "护盾 +3，回复一点精力",
        "text": "依据「返件与拒收物流」：签收后第 4 天申请并寄回，被商家以“定制”为由拒收。证明在法定期限内主张且商家无正当理由拒绝。"
      },
      {
        "id": "question",
        "name": "交叉质询",
        "type": "damage",
        "cost": 3,
        "value": 7,
        "hint": "围绕本案争点串联证据",
        "text": "依据「商家“七天无理由”承诺」：页面明确标注支持七天无理由退货。证明承诺与可退货属性。"
      }
    ],
    "keywords": [
      [
        "商品是否适用“七天无理由退货”",
        "商品是否适用",
        "七天无理由退货",
        "订单交易快照",
        "购买时间",
        "金额与所选尺码颜色均与页面一致"
      ],
      [
        "是否属于商家声明的“定作/鲜活等不宜退货”例外",
        "是否属于商家声明的",
        "定作",
        "鲜活等不宜退货",
        "例外",
        "商家",
        "七天无理由",
        "承诺",
        "页面明确标注支持七天无理由退货"
      ],
      [
        "退货运费与完好标准的认定",
        "开箱视频",
        "吊牌未拆",
        "全程录制开箱与试穿",
        "吊牌保持完整"
      ]
    ],
    "adversary": [
      "请围绕“商品是否适用“七天无理由退货””回应。辩称：商品虽非完全定制，但按买家要求选了颜色尺码；开箱即影响二次销售；以“定制”为由拒绝退货。不得编造页面没有的例外提示。 被告电商商家的代理律师，话术圆滑、爱把商品往“定制/易损”例外上靠。",
      "请围绕“是否属于商家声明的“定作/鲜活等不宜退货”例外”回应。辩称：商品虽非完全定制，但按买家要求选了颜色尺码；开箱即影响二次销售；以“定制”为由拒绝退货。不得编造页面没有的例外提示。",
      "请围绕“退货运费与完好标准的认定”回应。辩称：商品虽非完全定制，但按买家要求选了颜色尺码；开箱即影响二次销售；以“定制”为由拒绝退货。不得编造页面没有的例外提示。"
    ],
    "judgment": {
      "award": "商家应接收退货并全额退款；因退货系商家无正当理由拒绝所致，运费由商家承担。",
      "reasoning": "普通成衣不属于法定不适用七日无理由退货的商品，商家亦未在页面对“该款不支持”作事先显著提示，其以“定制”为由拒收缺乏依据；商品吊牌完整、未影响二次销售。",
      "sources": [
        {
          "title": "《消费者权益保护法》第 25 条：网络购物七日无理由退货",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://flk.npc.gov.cn/",
          "status": "训练用法律检索线索 · 请核验现行文本"
        },
        {
          "title": "《消费者权益保护法》第 24 条：不符合质量要求的退货义务",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://flk.npc.gov.cn/",
          "status": "训练用法律检索线索 · 请核验现行文本"
        }
      ]
    }
  },
  {
    "id": "eazo-labor-wage-003",
    "levelId": 13,
    "levelTitle": "离职工资之争",
    "desc": "EAZO 导入 · 劳动争议",
    "title": "离职工资之争：月末结算是扣薪吗？",
    "type": "劳动争议",
    "difficulty": 3,
    "playerSide": "原告 · 前员工小陈",
    "opponentSide": "被告 · 某科技公司",
    "goal": "证明公司以“未办完交接”为由克扣离职当月工资与加班费没有依据。",
    "summary": "案件：员工离职后公司以“交接未完全清楚”为由，只发当月一半工资，并称加班费已包含在绩效中。",
    "actionPoints": 6,
    "focus": [
      "离职当月工资是否足额支付",
      "加班费是否被计入并依法计算",
      "公司能否以交接未完成扣发工资"
    ],
    "scenes": [
      {
        "id": "eazo-labor-wage-003-scene-hr-office",
        "title": "场景一 · 人力办公室",
        "description": "劳动合同、考勤制度和离职交接表决定工资的核算口径。",
        "hotspots": [
          {
            "id": "eazo-labor-wage-003-scene-hotspot-contract",
            "title": "劳动合同",
            "icon": "📄",
            "evidenceId": "eazo-labor-wage-003-evidence-l3-contract",
            "hint": "约定月薪结构与标准工时。"
          },
          {
            "id": "eazo-labor-wage-003-scene-hotspot-leave",
            "title": "离职交接单",
            "icon": "🗂️",
            "evidenceId": "eazo-labor-wage-003-evidence-l3-leave",
            "hint": "交接已完成并由部门主管签字。"
          }
        ]
      },
      {
        "id": "eazo-labor-wage-003-scene-payroll",
        "title": "场景二 · 工资条",
        "description": "考勤记录、工资条和催薪聊天揭示实发与应发的差异。",
        "hotspots": [
          {
            "id": "eazo-labor-wage-003-scene-hotspot-att",
            "title": "考勤加班记录",
            "icon": "⏱️",
            "evidenceId": "eazo-labor-wage-003-evidence-l3-att",
            "hint": "离职月含 12 小时加班但未计加班费。"
          },
          {
            "id": "eazo-labor-wage-003-scene-hotspot-chat",
            "title": "催薪沟通",
            "icon": "💬",
            "evidenceId": "eazo-labor-wage-003-evidence-l3-chat",
            "hint": "公司口头说“交接未完，工资先扣一半”。"
          }
        ]
      }
    ],
    "documents": [
      {
        "id": "eazo-labor-wage-003-document-l3-doc-contract",
        "name": "劳动合同（节选）",
        "type": "doc",
        "content": "【虚构训练材料】\n月工资：基本工资 7000 元。\n工时：标准工时制，加班依法支付加班费。\n离职：按实际工作日至离职日结算工资。",
        "hotspots": [
          {
            "id": "eazo-labor-wage-003-source-l3-hs-contract",
            "evidenceId": "eazo-labor-wage-003-evidence-l3-contract",
            "label": "约定按实结算并支付加班费"
          },
          {
            "id": "eazo-labor-wage-003-source-eazo-labor-wage-003-evidence-l3-att",
            "evidenceId": "eazo-labor-wage-003-evidence-l3-att",
            "label": "证据定位：考勤与加班记录"
          }
        ]
      },
      {
        "id": "eazo-labor-wage-003-document-l3-doc-chat",
        "name": "HR 沟通与交接记录",
        "type": "chat",
        "content": "【虚构训练材料】\n2026-05-20 小陈提交辞职并完成交接，主管签字确认。\n2026-05-31 HR：你交接还没“完全清楚”，当月工资先发一半。\n2026-06-05 小陈：已完成交接并有签字，请足额支付。",
        "hotspots": [
          {
            "id": "eazo-labor-wage-003-source-l3-hs-chat",
            "evidenceId": "eazo-labor-wage-003-evidence-l3-chat",
            "label": "公司以交接未完克扣工资"
          },
          {
            "id": "eazo-labor-wage-003-source-eazo-labor-wage-003-evidence-l3-leave",
            "evidenceId": "eazo-labor-wage-003-evidence-l3-leave",
            "label": "证据定位：离职交接单（已签字）"
          }
        ]
      }
    ],
    "evidence": [
      {
        "id": "eazo-labor-wage-003-evidence-l3-contract",
        "title": "劳动合同：按实结算",
        "type": "document",
        "sourceDocumentId": "eazo-labor-wage-003-document-l3-doc-contract",
        "sourceRange": "工资与离职条款",
        "description": "约定按实际工作日结算并支付加班费。",
        "proofPurpose": "证明工资核算口径与加班支付义务。",
        "authenticity": "合同原件",
        "relevance": "高",
        "credibility": 9
      },
      {
        "id": "eazo-labor-wage-003-evidence-l3-leave",
        "title": "离职交接单（已签字）",
        "type": "document",
        "sourceDocumentId": "eazo-labor-wage-003-document-l3-doc-chat",
        "sourceRange": "2026-05-20",
        "description": "工作、账号与物品均已交接并由主管签字确认。",
        "proofPurpose": "反驳“交接未完”的抗辩。",
        "authenticity": "有签字",
        "relevance": "高",
        "credibility": 8
      },
      {
        "id": "eazo-labor-wage-003-evidence-l3-att",
        "title": "考勤与加班记录",
        "type": "document",
        "sourceDocumentId": "eazo-labor-wage-003-document-l3-doc-contract",
        "sourceRange": "考勤系统导出",
        "description": "离职当月加班 12 小时，工资条未计加班费。",
        "proofPurpose": "证明加班事实与欠付金额。",
        "authenticity": "考勤导出",
        "relevance": "中",
        "credibility": 7
      },
      {
        "id": "eazo-labor-wage-003-evidence-l3-chat",
        "title": "HR 克扣工资的沟通",
        "type": "chat",
        "sourceDocumentId": "eazo-labor-wage-003-document-l3-doc-chat",
        "sourceRange": "2026-05-31",
        "description": "公司自称交接未完，先行克扣当月一半工资。",
        "proofPurpose": "证明克扣行为与理由不具有合法性。",
        "authenticity": "含上下文",
        "relevance": "高",
        "credibility": 8
      }
    ],
    "keyEvidenceIds": [
      "eazo-labor-wage-003-evidence-l3-contract",
      "eazo-labor-wage-003-evidence-l3-leave",
      "eazo-labor-wage-003-evidence-l3-att"
    ],
    "cards": [
      {
        "id": "recorded",
        "name": "已为您记录",
        "type": "damage",
        "cost": 1,
        "value": 2,
        "hint": "用原件固定关键事实",
        "text": "依据「劳动合同：按实结算」：约定按实际工作日结算并支付加班费。证明工资核算口径与加班支付义务。"
      },
      {
        "id": "verify",
        "name": "正在核实",
        "type": "damage",
        "cost": 2,
        "value": 4,
        "hint": "核对争议材料的证明力",
        "text": "依据「离职交接单（已签字）」：工作、账号与物品均已交接并由主管签字确认。反驳“交接未完”的抗辩。"
      },
      {
        "id": "script",
        "name": "标准话术",
        "type": "defense",
        "cost": 1,
        "value": 2,
        "hint": "护盾 +3，回复一点精力",
        "text": "依据「考勤与加班记录」：离职当月加班 12 小时，工资条未计加班费。证明加班事实与欠付金额。"
      },
      {
        "id": "question",
        "name": "交叉质询",
        "type": "damage",
        "cost": 3,
        "value": 7,
        "hint": "围绕本案争点串联证据",
        "text": "依据「劳动合同：按实结算」：约定按实际工作日结算并支付加班费。证明工资核算口径与加班支付义务。"
      }
    ],
    "keywords": [
      [
        "离职当月工资是否足额支付",
        "劳动合同",
        "按实结算",
        "约定按实际工作日结算并支付加班费"
      ],
      [
        "加班费是否被计入并依法计算",
        "离职交接单",
        "已签字",
        "工作",
        "账号与物品均已交接并由主管签字确认"
      ],
      [
        "公司能否以交接未完成扣发工资",
        "考勤与加班记录",
        "离职当月加班",
        "12",
        "小时",
        "工资条未计加班费"
      ]
    ],
    "adversary": [
      "请围绕“离职当月工资是否足额支付”回应。辩称：交接未完成影响项目交付；当月工资按公司制度分两期发，未到期；加班系自行安排且已折算绩效。不得捏造交接不合格的书面记录。 被告公司代理律师，喜欢把欠薪包装成“交接管理”与“绩效结算”。",
      "请围绕“加班费是否被计入并依法计算”回应。辩称：交接未完成影响项目交付；当月工资按公司制度分两期发，未到期；加班系自行安排且已折算绩效。不得捏造交接不合格的书面记录。",
      "请围绕“公司能否以交接未完成扣发工资”回应。辩称：交接未完成影响项目交付；当月工资按公司制度分两期发，未到期；加班系自行安排且已折算绩效。不得捏造交接不合格的书面记录。"
    ],
    "judgment": {
      "award": "公司应支付当月剩余工资及 12 小时加班费；交接完成证据在卷，不得再以交接为由克扣。",
      "reasoning": "交接单已由主管签字，公司“交接未完”抗辩无书面证据支撑；工资应按实结算，克扣一半工资与不付加班费均缺乏依据。",
      "sources": [
        {
          "title": "《中华人民共和国劳动合同法》第 30 条：按时足额支付劳动报酬",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://flk.npc.gov.cn/",
          "status": "训练用法律检索线索 · 请核验现行文本"
        },
        {
          "title": "《中华人民共和国劳动法》第 44 条：延长工作时间支付加班费",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://flk.npc.gov.cn/",
          "status": "训练用法律检索线索 · 请核验现行文本"
        }
      ]
    }
  },
  {
    "id": "eazo-house-sale-004",
    "levelId": 14,
    "levelTitle": "购房尾款之争",
    "desc": "EAZO 导入 · 房屋买卖合同纠纷",
    "title": "购房尾款之争：面积缩水谁担责？",
    "type": "房屋买卖合同纠纷",
    "difficulty": 4,
    "playerSide": "原告 · 买受人刘女士",
    "opponentSide": "被告 · 开发商某置业公司",
    "goal": "主张按合同面积条款与测绘结果核减总价，开发商以“交房视为认可”抗辩不能成立。",
    "summary": "案件：商品房实测面积比合同约定少约 3.2%，买受人要求核减尾款；开发商主张已交房并签字，应照约定面积付款。",
    "actionPoints": 6,
    "focus": [
      "实测面积与合同约定面积差异的处理",
      "交房签字能否视为放弃面积异议",
      "尾款支付义务与面积差价的抵销"
    ],
    "scenes": [
      {
        "id": "eazo-house-sale-004-scene-sales",
        "title": "场景一 · 售楼处",
        "description": "认购书、补充协议与房管部门面积测绘报告还原约定面积。",
        "hotspots": [
          {
            "id": "eazo-house-sale-004-scene-hotspot-contract",
            "title": "购房合同",
            "icon": "📐",
            "evidenceId": "eazo-house-sale-004-evidence-l4-contract",
            "hint": "约定建筑面积及差异处理办法。"
          },
          {
            "id": "eazo-house-sale-004-scene-hotspot-survey",
            "title": "面积测绘报告",
            "icon": "📏",
            "evidenceId": "eazo-house-sale-004-evidence-l4-survey",
            "hint": "实测面积比合同少约 3.2%。"
          }
        ]
      },
      {
        "id": "eazo-house-sale-004-scene-handover",
        "title": "场景二 · 交房现场",
        "description": "交房确认书与催款通知决定是否存在“认可”与结算依据。",
        "hotspots": [
          {
            "id": "eazo-house-sale-004-scene-hotspot-confirm",
            "title": "交房确认书",
            "icon": "🖊️",
            "evidenceId": "eazo-house-sale-004-evidence-l4-confirm",
            "hint": "备注栏写明“面积争议另按测绘结算”。"
          },
          {
            "id": "eazo-house-sale-004-scene-hotspot-demand",
            "title": "催付尾款函",
            "icon": "📩",
            "evidenceId": "eazo-house-sale-004-evidence-l4-demand",
            "hint": "开发商仍按合同面积要求补足尾款。"
          }
        ]
      }
    ],
    "documents": [
      {
        "id": "eazo-house-sale-004-document-l4-doc-contract",
        "name": "商品房买卖合同（节选）",
        "type": "doc",
        "content": "【虚构训练材料】\n约定建筑面积 89.0 平方米。\n面积差异处理：实测面积与约定面积误差比超过 3% 时，买受人有权按实测面积结算或解除合同。\n尾款于交房后 30 日内付清。",
        "hotspots": [
          {
            "id": "eazo-house-sale-004-source-l4-hs-contract",
            "evidenceId": "eazo-house-sale-004-evidence-l4-contract",
            "label": "面积差异按实测结算条款"
          },
          {
            "id": "eazo-house-sale-004-source-eazo-house-sale-004-evidence-l4-survey",
            "evidenceId": "eazo-house-sale-004-evidence-l4-survey",
            "label": "证据定位：房管测绘：面积缩水"
          }
        ]
      },
      {
        "id": "eazo-house-sale-004-document-l4-doc-letter",
        "name": "交房与催款文件",
        "type": "doc",
        "content": "【虚构训练材料】\n交房确认书备注：本次验收不包括面积争议，面积差按房管测绘另行结算。\n开发商催款函：要求按 89.0 平方米补足尾款 6 万元，否则逾期违约金每日 0.05%。",
        "hotspots": [
          {
            "id": "eazo-house-sale-004-source-l4-hs-letter",
            "evidenceId": "eazo-house-sale-004-evidence-l4-demand",
            "label": "开发商仍按约定面积催款"
          },
          {
            "id": "eazo-house-sale-004-source-eazo-house-sale-004-evidence-l4-confirm",
            "evidenceId": "eazo-house-sale-004-evidence-l4-confirm",
            "label": "证据定位：交房确认书备注"
          }
        ]
      }
    ],
    "evidence": [
      {
        "id": "eazo-house-sale-004-evidence-l4-contract",
        "title": "合同面积差异条款",
        "type": "document",
        "sourceDocumentId": "eazo-house-sale-004-document-l4-doc-contract",
        "sourceRange": "面积与结算条款",
        "description": "约定按实测面积结算及解除权。",
        "proofPurpose": "确立面积差异结算依据。",
        "authenticity": "合同原件",
        "relevance": "高",
        "credibility": 9
      },
      {
        "id": "eazo-house-sale-004-evidence-l4-survey",
        "title": "房管测绘：面积缩水",
        "type": "document",
        "sourceDocumentId": "eazo-house-sale-004-document-l4-doc-contract",
        "sourceRange": "测绘成果",
        "description": "实测面积 86.1 ㎡，较约定少约 3.2%。",
        "proofPurpose": "量化面积差与应核减金额。",
        "authenticity": "测绘报告",
        "relevance": "高",
        "credibility": 9
      },
      {
        "id": "eazo-house-sale-004-evidence-l4-confirm",
        "title": "交房确认书备注",
        "type": "document",
        "sourceDocumentId": "eazo-house-sale-004-document-l4-doc-letter",
        "sourceRange": "备注栏",
        "description": "明确面积争议另按测绘结算，不因签字而放弃。",
        "proofPurpose": "反驳“交房即认可”抗辩。",
        "authenticity": "双方盖章",
        "relevance": "高",
        "credibility": 8
      },
      {
        "id": "eazo-house-sale-004-evidence-l4-demand",
        "title": "催付尾款函",
        "type": "document",
        "sourceDocumentId": "eazo-house-sale-004-document-l4-doc-letter",
        "sourceRange": "函件正文",
        "description": "仍按合同 89 ㎡ 补收尾款并计违约金。",
        "proofPurpose": "证明开发商坚持按原面积结算。",
        "authenticity": "函件原件",
        "relevance": "中",
        "credibility": 7
      }
    ],
    "keyEvidenceIds": [
      "eazo-house-sale-004-evidence-l4-contract",
      "eazo-house-sale-004-evidence-l4-survey",
      "eazo-house-sale-004-evidence-l4-confirm"
    ],
    "cards": [
      {
        "id": "recorded",
        "name": "已为您记录",
        "type": "damage",
        "cost": 1,
        "value": 2,
        "hint": "用原件固定关键事实",
        "text": "依据「合同面积差异条款」：约定按实测面积结算及解除权。确立面积差异结算依据。"
      },
      {
        "id": "verify",
        "name": "正在核实",
        "type": "damage",
        "cost": 2,
        "value": 4,
        "hint": "核对争议材料的证明力",
        "text": "依据「房管测绘：面积缩水」：实测面积 86.1 ㎡，较约定少约 3.2%。量化面积差与应核减金额。"
      },
      {
        "id": "script",
        "name": "标准话术",
        "type": "defense",
        "cost": 1,
        "value": 2,
        "hint": "护盾 +3，回复一点精力",
        "text": "依据「交房确认书备注」：明确面积争议另按测绘结算，不因签字而放弃。反驳“交房即认可”抗辩。"
      },
      {
        "id": "question",
        "name": "交叉质询",
        "type": "damage",
        "cost": 3,
        "value": 7,
        "hint": "围绕本案争点串联证据",
        "text": "依据「合同面积差异条款」：约定按实测面积结算及解除权。确立面积差异结算依据。"
      }
    ],
    "keywords": [
      [
        "实测面积与合同约定面积差异的处理",
        "合同面积差异条款",
        "约定按实测面积结算及解除权"
      ],
      [
        "交房签字能否视为放弃面积异议",
        "房管测绘",
        "面积缩水",
        "实测面积",
        "86.1",
        "较约定少约",
        "3.2%"
      ],
      [
        "尾款支付义务与面积差价的抵销",
        "交房确认书备注",
        "明确面积争议另按测绘结算",
        "不因签字而放弃"
      ]
    ],
    "adversary": [
      "请围绕“实测面积与合同约定面积差异的处理”回应。辩称：面积差异属正常误差；交房签字即视为验收认可；3% 内应由双方协商，不应直接拒付尾款。不得否认交房确认书的备注内容。 被告开发商的代理律师，主打“验房签字即验收合格、面积小事不影响交房”。",
      "请围绕“交房签字能否视为放弃面积异议”回应。辩称：面积差异属正常误差；交房签字即视为验收认可；3% 内应由双方协商，不应直接拒付尾款。不得否认交房确认书的备注内容。",
      "请围绕“尾款支付义务与面积差价的抵销”回应。辩称：面积差异属正常误差；交房签字即视为验收认可；3% 内应由双方协商，不应直接拒付尾款。不得否认交房确认书的备注内容。"
    ],
    "judgment": {
      "award": "尾款应按实测面积结算并扣减差价；开发商无权就差价部分主张违约金。",
      "reasoning": "合同明确约定面积差异按实测结算，交房确认书又备注面积争议另按测绘处理，故交房签字不构成放弃面积异议；差价应从尾款中扣减。",
      "sources": [
        {
          "title": "《中华人民共和国民法典》第 509 条：按约定全面履行",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://www.court.gov.cn/zixun/xiangqing/233181.html",
          "status": "训练用法律检索线索 · 请核验现行文本"
        },
        {
          "title": "《最高人民法院关于审理商品房买卖合同纠纷…的解释》面积误差处理规则",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://flk.npc.gov.cn/",
          "status": "训练用法律检索线索 · 请核验现行文本"
        }
      ]
    }
  },
  {
    "id": "eazo-loan-005",
    "levelId": 15,
    "levelTitle": "转账之争",
    "desc": "EAZO 导入 · 民间借贷纠纷",
    "title": "转账之争：是借款还是赠与？",
    "type": "民间借贷纠纷",
    "difficulty": 5,
    "playerSide": "原告 · 出借人方先生",
    "opponentSide": "被告 · 收款人周某",
    "goal": "证明多笔大额转账系借款而非赠与或投资，周某应予返还。",
    "summary": "案件：方先生向周某转账 20 万元，周某签有借条；周某辩称款项实为项目投资分红，并非借款。",
    "actionPoints": 6,
    "focus": [
      "转账的款项性质（借款/赠与/投资）",
      "是否存在借贷合意",
      "金额与利息的认定"
    ],
    "scenes": [
      {
        "id": "eazo-loan-005-scene-bank",
        "title": "场景一 · 银行流水",
        "description": "转账记录与备注、聊天沟通能还原款项的真实性质。",
        "hotspots": [
          {
            "id": "eazo-loan-005-scene-hotspot-transfer",
            "title": "转账流水",
            "icon": "🏦",
            "evidenceId": "eazo-loan-005-evidence-l5-transfer",
            "hint": "多笔合计 20 万元，备注“借款”。"
          },
          {
            "id": "eazo-loan-005-scene-hotspot-chat",
            "title": "聊天记录",
            "icon": "💬",
            "evidenceId": "eazo-loan-005-evidence-l5-chat",
            "hint": "周某说“钱我过两个月还你”。"
          }
        ]
      },
      {
        "id": "eazo-loan-005-scene-home",
        "title": "场景二 · 借条桌",
        "description": "借条与催款记录决定是否成立借贷关系与返还期限。",
        "hotspots": [
          {
            "id": "eazo-loan-005-scene-hotspot-iou",
            "title": "借条",
            "icon": "📜",
            "evidenceId": "eazo-loan-005-evidence-l5-iou",
            "hint": "周某签名的借条载明本金与利息。"
          },
          {
            "id": "eazo-loan-005-scene-hotspot-urge",
            "title": "催款记录",
            "icon": "⏰",
            "evidenceId": "eazo-loan-005-evidence-l5-urge",
            "hint": "到期后多次催讨未果。"
          }
        ]
      }
    ],
    "documents": [
      {
        "id": "eazo-loan-005-document-l5-doc-chat",
        "name": "微信聊天记录",
        "type": "chat",
        "content": "【虚构训练材料】\n2025-09-01 方：你需要周转我先转给你，回头记得还。\n2025-09-01 周：谢谢哥，钱我过两个月一定还。\n2025-09-02 方：转了 20 万，你查收。",
        "hotspots": [
          {
            "id": "eazo-loan-005-source-l5-hs-chat",
            "evidenceId": "eazo-loan-005-evidence-l5-chat",
            "label": "周某承诺两月后归还"
          },
          {
            "id": "eazo-loan-005-source-eazo-loan-005-evidence-l5-transfer",
            "evidenceId": "eazo-loan-005-evidence-l5-transfer",
            "label": "证据定位：转账流水：20 万元"
          }
        ]
      },
      {
        "id": "eazo-loan-005-document-l5-doc-iou",
        "name": "借条",
        "type": "doc",
        "content": "【虚构训练材料】\n借条：今借到方先生人民币贰拾万元整（¥200,000），借款期限两个月，月息 1%，2025-11-02 前归还。借款人：周某。",
        "hotspots": [
          {
            "id": "eazo-loan-005-source-l5-hs-iou",
            "evidenceId": "eazo-loan-005-evidence-l5-iou",
            "label": "借条载明金额、期限与利息"
          },
          {
            "id": "eazo-loan-005-source-eazo-loan-005-evidence-l5-urge",
            "evidenceId": "eazo-loan-005-evidence-l5-urge",
            "label": "证据定位：催款记录"
          }
        ]
      }
    ],
    "evidence": [
      {
        "id": "eazo-loan-005-evidence-l5-transfer",
        "title": "转账流水：20 万元",
        "type": "payment",
        "sourceDocumentId": "eazo-loan-005-document-l5-doc-chat",
        "sourceRange": "2025-09-02",
        "description": "出借方转账 20 万元，附言“借款”。",
        "proofPurpose": "证明款项实际交付及借款指向。",
        "authenticity": "银行流水",
        "relevance": "高",
        "credibility": 9
      },
      {
        "id": "eazo-loan-005-evidence-l5-chat",
        "title": "微信：承诺归还",
        "type": "chat",
        "sourceDocumentId": "eazo-loan-005-document-l5-doc-chat",
        "sourceRange": "2025-09-01",
        "description": "周某表示“钱过两个月还你”，形成借贷合意。",
        "proofPurpose": "证明双方成立借贷合意。",
        "authenticity": "含上下文",
        "relevance": "高",
        "credibility": 8
      },
      {
        "id": "eazo-loan-005-evidence-l5-iou",
        "title": "借条（签名）",
        "type": "document",
        "sourceDocumentId": "eazo-loan-005-document-l5-doc-iou",
        "sourceRange": "全文",
        "description": "载明金额、两个月期限与月息 1%。",
        "proofPurpose": "证明借贷数额与利率约定。",
        "authenticity": "原件待笔迹核验",
        "relevance": "高",
        "credibility": 8
      },
      {
        "id": "eazo-loan-005-evidence-l5-urge",
        "title": "催款记录",
        "type": "chat",
        "sourceDocumentId": "eazo-loan-005-document-l5-doc-iou",
        "sourceRange": "2025-11-03 起",
        "description": "到期后多次催讨，周某以“再等等”拖延。",
        "proofPurpose": "证明已届清偿期未获清偿。",
        "authenticity": "含时间戳",
        "relevance": "中",
        "credibility": 7
      }
    ],
    "keyEvidenceIds": [
      "eazo-loan-005-evidence-l5-transfer",
      "eazo-loan-005-evidence-l5-chat",
      "eazo-loan-005-evidence-l5-iou"
    ],
    "cards": [
      {
        "id": "recorded",
        "name": "已为您记录",
        "type": "damage",
        "cost": 1,
        "value": 2,
        "hint": "用原件固定关键事实",
        "text": "依据「转账流水：20 万元」：出借方转账 20 万元，附言“借款”。证明款项实际交付及借款指向。"
      },
      {
        "id": "verify",
        "name": "正在核实",
        "type": "damage",
        "cost": 2,
        "value": 4,
        "hint": "核对争议材料的证明力",
        "text": "依据「微信：承诺归还」：周某表示“钱过两个月还你”，形成借贷合意。证明双方成立借贷合意。"
      },
      {
        "id": "script",
        "name": "标准话术",
        "type": "defense",
        "cost": 1,
        "value": 2,
        "hint": "护盾 +3，回复一点精力",
        "text": "依据「借条（签名）」：载明金额、两个月期限与月息 1%。证明借贷数额与利率约定。"
      },
      {
        "id": "question",
        "name": "交叉质询",
        "type": "damage",
        "cost": 3,
        "value": 7,
        "hint": "围绕本案争点串联证据",
        "text": "依据「转账流水：20 万元」：出借方转账 20 万元，附言“借款”。证明款项实际交付及借款指向。"
      }
    ],
    "keywords": [
      [
        "转账的款项性质（借款/赠与/投资）",
        "转账的款项性质",
        "借款",
        "赠与",
        "投资",
        "转账流水",
        "20",
        "万元",
        "出借方转账",
        "附言"
      ],
      [
        "是否存在借贷合意",
        "微信",
        "承诺归还",
        "周某表示",
        "钱过两个月还你",
        "形成借贷合意"
      ],
      [
        "金额与利息的认定",
        "借条",
        "签名",
        "载明金额",
        "两个月期限与月息",
        "1%"
      ]
    ],
    "adversary": [
      "请围绕“转账的款项性质（借款/赠与/投资）”回应。辩称：款项是合伙投资而非借款；转账备注系单方填写；借条签字系被催收压力下所为。不得主张未收到款项。 被告周某的代理律师，善于把借款说成“共同投资或赠与”。",
      "请围绕“是否存在借贷合意”回应。辩称：款项是合伙投资而非借款；转账备注系单方填写；借条签字系被催收压力下所为。不得主张未收到款项。",
      "请围绕“金额与利息的认定”回应。辩称：款项是合伙投资而非借款；转账备注系单方填写；借条签字系被催收压力下所为。不得主张未收到款项。"
    ],
    "judgment": {
      "award": "周某应返还借款本金 20 万元并按借条约定的月息支付利息。",
      "reasoning": "借条、转账流水与聊天记录相互印证，足以认定借贷合意与交付事实；周某“投资/赠与”抗辩无书面协议支撑，不能推翻借条记载。",
      "sources": [
        {
          "title": "《中华人民共和国民法典》第 667 条：借款合同定义",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://www.court.gov.cn/zixun/xiangqing/233181.html",
          "status": "训练用法律检索线索 · 请核验现行文本"
        },
        {
          "title": "《最高人民法院关于审理民间借贷案件适用法律若干问题的规定》第 2 条",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://flk.npc.gov.cn/",
          "status": "训练用法律检索线索 · 请核验现行文本"
        }
      ]
    }
  },
  {
    "id": "eazo-decor-006",
    "levelId": 16,
    "levelTitle": "装修停工之争",
    "desc": "EAZO 导入 · 承揽/装饰装修合同纠纷",
    "title": "装修停工之争：能否解除并退款？",
    "type": "承揽/装饰装修合同纠纷",
    "difficulty": 5,
    "playerSide": "原告 · 业主马女士",
    "opponentSide": "被告 · 某装修公司",
    "goal": "主张装修公司擅自停工、逾期严重构成根本违约，可解除合同并退回未完工部分款项。",
    "summary": "案件：装修公司自 2 月中旬停工，经两次催告仍未复工，工期严重逾期；业主要求解除并退款。",
    "actionPoints": 6,
    "focus": [
      "停工与逾期是否构成根本违约",
      "合同约定的工期与解除条件",
      "已完工程量与应退金额的核算"
    ],
    "scenes": [
      {
        "id": "eazo-decor-006-scene-site",
        "title": "场景一 · 装修现场",
        "description": "现场照片与进度报告显示停工状态与实际完成度。",
        "hotspots": [
          {
            "id": "eazo-decor-006-scene-hotspot-photos",
            "title": "现场进度照片",
            "icon": "🏗️",
            "evidenceId": "eazo-decor-006-evidence-l6-photos",
            "hint": "墙面已停工近两月，多处未完工。"
          },
          {
            "id": "eazo-decor-006-scene-hotspot-report",
            "title": "第三方进度报告",
            "icon": "📊",
            "evidenceId": "eazo-decor-006-evidence-l6-report",
            "hint": "完成度约 35%，工期已超 40 天。"
          }
        ]
      },
      {
        "id": "eazo-decor-006-scene-office",
        "title": "场景二 · 沟通记录",
        "description": "合同工期条款、催告函与公司回复决定违约与解除权。",
        "hotspots": [
          {
            "id": "eazo-decor-006-scene-hotspot-contract",
            "title": "装修合同",
            "icon": "📄",
            "evidenceId": "eazo-decor-006-evidence-l6-contract",
            "hint": "约定工期 60 天及逾期违约金。"
          },
          {
            "id": "eazo-decor-006-scene-hotspot-urge",
            "title": "催告函",
            "icon": "📨",
            "evidenceId": "eazo-decor-006-evidence-l6-urge",
            "hint": "业主两次书面催告复工未果。"
          }
        ]
      }
    ],
    "documents": [
      {
        "id": "eazo-decor-006-document-l6-doc-contract",
        "name": "装修合同（节选）",
        "type": "doc",
        "content": "【虚构训练材料】\n总价 120,000 元，工期自开工起 60 天。\n逾期超过 20 天，业主有权解除合同并主张违约金。\n已完工程量按双方确认的清单结算。",
        "hotspots": [
          {
            "id": "eazo-decor-006-source-l6-hs-contract",
            "evidenceId": "eazo-decor-006-evidence-l6-contract",
            "label": "逾期 20 天可解除条款"
          }
        ]
      },
      {
        "id": "eazo-decor-006-document-l6-doc-urge",
        "name": "催告与回复",
        "type": "chat",
        "content": "【虚构训练材料】\n2026-04-05 业主：请贵司 7 日内复工。\n2026-04-12 业主第二次书面催告。\n2026-04-20 装修公司：人手不足，再宽限一个月。\n现场自 2 月中旬停工至今。",
        "hotspots": [
          {
            "id": "eazo-decor-006-source-l6-hs-urge",
            "evidenceId": "eazo-decor-006-evidence-l6-urge",
            "label": "两次催告后仍未复工"
          },
          {
            "id": "eazo-decor-006-source-eazo-decor-006-evidence-l6-photos",
            "evidenceId": "eazo-decor-006-evidence-l6-photos",
            "label": "证据定位：现场停工照片"
          },
          {
            "id": "eazo-decor-006-source-eazo-decor-006-evidence-l6-report",
            "evidenceId": "eazo-decor-006-evidence-l6-report",
            "label": "证据定位：第三方进度报告"
          }
        ]
      }
    ],
    "evidence": [
      {
        "id": "eazo-decor-006-evidence-l6-contract",
        "title": "工期与解除条款",
        "type": "document",
        "sourceDocumentId": "eazo-decor-006-document-l6-doc-contract",
        "sourceRange": "工期条款",
        "description": "约定工期 60 天，逾期超 20 天可解除。",
        "proofPurpose": "确立工期与解除权依据。",
        "authenticity": "合同原件",
        "relevance": "高",
        "credibility": 9
      },
      {
        "id": "eazo-decor-006-evidence-l6-photos",
        "title": "现场停工照片",
        "type": "img",
        "sourceDocumentId": "eazo-decor-006-document-l6-doc-urge",
        "sourceRange": "2026-04 现场",
        "description": "多处停工未完工，与复工承诺不符。",
        "proofPurpose": "证明停工状态与未履约事实。",
        "authenticity": "含时间戳",
        "relevance": "中",
        "credibility": 7
      },
      {
        "id": "eazo-decor-006-evidence-l6-report",
        "title": "第三方进度报告",
        "type": "document",
        "sourceDocumentId": "eazo-decor-006-document-l6-doc-urge",
        "sourceRange": "2026-04-25",
        "description": "完成度约 35%，累计停工超两月。",
        "proofPurpose": "量化逾期与未完成比例。",
        "authenticity": "第三方出具",
        "relevance": "高",
        "credibility": 8
      },
      {
        "id": "eazo-decor-006-evidence-l6-urge",
        "title": "两次书面催告",
        "type": "document",
        "sourceDocumentId": "eazo-decor-006-document-l6-doc-urge",
        "sourceRange": "2026-04",
        "description": "业主两次限期复工，公司均未复工。",
        "proofPurpose": "证明经催告后仍不履行。",
        "authenticity": "邮寄/电子留痕",
        "relevance": "高",
        "credibility": 8
      }
    ],
    "keyEvidenceIds": [
      "eazo-decor-006-evidence-l6-contract",
      "eazo-decor-006-evidence-l6-report",
      "eazo-decor-006-evidence-l6-urge"
    ],
    "cards": [
      {
        "id": "recorded",
        "name": "已为您记录",
        "type": "damage",
        "cost": 1,
        "value": 2,
        "hint": "用原件固定关键事实",
        "text": "依据「工期与解除条款」：约定工期 60 天，逾期超 20 天可解除。确立工期与解除权依据。"
      },
      {
        "id": "verify",
        "name": "正在核实",
        "type": "damage",
        "cost": 2,
        "value": 4,
        "hint": "核对争议材料的证明力",
        "text": "依据「第三方进度报告」：完成度约 35%，累计停工超两月。量化逾期与未完成比例。"
      },
      {
        "id": "script",
        "name": "标准话术",
        "type": "defense",
        "cost": 1,
        "value": 2,
        "hint": "护盾 +3，回复一点精力",
        "text": "依据「两次书面催告」：业主两次限期复工，公司均未复工。证明经催告后仍不履行。"
      },
      {
        "id": "question",
        "name": "交叉质询",
        "type": "damage",
        "cost": 3,
        "value": 7,
        "hint": "围绕本案争点串联证据",
        "text": "依据「工期与解除条款」：约定工期 60 天，逾期超 20 天可解除。确立工期与解除权依据。"
      }
    ],
    "keywords": [
      [
        "停工与逾期是否构成根本违约",
        "工期与解除条款",
        "约定工期",
        "60",
        "逾期超",
        "20",
        "天可解除"
      ],
      [
        "合同约定的工期与解除条件",
        "现场停工照片",
        "多处停工未完工",
        "与复工承诺不符"
      ],
      [
        "已完工程量与应退金额的核算",
        "第三方进度报告",
        "完成度约",
        "35%",
        "累计停工超两月"
      ]
    ],
    "adversary": [
      "请围绕“停工与逾期是否构成根本违约”回应。辩称：延期系建材与人工普遍紧张所致，非恶意停工；合同解除会致已购材料损失扩大；主张继续履行并宽限工期。不得否认停工与催告事实。 被告装修公司代理律师，强调“行业普遍延期”与“已购材料不可退”。",
      "请围绕“合同约定的工期与解除条件”回应。辩称：延期系建材与人工普遍紧张所致，非恶意停工；合同解除会致已购材料损失扩大；主张继续履行并宽限工期。不得否认停工与催告事实。",
      "请围绕“已完工程量与应退金额的核算”回应。辩称：延期系建材与人工普遍紧张所致，非恶意停工；合同解除会致已购材料损失扩大；主张继续履行并宽限工期。不得否认停工与催告事实。"
    ],
    "judgment": {
      "award": "装修合同解除；公司返还已付未完工部分对应款项并按逾期条款支付违约金。",
      "reasoning": "公司长期停工且经两次书面催告仍不复工，逾期远超合同约定，已构成根本违约，业主依法取得解除权；已完工程量可另行据实结算。",
      "sources": [
        {
          "title": "《中华人民共和国民法典》第 577 条：违约责任",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://www.court.gov.cn/zixun/xiangqing/233181.html",
          "status": "训练用法律检索线索 · 请核验现行文本"
        },
        {
          "title": "《中华人民共和国民法典》第 563 条：法定解除情形",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://www.court.gov.cn/zixun/xiangqing/233181.html",
          "status": "训练用法律检索线索 · 请核验现行文本"
        }
      ]
    }
  },
  {
    "id": "eazo-used-car-007",
    "levelId": 17,
    "levelTitle": "二手车之争",
    "desc": "EAZO 导入 · 买卖合同纠纷",
    "title": "二手车之争：隐瞒事故能否退一赔三？",
    "type": "买卖合同纠纷",
    "difficulty": 6,
    "playerSide": "原告 · 购车人郑先生",
    "opponentSide": "被告 · 二手车商",
    "goal": "主张车商隐瞒重大事故构成欺诈，可撤销合同并请求惩罚性赔偿。",
    "summary": "案件：售前车商承诺“无重大事故”，但第三方检测确认纵梁等结构件有修复，售前 3 个月还有大额碰撞理赔；买受人要求退一赔三。",
    "actionPoints": 6,
    "focus": [
      "车辆是否发生过重大事故",
      "车商是否负有告知义务并隐瞒",
      "是否构成欺诈及赔偿标准"
    ],
    "scenes": [
      {
        "id": "eazo-used-car-007-scene-lot",
        "title": "场景一 · 车行展厅",
        "description": "购车合同与车况承诺书决定车商的告知义务边界。",
        "hotspots": [
          {
            "id": "eazo-used-car-007-scene-hotspot-contract",
            "title": "购车合同",
            "icon": "🚗",
            "evidenceId": "eazo-used-car-007-evidence-l7-contract",
            "hint": "载明“无重大事故”承诺。"
          },
          {
            "id": "eazo-used-car-007-scene-hotspot-promise",
            "title": "车况承诺书",
            "icon": "🪧",
            "evidenceId": "eazo-used-car-007-evidence-l7-promise",
            "hint": "承诺“仅小剐蹭、无结构损伤”。"
          }
        ]
      },
      {
        "id": "eazo-used-car-007-scene-inspect",
        "title": "场景二 · 检测机构",
        "description": "第三方检测与保险出险记录还原车辆真实历史。",
        "hotspots": [
          {
            "id": "eazo-used-car-007-scene-hotspot-detect",
            "title": "第三方检测报告",
            "icon": "🔬",
            "evidenceId": "eazo-used-car-007-evidence-l7-detect",
            "hint": "检测出前纵梁与右前翼子板修复痕迹。"
          },
          {
            "id": "eazo-used-car-007-scene-hotspot-claims",
            "title": "出险理赔记录",
            "icon": "📋",
            "evidenceId": "eazo-used-car-007-evidence-l7-claims",
            "hint": "售前发生重大碰撞理赔。"
          }
        ]
      }
    ],
    "documents": [
      {
        "id": "eazo-used-car-007-document-l7-doc-contract",
        "name": "二手车买卖合同",
        "type": "doc",
        "content": "【虚构训练材料】\n卖方承诺：车辆无重大事故、无泡水、无火烧；里程表真实。\n双方确认车况以第三方检测为准，如存在承诺不符，买受人可要求退车或撤销。",
        "hotspots": [
          {
            "id": "eazo-used-car-007-source-l7-hs-contract",
            "evidenceId": "eazo-used-car-007-evidence-l7-promise",
            "label": "车商承诺无重大事故"
          },
          {
            "id": "eazo-used-car-007-source-eazo-used-car-007-evidence-l7-contract",
            "evidenceId": "eazo-used-car-007-evidence-l7-contract",
            "label": "证据定位：购车合同"
          }
        ]
      },
      {
        "id": "eazo-used-car-007-document-l7-doc-report",
        "name": "检测与出险记录",
        "type": "doc",
        "content": "【虚构训练材料】\n第三方检测：前纵梁变形修复痕迹、右前翼子板更换，判定为重大事故车。\n保险理赔：售前 3 个月发生右前方碰撞，赔付约 6.8 万元。",
        "hotspots": [
          {
            "id": "eazo-used-car-007-source-l7-hs-report",
            "evidenceId": "eazo-used-car-007-evidence-l7-detect",
            "label": "结构件修复判定重大事故"
          },
          {
            "id": "eazo-used-car-007-source-eazo-used-car-007-evidence-l7-claims",
            "evidenceId": "eazo-used-car-007-evidence-l7-claims",
            "label": "证据定位：售前出险记录"
          }
        ]
      }
    ],
    "evidence": [
      {
        "id": "eazo-used-car-007-evidence-l7-contract",
        "title": "购车合同",
        "type": "document",
        "sourceDocumentId": "eazo-used-car-007-document-l7-doc-contract",
        "sourceRange": "车况承诺",
        "description": "合同载明无重大事故承诺。",
        "proofPurpose": "证明车商作出明确质量承诺。",
        "authenticity": "合同原件",
        "relevance": "高",
        "credibility": 9
      },
      {
        "id": "eazo-used-car-007-evidence-l7-promise",
        "title": "车况承诺书",
        "type": "document",
        "sourceDocumentId": "eazo-used-car-007-document-l7-doc-contract",
        "sourceRange": "承诺书",
        "description": "书面承诺“仅小剐蹭、无结构损伤”。",
        "proofPurpose": "证明存在欺诈性虚假陈述。",
        "authenticity": "盖章文件",
        "relevance": "高",
        "credibility": 9
      },
      {
        "id": "eazo-used-car-007-evidence-l7-detect",
        "title": "第三方检测：结构损伤",
        "type": "document",
        "sourceDocumentId": "eazo-used-car-007-document-l7-doc-report",
        "sourceRange": "检测结论",
        "description": "纵梁修复、翼子板更换，判为重大事故车。",
        "proofPurpose": "证明承诺与实况不符。",
        "authenticity": "第三方出具",
        "relevance": "高",
        "credibility": 8
      },
      {
        "id": "eazo-used-car-007-evidence-l7-claims",
        "title": "售前出险记录",
        "type": "log",
        "sourceDocumentId": "eazo-used-car-007-document-l7-doc-report",
        "sourceRange": "理赔记录",
        "description": "售前 3 个月右前方碰撞赔付 6.8 万元。",
        "proofPurpose": "证明车商明知事故仍隐瞒。",
        "authenticity": "保险公司记录",
        "relevance": "高",
        "credibility": 8
      }
    ],
    "keyEvidenceIds": [
      "eazo-used-car-007-evidence-l7-promise",
      "eazo-used-car-007-evidence-l7-detect",
      "eazo-used-car-007-evidence-l7-claims"
    ],
    "cards": [
      {
        "id": "recorded",
        "name": "已为您记录",
        "type": "damage",
        "cost": 1,
        "value": 2,
        "hint": "用原件固定关键事实",
        "text": "依据「车况承诺书」：书面承诺“仅小剐蹭、无结构损伤”。证明存在欺诈性虚假陈述。"
      },
      {
        "id": "verify",
        "name": "正在核实",
        "type": "damage",
        "cost": 2,
        "value": 4,
        "hint": "核对争议材料的证明力",
        "text": "依据「第三方检测：结构损伤」：纵梁修复、翼子板更换，判为重大事故车。证明承诺与实况不符。"
      },
      {
        "id": "script",
        "name": "标准话术",
        "type": "defense",
        "cost": 1,
        "value": 2,
        "hint": "护盾 +3，回复一点精力",
        "text": "依据「售前出险记录」：售前 3 个月右前方碰撞赔付 6.8 万元。证明车商明知事故仍隐瞒。"
      },
      {
        "id": "question",
        "name": "交叉质询",
        "type": "damage",
        "cost": 3,
        "value": 7,
        "hint": "围绕本案争点串联证据",
        "text": "依据「车况承诺书」：书面承诺“仅小剐蹭、无结构损伤”。证明存在欺诈性虚假陈述。"
      }
    ],
    "keywords": [
      [
        "车辆是否发生过重大事故",
        "购车合同",
        "合同载明无重大事故承诺"
      ],
      [
        "车商是否负有告知义务并隐瞒",
        "车况承诺书",
        "书面承诺",
        "仅小剐蹭",
        "无结构损伤"
      ],
      [
        "是否构成欺诈及赔偿标准",
        "第三方检测",
        "结构损伤",
        "纵梁修复",
        "翼子板更换",
        "判为重大事故车"
      ]
    ],
    "adversary": [
      "请围绕“车辆是否发生过重大事故”回应。辩称：结构损伤经整修不影响安全使用，不属“重大事故”通常含义；买家已到场验车、应自行注意；主张不构成欺诈。不得否认承诺书真实性。 被告二手车商代理律师，辩解“小事故不算重大”“买家已看车验车”。",
      "请围绕“车商是否负有告知义务并隐瞒”回应。辩称：结构损伤经整修不影响安全使用，不属“重大事故”通常含义；买家已到场验车、应自行注意；主张不构成欺诈。不得否认承诺书真实性。",
      "请围绕“是否构成欺诈及赔偿标准”回应。辩称：结构损伤经整修不影响安全使用，不属“重大事故”通常含义；买家已到场验车、应自行注意；主张不构成欺诈。不得否认承诺书真实性。"
    ],
    "judgment": {
      "award": "撤销买卖合同、退还车款；车商隐瞒重大事故构成欺诈，依法承担三倍价款的惩罚性赔偿。",
      "reasoning": "车商书面承诺“无重大事故”，却在明知存在结构修复与大额理赔的情况下隐瞒，足以使买受人作出错误意思表示，构成欺诈；检测与出险记录相互印证，证据链完整。",
      "sources": [
        {
          "title": "《中华人民共和国民法典》第 148 条：欺诈可撤销",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://www.court.gov.cn/zixun/xiangqing/233181.html",
          "status": "训练用法律检索线索 · 请核验现行文本"
        },
        {
          "title": "《消费者权益保护法》第 55 条：欺诈惩罚性赔偿",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://flk.npc.gov.cn/",
          "status": "训练用法律检索线索 · 请核验现行文本"
        }
      ]
    }
  },
  {
    "id": "eazo-goods-008",
    "levelId": 18,
    "levelTitle": "验收之争",
    "desc": "EAZO 导入 · 买卖合同纠纷",
    "title": "验收之争：迟延发现的瑕疵谁担责？",
    "type": "买卖合同纠纷",
    "difficulty": 7,
    "playerSide": "原告 · 采购方某制造厂",
    "opponentSide": "被告 · 供应商某机械公司",
    "goal": "证明货物存在隐蔽瑕疵，且已在合理期限内通知，供应商应承担违约责任。",
    "summary": "案件：采购方收货 20 天后称液压阀批量漏油，供应商主张表面验收已过 15 日异议期且使用不当。",
    "actionPoints": 6,
    "focus": [
      "瑕疵是显性还是隐蔽",
      "买方是否在合理期限内通知",
      "质量标准与损失的计算"
    ],
    "scenes": [
      {
        "id": "eazo-goods-008-scene-warehouse",
        "title": "场景一 · 收货仓库",
        "description": "收货单、质检记录与抽样报告显示验收时的状态。",
        "hotspots": [
          {
            "id": "eazo-goods-008-scene-hotspot-receive",
            "title": "收货单",
            "icon": "📦",
            "evidenceId": "eazo-goods-008-evidence-l8-receive",
            "hint": "收货时外观完好并签字。"
          },
          {
            "id": "eazo-goods-008-scene-hotspot-qc",
            "title": "入库抽检记录",
            "icon": "🔍",
            "evidenceId": "eazo-goods-008-evidence-l8-qc",
            "hint": "抽样外观合格，未检测内部参数。"
          }
        ]
      },
      {
        "id": "eazo-goods-008-scene-lab",
        "title": "场景二 · 检测实验室",
        "description": "运行报告、第三方检测与书面通知决定“及时”与否。",
        "hotspots": [
          {
            "id": "eazo-goods-008-scene-hotspot-failure",
            "title": "批量失效报告",
            "icon": "⚙️",
            "evidenceId": "eazo-goods-008-evidence-l8-failure",
            "hint": "使用 20 天后出现批量漏油。"
          },
          {
            "id": "eazo-goods-008-scene-hotspot-notice",
            "title": "质量异议通知",
            "icon": "📨",
            "evidenceId": "eazo-goods-008-evidence-l8-notice",
            "hint": "发现后 3 日内书面通知供应商。"
          }
        ]
      }
    ],
    "documents": [
      {
        "id": "eazo-goods-008-document-l8-doc-contract",
        "name": "买卖合同（节选）",
        "type": "doc",
        "content": "【虚构训练材料】\n货物：液压阀 500 件。\n质量：出厂须经压力与密封检测，漏油率≤0.1%。\n买方应在收货后 15 日内就表面质量提出异议；隐蔽瑕疵在发现后合理期限内通知仍可主张。",
        "hotspots": [
          {
            "id": "eazo-goods-008-source-l8-hs-contract",
            "evidenceId": "eazo-goods-008-evidence-l8-qc",
            "label": "表面 15 日、隐蔽合理期限条款"
          },
          {
            "id": "eazo-goods-008-source-eazo-goods-008-evidence-l8-receive",
            "evidenceId": "eazo-goods-008-evidence-l8-receive",
            "label": "证据定位：收货单（外观合格）"
          }
        ]
      },
      {
        "id": "eazo-goods-008-document-l8-doc-report",
        "name": "失效与检测报告",
        "type": "doc",
        "content": "【虚构训练材料】\n第三方检测：约 12% 液压阀密封圈材质与样品不符，高压下批量漏油。\n采购方 2026-06-10 发现，6-12 书面通知供应商并封存样品。",
        "hotspots": [
          {
            "id": "eazo-goods-008-source-l8-hs-report",
            "evidenceId": "eazo-goods-008-evidence-l8-failure",
            "label": "隐蔽材质缺陷致批量失效"
          },
          {
            "id": "eazo-goods-008-source-eazo-goods-008-evidence-l8-notice",
            "evidenceId": "eazo-goods-008-evidence-l8-notice",
            "label": "证据定位：3 日内书面异议"
          }
        ]
      }
    ],
    "evidence": [
      {
        "id": "eazo-goods-008-evidence-l8-receive",
        "title": "收货单（外观合格）",
        "type": "document",
        "sourceDocumentId": "eazo-goods-008-document-l8-doc-contract",
        "sourceRange": "收货验收",
        "description": "收货时外观完好并签收，表面验收无异常。",
        "proofPurpose": "说明瑕疵属验收时不可发现。",
        "authenticity": "签收单据",
        "relevance": "中",
        "credibility": 7
      },
      {
        "id": "eazo-goods-008-evidence-l8-qc",
        "title": "质检与合同标准",
        "type": "document",
        "sourceDocumentId": "eazo-goods-008-document-l8-doc-contract",
        "sourceRange": "质量条款",
        "description": "约定了漏油率标准与隐蔽瑕疵异议规则。",
        "proofPurpose": "确立质量标准与通知期限。",
        "authenticity": "合同原件",
        "relevance": "高",
        "credibility": 9
      },
      {
        "id": "eazo-goods-008-evidence-l8-failure",
        "title": "批量失效第三方检测",
        "type": "document",
        "sourceDocumentId": "eazo-goods-008-document-l8-doc-report",
        "sourceRange": "检测结论",
        "description": "密封圈材质不符，约 12% 批量漏油。",
        "proofPurpose": "证明存在隐蔽质量瑕疵。",
        "authenticity": "第三方出具",
        "relevance": "高",
        "credibility": 8
      },
      {
        "id": "eazo-goods-008-evidence-l8-notice",
        "title": "3 日内书面异议",
        "type": "log",
        "sourceDocumentId": "eazo-goods-008-document-l8-doc-report",
        "sourceRange": "2026-06-12",
        "description": "发现后 3 日即书面通知并封样。",
        "proofPurpose": "证明在合理期限内通知。",
        "authenticity": "有签收留痕",
        "relevance": "高",
        "credibility": 8
      }
    ],
    "keyEvidenceIds": [
      "eazo-goods-008-evidence-l8-qc",
      "eazo-goods-008-evidence-l8-failure",
      "eazo-goods-008-evidence-l8-notice"
    ],
    "cards": [
      {
        "id": "recorded",
        "name": "已为您记录",
        "type": "damage",
        "cost": 1,
        "value": 2,
        "hint": "用原件固定关键事实",
        "text": "依据「质检与合同标准」：约定了漏油率标准与隐蔽瑕疵异议规则。确立质量标准与通知期限。"
      },
      {
        "id": "verify",
        "name": "正在核实",
        "type": "damage",
        "cost": 2,
        "value": 4,
        "hint": "核对争议材料的证明力",
        "text": "依据「批量失效第三方检测」：密封圈材质不符，约 12% 批量漏油。证明存在隐蔽质量瑕疵。"
      },
      {
        "id": "script",
        "name": "标准话术",
        "type": "defense",
        "cost": 1,
        "value": 2,
        "hint": "护盾 +3，回复一点精力",
        "text": "依据「3 日内书面异议」：发现后 3 日即书面通知并封样。证明在合理期限内通知。"
      },
      {
        "id": "question",
        "name": "交叉质询",
        "type": "damage",
        "cost": 3,
        "value": 7,
        "hint": "围绕本案争点串联证据",
        "text": "依据「质检与合同标准」：约定了漏油率标准与隐蔽瑕疵异议规则。确立质量标准与通知期限。"
      }
    ],
    "keywords": [
      [
        "瑕疵是显性还是隐蔽",
        "收货单",
        "外观合格",
        "收货时外观完好并签收",
        "表面验收无异常"
      ],
      [
        "买方是否在合理期限内通知",
        "质检与合同标准",
        "约定了漏油率标准与隐蔽瑕疵异议规则"
      ],
      [
        "质量标准与损失的计算",
        "批量失效第三方检测",
        "密封圈材质不符",
        "12%",
        "批量漏油"
      ]
    ],
    "adversary": [
      "请围绕“瑕疵是显性还是隐蔽”回应。辩称：收货即签认合格，异议已过 15 日期限；漏油系采购方使用压力超载所致；检测样品取样不具代表性。不得否认合同质量条款与第三方检测的存在。 被告供应商代理律师，主打“收货签字即验收合格、超期异议失效”。",
      "请围绕“买方是否在合理期限内通知”回应。辩称：收货即签认合格，异议已过 15 日期限；漏油系采购方使用压力超载所致；检测样品取样不具代表性。不得否认合同质量条款与第三方检测的存在。",
      "请围绕“质量标准与损失的计算”回应。辩称：收货即签认合格，异议已过 15 日期限；漏油系采购方使用压力超载所致；检测样品取样不具代表性。不得否认合同质量条款与第三方检测的存在。"
    ],
    "judgment": {
      "award": "供应商应就不合格批次承担更换/退货及由此造成的损失；表面 15 日异议期不适用于隐蔽瑕疵。",
      "reasoning": "漏油源于密封圈材质不符，属需投入使用才可发现的隐蔽瑕疵，不受表面 15 日异议期限限制；采购方在发现后 3 日书面通知，处于合理期限内，供应商应担责。",
      "sources": [
        {
          "title": "《中华人民共和国民法典》第 621 条：质量异议期限",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://www.court.gov.cn/zixun/xiangqing/233181.html",
          "status": "训练用法律检索线索 · 请核验现行文本"
        },
        {
          "title": "《中华人民共和国民法典》第 617 条：瑕疵担保责任",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://www.court.gov.cn/zixun/xiangqing/233181.html",
          "status": "训练用法律检索线索 · 请核验现行文本"
        }
      ]
    }
  },
  {
    "id": "eazo-insurance-009",
    "levelId": 19,
    "levelTitle": "理赔之争",
    "desc": "EAZO 导入 · 保险合同纠纷",
    "title": "理赔之争：免责条款作数吗？",
    "type": "保险合同纠纷",
    "difficulty": 8,
    "playerSide": "原告 · 投保人/受益人许先生",
    "opponentSide": "被告 · 某保险公司",
    "goal": "主张保险公司未对免责条款尽提示与明确说明义务，该条款不产生效力，应予理赔。",
    "summary": "案件：被保险人身故后，保险公司以事故落入“非机动车改装”免责条款为由拒赔；投保人认为免责条款未获明确说明。",
    "actionPoints": 6,
    "focus": [
      "免责条款是否经过提示和明确说明",
      "事故是否落入免责情形",
      "格式条款的解释规则"
    ],
    "scenes": [
      {
        "id": "eazo-insurance-009-scene-policy",
        "title": "场景一 · 投保材料",
        "description": "投保单、保险条款与回执能还原说明义务履行情况。",
        "hotspots": [
          {
            "id": "eazo-insurance-009-scene-hotspot-policy",
            "title": "保险单",
            "icon": "🧾",
            "evidenceId": "eazo-insurance-009-evidence-l9-policy",
            "hint": "免责条款用小号字，无加粗提示。"
          },
          {
            "id": "eazo-insurance-009-scene-hotspot-sign",
            "title": "投保回执",
            "icon": "✍️",
            "evidenceId": "eazo-insurance-009-evidence-l9-sign",
            "hint": "仅勾选“已阅读”，无逐条说明记录。"
          }
        ]
      },
      {
        "id": "eazo-insurance-009-scene-claim",
        "title": "场景二 · 理赔现场",
        "description": "事故材料与拒赔通知书决定是否落入免责情形。",
        "hotspots": [
          {
            "id": "eazo-insurance-009-scene-hotspot-accident",
            "title": "事故认定",
            "icon": "🚑",
            "evidenceId": "eazo-insurance-009-evidence-l9-accident",
            "hint": "原因属条款争议项，非免责列举。"
          },
          {
            "id": "eazo-insurance-009-scene-hotspot-denial",
            "title": "拒赔通知书",
            "icon": "📄",
            "evidenceId": "eazo-insurance-009-evidence-l9-denial",
            "hint": "援引“免责条款”拒赔。"
          }
        ]
      }
    ],
    "documents": [
      {
        "id": "eazo-insurance-009-document-l9-doc-policy",
        "name": "保险条款（节选）",
        "type": "doc",
        "content": "【虚构训练材料】\n责任免除：因被保险人酒后驾驶、无证驾驶、故意自伤等所致损失不赔。\n投保回执：投保人声明已阅读并理解全部条款及免责事项，仅由投保人在页面勾选确认。",
        "hotspots": [
          {
            "id": "eazo-insurance-009-source-l9-hs-policy",
            "evidenceId": "eazo-insurance-009-evidence-l9-policy",
            "label": "免责情形未显著提示"
          },
          {
            "id": "eazo-insurance-009-source-eazo-insurance-009-evidence-l9-sign",
            "evidenceId": "eazo-insurance-009-evidence-l9-sign",
            "label": "证据定位：投保回执（仅勾选）"
          }
        ]
      },
      {
        "id": "eazo-insurance-009-document-l9-doc-claim",
        "name": "事故与拒赔材料",
        "type": "doc",
        "content": "【虚构训练材料】\n事故认定：被保险人骑电动自行车夜间被追尾，交警认定其无责，未涉酒驾。\n拒赔通知：认为“非机动车改装”情形落入免责范围，决定不予赔付。",
        "hotspots": [
          {
            "id": "eazo-insurance-009-source-l9-hs-claim",
            "evidenceId": "eazo-insurance-009-evidence-l9-denial",
            "label": "以争议性免责理由拒赔"
          },
          {
            "id": "eazo-insurance-009-source-eazo-insurance-009-evidence-l9-accident",
            "evidenceId": "eazo-insurance-009-evidence-l9-accident",
            "label": "证据定位：事故认定（无责）"
          }
        ]
      }
    ],
    "evidence": [
      {
        "id": "eazo-insurance-009-evidence-l9-policy",
        "title": "免责条款排版",
        "type": "document",
        "sourceDocumentId": "eazo-insurance-009-document-l9-doc-policy",
        "sourceRange": "责任免除",
        "description": "免责条款字号小、无加粗或单独说明。",
        "proofPurpose": "证明未尽显著提示义务。",
        "authenticity": "保单原件",
        "relevance": "高",
        "credibility": 8
      },
      {
        "id": "eazo-insurance-009-evidence-l9-sign",
        "title": "投保回执（仅勾选）",
        "type": "document",
        "sourceDocumentId": "eazo-insurance-009-document-l9-doc-policy",
        "sourceRange": "回执页",
        "description": "仅有格式勾选，无逐条明确说明记录。",
        "proofPurpose": "证明说明义务未实质履行。",
        "authenticity": "电子回执",
        "relevance": "中",
        "credibility": 7
      },
      {
        "id": "eazo-insurance-009-evidence-l9-accident",
        "title": "事故认定（无责）",
        "type": "document",
        "sourceDocumentId": "eazo-insurance-009-document-l9-doc-claim",
        "sourceRange": "事故认定书",
        "description": "无酒驾、无证等法定免责情形。",
        "proofPurpose": "证明事故不属已明确说明的免责项。",
        "authenticity": "交管认定",
        "relevance": "高",
        "credibility": 9
      },
      {
        "id": "eazo-insurance-009-evidence-l9-denial",
        "title": "拒赔通知书",
        "type": "document",
        "sourceDocumentId": "eazo-insurance-009-document-l9-doc-claim",
        "sourceRange": "通知书",
        "description": "以“改装”等争议性理由拒赔。",
        "proofPurpose": "证明拒赔依据存疑、需按不利解释。",
        "authenticity": "公司文件",
        "relevance": "中",
        "credibility": 7
      }
    ],
    "keyEvidenceIds": [
      "eazo-insurance-009-evidence-l9-policy",
      "eazo-insurance-009-evidence-l9-sign",
      "eazo-insurance-009-evidence-l9-accident"
    ],
    "cards": [
      {
        "id": "recorded",
        "name": "已为您记录",
        "type": "damage",
        "cost": 1,
        "value": 2,
        "hint": "用原件固定关键事实",
        "text": "依据「免责条款排版」：免责条款字号小、无加粗或单独说明。证明未尽显著提示义务。"
      },
      {
        "id": "verify",
        "name": "正在核实",
        "type": "damage",
        "cost": 2,
        "value": 4,
        "hint": "核对争议材料的证明力",
        "text": "依据「投保回执（仅勾选）」：仅有格式勾选，无逐条明确说明记录。证明说明义务未实质履行。"
      },
      {
        "id": "script",
        "name": "标准话术",
        "type": "defense",
        "cost": 1,
        "value": 2,
        "hint": "护盾 +3，回复一点精力",
        "text": "依据「事故认定（无责）」：无酒驾、无证等法定免责情形。证明事故不属已明确说明的免责项。"
      },
      {
        "id": "question",
        "name": "交叉质询",
        "type": "damage",
        "cost": 3,
        "value": 7,
        "hint": "围绕本案争点串联证据",
        "text": "依据「免责条款排版」：免责条款字号小、无加粗或单独说明。证明未尽显著提示义务。"
      }
    ],
    "keywords": [
      [
        "免责条款是否经过提示和明确说明",
        "免责条款排版",
        "免责条款字号小",
        "无加粗或单独说明"
      ],
      [
        "事故是否落入免责情形",
        "投保回执",
        "仅勾选",
        "仅有格式勾选",
        "无逐条明确说明记录"
      ],
      [
        "格式条款的解释规则",
        "事故认定",
        "无责",
        "无酒驾",
        "无证等法定免责情形"
      ]
    ],
    "adversary": [
      "请围绕“免责条款是否经过提示和明确说明”回应。辩称：投保回执勾选即完成说明；改装车属危险程度显著增加，免责正当；事故认定不排除其责任。不得否认回执仅有格式勾选。 被告保险公司代理律师，强调“投保人已勾选阅读即已说明”。",
      "请围绕“事故是否落入免责情形”回应。辩称：投保回执勾选即完成说明；改装车属危险程度显著增加，免责正当；事故认定不排除其责任。不得否认回执仅有格式勾选。",
      "请围绕“格式条款的解释规则”回应。辩称：投保回执勾选即完成说明；改装车属危险程度显著增加，免责正当；事故认定不排除其责任。不得否认回执仅有格式勾选。"
    ],
    "judgment": {
      "award": "保险公司应依保险合同给付保险金；所援引免责条款因未尽提示说明义务而不产生效力。",
      "reasoning": "免责条款以格式勾选替代逐条明确说明，未尽到提示与明确说明义务，依法不产生效力；且“改装”是否落入免责情形存在歧义，应作对被保险人有利的解释。",
      "sources": [
        {
          "title": "《中华人民共和国保险法》第 17 条：免责条款的提示说明义务",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://flk.npc.gov.cn/",
          "status": "训练用法律检索线索 · 请核验现行文本"
        },
        {
          "title": "《中华人民共和国保险法》第 30 条：格式条款不利解释规则",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://flk.npc.gov.cn/",
          "status": "训练用法律检索线索 · 请核验现行文本"
        }
      ]
    }
  },
  {
    "id": "eazo-social-host-010",
    "levelId": 20,
    "levelTitle": "酒局之后",
    "desc": "EAZO 导入 · 生命权、健康权、身体权纠纷",
    "title": "酒局之后：同桌人的注意义务",
    "type": "生命权、健康权、身体权纠纷",
    "difficulty": 8,
    "playerSide": "原告 · 死者家属",
    "opponentSide": "被告 · 同桌组织者与劝酒者",
    "goal": "主张组织者未尽安全注意与救助义务，应就损害承担相应赔偿责任。",
    "summary": "案件：共同饮酒后老张独自打车回家，次日急性酒精中毒死亡；家属诉请同桌组织者与劝酒者赔偿。",
    "actionPoints": 6,
    "focus": [
      "劝酒与放任是否具有过错",
      "组织者对醉酒者的照顾救助义务",
      "受害人自担与各方责任的比例"
    ],
    "scenes": [
      {
        "id": "eazo-social-host-010-scene-party",
        "title": "场景一 · 聚会现场",
        "description": "聊天记录、结账单与现场监控还原劝酒与离席过程。",
        "hotspots": [
          {
            "id": "eazo-social-host-010-scene-hotspot-toast",
            "title": "劝酒聊天",
            "icon": "🍻",
            "evidenceId": "eazo-social-host-010-evidence-l10-toast",
            "hint": "多人起哄“不喝不够意思”。"
          },
          {
            "id": "eazo-social-host-010-scene-hotspot-bill",
            "title": "消费记录",
            "icon": "🧾",
            "evidenceId": "eazo-social-host-010-evidence-l10-bill",
            "hint": "当晚大量白酒消费记录。"
          }
        ]
      },
      {
        "id": "eazo-social-host-010-scene-depart",
        "title": "场景二 · 散场之后",
        "description": "离开方式、家属沟通与送医记录决定是否尽到救助义务。",
        "hotspots": [
          {
            "id": "eazo-social-host-010-scene-hotspot-sendoff",
            "title": "散场方式",
            "icon": "🚶",
            "evidenceId": "eazo-social-host-010-evidence-l10-sendoff",
            "hint": "死者独自打车离开，无人陪同。"
          },
          {
            "id": "eazo-social-host-010-scene-hotspot-help",
            "title": "事后求助记录",
            "icon": "📞",
            "evidenceId": "eazo-social-host-010-evidence-l10-help",
            "hint": "家属来电时组织者未告知饮酒情况。"
          }
        ]
      }
    ],
    "documents": [
      {
        "id": "eazo-social-host-010-document-l10-doc-party",
        "name": "聚会聊天与账单",
        "type": "chat",
        "content": "【虚构训练材料】\n2026-01-12 某同事：老张多喝点，项目成了靠你！\n2026-01-12 老张：我今晚还有事，先不多喝。\n账单：白酒 3 瓶（约 1.5 升）由聚会人均分摊。散场约 23:00，老张独自打车回家。",
        "hotspots": [
          {
            "id": "eazo-social-host-010-source-l10-hs-party",
            "evidenceId": "eazo-social-host-010-evidence-l10-toast",
            "label": "多人劝酒且老张自称有事"
          },
          {
            "id": "eazo-social-host-010-source-eazo-social-host-010-evidence-l10-bill",
            "evidenceId": "eazo-social-host-010-evidence-l10-bill",
            "label": "证据定位：白酒消费记录"
          },
          {
            "id": "eazo-social-host-010-source-eazo-social-host-010-evidence-l10-sendoff",
            "evidenceId": "eazo-social-host-010-evidence-l10-sendoff",
            "label": "证据定位：独自打车离开"
          }
        ]
      },
      {
        "id": "eazo-social-host-010-document-l10-doc-after",
        "name": "家属联系与救助记录",
        "type": "chat",
        "content": "【虚构训练材料】\n次日 07:30 家属来电：老张不省人事送医。\n组织者回复：昨晚他自己打车走的，我们不清楚喝了多少。\n诊断：急性酒精中毒，抢救无效死亡。",
        "hotspots": [
          {
            "id": "eazo-social-host-010-source-l10-hs-after",
            "evidenceId": "eazo-social-host-010-evidence-l10-help",
            "label": "散场后未护送亦未及时说明"
          }
        ]
      }
    ],
    "evidence": [
      {
        "id": "eazo-social-host-010-evidence-l10-toast",
        "title": "劝酒聊天",
        "type": "chat",
        "sourceDocumentId": "eazo-social-host-010-document-l10-doc-party",
        "sourceRange": "2026-01-12",
        "description": "多人起哄劝酒，老张明确表示“今晚有事先不多喝”。",
        "proofPurpose": "证明劝酒及放任行为。",
        "authenticity": "聊天留痕",
        "relevance": "高",
        "credibility": 8
      },
      {
        "id": "eazo-social-host-010-evidence-l10-bill",
        "title": "白酒消费记录",
        "type": "payment",
        "sourceDocumentId": "eazo-social-host-010-document-l10-doc-party",
        "sourceRange": "结账单",
        "description": "当晚大量白酒，人均饮酒量可观。",
        "proofPurpose": "佐证过量饮酒情境。",
        "authenticity": "商家账单",
        "relevance": "中",
        "credibility": 7
      },
      {
        "id": "eazo-social-host-010-evidence-l10-sendoff",
        "title": "独自打车离开",
        "type": "log",
        "sourceDocumentId": "eazo-social-host-010-document-l10-doc-party",
        "sourceRange": "散场",
        "description": "组织者未安排护送，老张独自离开。",
        "proofPurpose": "证明未尽护送与照顾义务。",
        "authenticity": "出行记录",
        "relevance": "高",
        "credibility": 7
      },
      {
        "id": "eazo-social-host-010-evidence-l10-help",
        "title": "救助与告知缺位",
        "type": "chat",
        "sourceDocumentId": "eazo-social-host-010-document-l10-doc-after",
        "sourceRange": "次日",
        "description": "家属询问时组织者未说明饮酒与同饮情况。",
        "proofPurpose": "证明未履行及时告知救助义务。",
        "authenticity": "含时间戳",
        "relevance": "中",
        "credibility": 7
      }
    ],
    "keyEvidenceIds": [
      "eazo-social-host-010-evidence-l10-toast",
      "eazo-social-host-010-evidence-l10-sendoff",
      "eazo-social-host-010-evidence-l10-help"
    ],
    "cards": [
      {
        "id": "recorded",
        "name": "已为您记录",
        "type": "damage",
        "cost": 1,
        "value": 2,
        "hint": "用原件固定关键事实",
        "text": "依据「劝酒聊天」：多人起哄劝酒，老张明确表示“今晚有事先不多喝”。证明劝酒及放任行为。"
      },
      {
        "id": "verify",
        "name": "正在核实",
        "type": "damage",
        "cost": 2,
        "value": 4,
        "hint": "核对争议材料的证明力",
        "text": "依据「独自打车离开」：组织者未安排护送，老张独自离开。证明未尽护送与照顾义务。"
      },
      {
        "id": "script",
        "name": "标准话术",
        "type": "defense",
        "cost": 1,
        "value": 2,
        "hint": "护盾 +3，回复一点精力",
        "text": "依据「救助与告知缺位」：家属询问时组织者未说明饮酒与同饮情况。证明未履行及时告知救助义务。"
      },
      {
        "id": "question",
        "name": "交叉质询",
        "type": "damage",
        "cost": 3,
        "value": 7,
        "hint": "围绕本案争点串联证据",
        "text": "依据「劝酒聊天」：多人起哄劝酒，老张明确表示“今晚有事先不多喝”。证明劝酒及放任行为。"
      }
    ],
    "keywords": [
      [
        "劝酒与放任是否具有过错",
        "劝酒聊天",
        "多人起哄劝酒",
        "老张明确表示",
        "今晚有事先不多喝"
      ],
      [
        "组织者对醉酒者的照顾救助义务",
        "白酒消费记录",
        "当晚大量白酒",
        "人均饮酒量可观"
      ],
      [
        "受害人自担与各方责任的比例",
        "独自打车离开",
        "组织者未安排护送",
        "老张独自离开"
      ]
    ],
    "adversary": [
      "请围绕“劝酒与放任是否具有过错”回应。辩称：无强迫灌酒；老张系成年人应自知酒量；散场时其表现正常、自行打车，组织者无从预见危险。不得否认存在劝酒与无人护送事实。 被告组织者与劝酒者代理律师，强调“成年人自担饮酒风险、无人强迫”。",
      "请围绕“组织者对醉酒者的照顾救助义务”回应。辩称：无强迫灌酒；老张系成年人应自知酒量；散场时其表现正常、自行打车，组织者无从预见危险。不得否认存在劝酒与无人护送事实。",
      "请围绕“受害人自担与各方责任的比例”回应。辩称：无强迫灌酒；老张系成年人应自知酒量；散场时其表现正常、自行打车，组织者无从预见危险。不得否认存在劝酒与无人护送事实。"
    ],
    "judgment": {
      "award": "组织者及积极劝酒者承担相应次要赔偿责任；老张自身饮酒自负主要责任，责任比例按过错酌定。",
      "reasoning": "同桌人对明显醉酒或大量饮酒者负有照顾、护送及救助的注意义务。本案存在劝酒、放任独自离开且事后未及时说明饮酒情况等过错，应与受害人自身责任按比例分担。",
      "sources": [
        {
          "title": "《中华人民共和国民法典》第 1165 条：过错责任",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://www.court.gov.cn/zixun/xiangqing/233181.html",
          "status": "训练用法律检索线索 · 请核验现行文本"
        },
        {
          "title": "《中华人民共和国民法典》第 1173 条：与有过失减轻责任",
          "article": "本关仅作规则识别训练，具体适用须结合完整事实及现行法核验。",
          "url": "https://www.court.gov.cn/zixun/xiangqing/233181.html",
          "status": "训练用法律检索线索 · 请核验现行文本"
        }
      ]
    }
  }
];

module.exports = { eazoCampaignCases };
