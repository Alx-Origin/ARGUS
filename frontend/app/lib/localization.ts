import { createContext, useContext } from 'react';

export type Locale = 'zh' | 'en';

export const LOCALE_STORAGE_KEY = 'argus-locale';

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === 'en' ? 'en' : 'zh';
}

export function detectLocale(preferred?: string | null): Locale {
  if (preferred) return normalizeLocale(preferred);
  if (typeof navigator !== 'undefined') return normalizeLocale(navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'zh');
  return 'zh';
}

export type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) {
    return { locale: 'zh' as Locale, setLocale: () => undefined };
  }
  return value;
}

export function interpolate(text: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, String(value)), text);
}

export function stripCampaignPrefix(text: string) {
  return text.replace(/^EAZO\s*(?:导入|import)?\s*[·•:\-]?\s*/i, '').trim();
}

export const APP_COPY = {
  zh: {
    brandTitle: '你的证词有猫饼',
    brandSubtitle: 'Meow Court',
    brandAlt: 'Meow Court 律师猫',
    skipLink: '跳到主要内容',
    login: '登录 / 注册',
    loginHint: '用户名 + 密码',
    editProfile: '已登录 · 点击编辑头像',
    logout: '退出',
    localeZh: '中文',
    localeEn: 'EN',
    campaignTitle: '法庭闯关',
    campaignSubtitle: '证据 → 卡牌 → 裁决',
    campaignLead: '先在案发现场搜证，再把证据编成卡牌连击。20 个独立案件，由押金纠纷逐步进阶到综合审判。',
    campaignTag: '搜证 + 庭审',
    campaignOpen: '全部 {count} 关开放',
    campaignProgress: '本次完成 {done}/{total}',
    campaignLoadingMap: '正在载入关卡地图…',
    campaignLoadingCase: '正在载入本关案件…',
    campaignBack: '返回关卡地图',
    campaignRulesTitle: '闯关目标',
    campaignRulesBody: '阅读本关案情与争议焦点 · 自由查看并收集关键原件，然后选择最有利于自己的证据卡牌进入庭审，并出牌、回应质疑并请求裁决',
    campaignLevelBadge: '本关目标',
    campaignStart: '开始搜证 →',
    campaignFocusLabel: '争议焦点',
    campaignInvestigate: '搜证',
    campaignCourt: '庭审',
    campaignVerdict: '裁决',
    campaignSearchTitle: '现场搜证',
    campaignSearchBadge: '自由搜证',
    campaignSearchLog: '搜证日志',
    campaignSourceTitle: '原始文件 · 与当前材料同组',
    campaignSourceReader: '具体租房材料',
    campaignSourceBadge: '原始材料',
    campaignEvidenceTitle: '证据卡组',
    campaignEvidenceBadge: '已选 {selected}/{total}',
    campaignEnterCourt: '带着 {count} 张证据卡进入法庭 →',
    campaignChooseEvidence: '请选择证据卡 →',
    campaignInvestigateHint: '点击左侧现场热点，或在材料中点击线索，收集到的证据会出现在这里。',
    campaignCourtEntryHint: '最多选择 {total} 张证据卡，根据证据内容和重要性做取舍。选择几张，庭审就使用几种证据牌；护盾和回体力战术牌始终可用。',
    campaignCourtRule: '恢复和护盾都靠战术牌；护盾会优先吸收反击伤害。无牌可出时，补牌优先提供可用牌。',
    campaignDifficulty: '难度',
    campaignKeyEvidenceCount: '份关键证据',
    campaignCollected: '已取证',
    campaignKeyEvidence: '关键证据',
    campaignScore: '总分',
    campaignReturnRetry: '返回搜证重试',
    campaignVictory: '我方胜利！',
    campaignDefeat: '对方胜利',
    campaignRequestVerdict: '请求法官裁决',
    campaignVerdictReady: '对方血量归零后可请求裁决',
    campaignNext: '下一关 →',
    courtOpponentHp: '对方血量',
    courtPlayerHp: '我方血量',
    courtStamina: '体力',
    courtShield: '护盾',
    courtRound: '庭审回合',
    courtWaiting: '等待对方回应',
    courtTurnPlayer: '轮到我方出牌',
    courtTurnOpponent: '对方反击',
    courtTurnPreparing: '对方准备反击…',
    courtTurnEnd: '本轮已结束',
    courtReturnMap: '← 返回关卡地图',
    courtInvestigate: '搜证',
    courtTrial: '卡牌庭审',
    courtVerdict: '裁决',
    courtOurSide: '我方',
    courtTheirSide: '对方',
    courtEvidencePlay: '证据牌',
    courtRecoveryPlay: '恢复牌',
    courtDefensePlay: '防御牌',
    courtCost: '消耗 {cost} 体力',
    courtEffect: '效果：',
    courtSeconds: '秒',
    courtHand: '手牌 {count}/{total} · 出牌后随机补一张',
    courtPlayed: '已出 {count} 张 · 体力 {stamina}/{max}',
    courtShieldAria: '护盾 {current}/{max}',
    courtEvidenceAccuracy: '可信度 {score}/10',
    courtBattleFeedback: '正在等待庭审反馈…',
    courtVerdictLocked: '对方血量归零后可请求裁决',
    courtEvidenceKey: '关键证据',
    courtEvidenceSupport: '补充证据',
    courtAction: '战术行动 · 不作为裁决证据',
    courtPlayHint: '点击出牌 · 扣除体力并攻击',
    courtRecoveryHint: '使用后恢复体力 · 对方仍会反击',
    courtDefenseHint: '使用后获得护盾 · 对方仍会反击',
    courtRecoveryFull: '体力已满 · 暂不可用',
    courtShieldFull: '护盾已满 · 暂不可用',
    courtLowStamina: '体力不足 · 还需 {cost} 点',
    courtBattleResultWin: '对方血量先归零，证据链压制成功。现在可以请求法官裁决。',
    courtBattleResultLoss: '我方血量先归零。本局最终裁决将按游戏结果作出，证据链仅用于展示本局过程。',
    courtBattleOver: '本轮已结束',
    courtJudgePrompt: '法官提示：',
    courtOpponentReply: '对方回应',
    courtPlayerStatement: '我方陈词',
    courtOpponentReplyPending: '对方正在组织回应…',
    courtNoDebate: '先看体力，再选择证据出牌。 出牌后随机补一张，体力不足时使用恢复牌。',
    courtEvidenceChain: '证据链',
    courtLegalLeads: '法律检索线索',
    courtReady: '关键证据链已闭合，可以请求训练裁决。',
    briefTitle: '本关目标',
    briefStart: '开始搜证 →',
    profileTitleNew: '创建玩家档案',
    profileTitleEdit: '编辑玩家档案',
    profileDesc: '只需设置昵称和头像，就可以开始记录闯关成绩。',
    profileNameLabel: '用户名 / 昵称',
    profileNameHelpAuthed: '账号名',
    profileNameHelpRequired: '必填',
    profileAvatarTitle: '选择头像',
    profileAvatarHint: '使用现有猫咪角色',
    profilePrivacy: '用户名用于登录并参与排行榜查重。密码只交给 Supabase Auth，不会写入玩家档案表。',
    profileSave: '保存并开始闯关 →',
    profileLater: '稍后再改',
    profileAuthLink: '注册 / 登录账号（保存跨设备进度）',
    profileClose: '关闭身份卡',
    profileMissingName: '完善玩家档案',
    profileInvalidName: '用户名需为 2-20 位字母、数字、下划线或短横线。',
    profileSaveError: '保存失败，请稍后重试',
    profileSavedLocal: '已保存到本机；配置 Supabase 后会自动同步云端。',
    profileCloudUnavailable: '云端档案暂时不可用，仍可使用本机模式。',
    profileRunSavedLocal: '本局已记录在本机，云端同步将在 Supabase 配置后生效。',
    logoutError: '退出登录失败',
    authTitleRegister: '注册玩家账号',
    authTitleLogin: '登录玩家账号',
    authDesc: '用户名就是你的昵称，不需要填写邮箱。',
    authRegister: '注册',
    authLogin: '登录',
    authNameLabel: '用户名 / 昵称',
    authNameHelp: '2-20 位',
    authPasswordLabel: '密码',
    authPasswordHelp: '至少 6 位',
    authConfirmLabel: '确认密码',
    authConfirmHelp: '再次输入',
    authUsernameChecking: '查中…',
    authUsernameAvailable: '可用 ✓',
    authCheck: '查重',
    authSubmitRegister: '注册并开始闯关 →',
    authSubmitLogin: '登录 →',
    authClose: '关闭登录窗口',
    authRegisterMessage: '注册成功，但当前开启了邮箱确认。请在 Supabase Auth → Providers 中关闭 Confirm email 后再登录。',
    authNotConfigured: '当前未配置 Supabase，暂时只能使用本机试玩。',
    authPasswordMismatch: '两次密码输入不一致。',
    authPasswordShort: '密码至少需要 6 位。',
    authUsernameTaken: '用户名已被占用，请换一个。',
    authUsernameInvalid: '用户名需为 2-20 位字母、数字、下划线或短横线。',
    authLoginBadCredentials: '用户名或密码错误。',
    authEmailUnconfirmed: '账号尚未确认，请先在 Supabase 中关闭 Confirm email。',
    authCheckError: '查重失败',
    authOperationError: '操作失败',
  },
  en: {
    brandTitle: 'Meow Court',
    brandSubtitle: 'Legal training platform',
    brandAlt: 'Meow Court lawyer cat',
    skipLink: 'Skip to main content',
    login: 'Log in / Sign up',
    loginHint: 'Username + password',
    editProfile: 'Signed in · click to edit avatar',
    logout: 'Log out',
    localeZh: '中文',
    localeEn: 'EN',
    campaignTitle: 'Courtroom Quest',
    campaignSubtitle: 'Evidence → Cards → Verdict',
    campaignLead: 'Search the scene, turn evidence into combo cards, and work through 20 standalone cases that scale from a simple deposit dispute to a comprehensive trial.',
    campaignTag: 'Evidence + trial',
    campaignOpen: 'All {count} levels open',
    campaignProgress: 'Completed {done}/{total}',
    campaignLoadingMap: 'Loading the map…',
    campaignLoadingCase: 'Loading the case…',
    campaignBack: 'Back to map',
    campaignRulesTitle: 'Mission',
    campaignRulesBody: 'Read the case and its dispute points, inspect the original materials freely, then choose the best evidence cards to enter trial, answer challenges, and request a verdict.',
    campaignLevelBadge: 'Goal',
    campaignStart: 'Start investigation →',
    campaignFocusLabel: 'Dispute focus',
    campaignInvestigate: 'Investigation',
    campaignCourt: 'Trial',
    campaignVerdict: 'Verdict',
    campaignSearchTitle: 'Scene search',
    campaignSearchBadge: 'Free search',
    campaignSearchLog: 'Investigation log',
    campaignSourceTitle: 'Original files · grouped with the current materials',
    campaignSourceReader: 'Source reader',
    campaignSourceBadge: 'Original materials',
    campaignEvidenceTitle: 'Evidence deck',
    campaignEvidenceBadge: 'Selected {selected}/{total}',
    campaignEnterCourt: 'Enter trial with {count} evidence cards →',
    campaignChooseEvidence: 'Select evidence cards →',
    campaignInvestigateHint: 'Click the scene hotspots on the left, or click clues in the materials, and the collected evidence will appear here.',
    campaignCourtEntryHint: 'Choose up to {total} evidence cards. Pick by strength and relevance; shield and stamina recovery cards remain available.',
    campaignCourtRule: 'Recovery and shield cards come from tactical plays. Shields absorb counterattacks first. If you are out of attack cards, the draw prioritizes usable cards.',
    campaignDifficulty: 'Difficulty',
    campaignKeyEvidenceCount: 'key exhibits',
    campaignCollected: 'Collected',
    campaignKeyEvidence: 'Key evidence',
    campaignScore: 'Score',
    campaignReturnRetry: 'Return to investigation',
    campaignVictory: 'Victory!',
    campaignDefeat: 'Defeat',
    campaignRequestVerdict: 'Request verdict',
    campaignVerdictReady: 'You can request a verdict once the opponent HP reaches zero',
    campaignNext: 'Next level →',
    courtOpponentHp: 'Opponent HP',
    courtPlayerHp: 'Our HP',
    courtStamina: 'Stamina',
    courtShield: 'Shield',
    courtRound: 'Trial round',
    courtWaiting: 'Waiting for the reply',
    courtTurnPlayer: 'Our turn',
    courtTurnOpponent: 'Opponent counterattacks',
    courtTurnPreparing: 'Opponent is preparing to counterattack…',
    courtTurnEnd: 'Round over',
    courtReturnMap: '← Back to map',
    courtInvestigate: 'Investigation',
    courtTrial: 'Card trial',
    courtVerdict: 'Verdict',
    courtOurSide: 'Our side',
    courtTheirSide: 'Opponent',
    courtEvidencePlay: 'Evidence card',
    courtRecoveryPlay: 'Recovery card',
    courtDefensePlay: 'Defense card',
    courtCost: 'Cost {cost} stamina',
    courtEffect: 'Effect:',
    courtSeconds: 'sec',
    courtHand: 'Hand {count}/{total} · draw a replacement after each play',
    courtPlayed: '{count} played · Stamina {stamina}/{max}',
    courtShieldAria: 'Shield {current}/{max}',
    courtEvidenceAccuracy: 'Credibility {score}/10',
    courtBattleFeedback: 'Waiting for trial feedback…',
    courtVerdictLocked: 'Request a verdict when the opponent HP reaches zero',
    courtEvidenceKey: 'Key evidence',
    courtEvidenceSupport: 'Supporting evidence',
    courtAction: 'Tactical action · not admissible as verdict evidence',
    courtPlayHint: 'Play a card · spend stamina and attack',
    courtRecoveryHint: 'Restores stamina · the opponent still counterattacks',
    courtDefenseHint: 'Grants shield · the opponent still counterattacks',
    courtRecoveryFull: 'Stamina full · unavailable',
    courtShieldFull: 'Shield full · unavailable',
    courtLowStamina: 'Not enough stamina · need {cost} more',
    courtBattleResultWin: 'The opponent HP hit zero first. The evidence chain worked. You can request a verdict now.',
    courtBattleResultLoss: 'Our HP hit zero first. The final verdict follows the game result; the evidence chain only shows the round.',
    courtBattleOver: 'Round over',
    courtJudgePrompt: 'Judge note:',
    courtOpponentReply: 'Opponent reply',
    courtPlayerStatement: 'Our statement',
    courtOpponentReplyPending: 'Opponent is drafting a reply…',
    courtNoDebate: 'Check stamina first, then choose an evidence card to play. After each play, a new card is drawn; use recovery cards when stamina runs low.',
    courtEvidenceChain: 'Evidence chain',
    courtLegalLeads: 'Legal research leads',
    courtReady: 'The key evidence chain is complete. You can request a training verdict.',
    briefTitle: 'Goal',
    briefStart: 'Start investigation →',
    profileTitleNew: 'Create player profile',
    profileTitleEdit: 'Edit player profile',
    profileDesc: 'Set a nickname and avatar to start tracking your runs.',
    profileNameLabel: 'Username / nickname',
    profileNameHelpAuthed: 'Account name',
    profileNameHelpRequired: 'Required',
    profileAvatarTitle: 'Choose avatar',
    profileAvatarHint: 'Use an existing cat character',
    profilePrivacy: 'The username is used for login and leaderboard deduplication. The password goes only to Supabase Auth and is not written to the profile table.',
    profileSave: 'Save and start',
    profileLater: 'Maybe later',
    profileAuthLink: 'Sign up / log in (sync progress across devices)',
    profileClose: 'Close profile card',
    profileMissingName: 'Complete player profile',
    profileInvalidName: 'Username must be 2-20 letters, numbers, underscores, or hyphens.',
    profileSaveError: 'Could not save. Please try again.',
    profileSavedLocal: 'Saved locally; cloud sync will start after Supabase is configured.',
    profileCloudUnavailable: 'Cloud profile is temporarily unavailable; local mode is still ready.',
    profileRunSavedLocal: 'This run was saved locally; cloud sync will start after Supabase is configured.',
    logoutError: 'Could not log out',
    authTitleRegister: 'Create player account',
    authTitleLogin: 'Log in to player account',
    authDesc: 'Your username is your nickname; no email required.',
    authRegister: 'Sign up',
    authLogin: 'Log in',
    authNameLabel: 'Username / nickname',
    authNameHelp: '2-20 chars',
    authPasswordLabel: 'Password',
    authPasswordHelp: 'At least 6 chars',
    authConfirmLabel: 'Confirm password',
    authConfirmHelp: 'Type again',
    authUsernameChecking: 'Checking…',
    authUsernameAvailable: 'Available ✓',
    authCheck: 'Check',
    authSubmitRegister: 'Sign up and start →',
    authSubmitLogin: 'Log in →',
    authClose: 'Close login window',
    authRegisterMessage: 'Sign-up succeeded, but email confirmation is still enabled. Disable Confirm email in Supabase Auth → Providers, then log in again.',
    authNotConfigured: 'Supabase is not configured yet, so this build can only run locally for now.',
    authPasswordMismatch: 'The two passwords do not match.',
    authPasswordShort: 'Password must be at least 6 characters.',
    authUsernameTaken: 'That username is already taken. Try another one.',
    authUsernameInvalid: 'Username must be 2-20 letters, numbers, underscores, or hyphens.',
    authLoginBadCredentials: 'Username or password is incorrect.',
    authEmailUnconfirmed: 'The account is not confirmed yet. Turn off Confirm email in Supabase first.',
    authCheckError: 'Could not check username',
    authOperationError: 'Something went wrong',
  },
} as const;

type LevelCopy = { title: string; desc: string };

const LEVEL_COPY: Record<Locale, Record<number, LevelCopy>> = {
  zh: {
    1: { title: '押金猎人', desc: '租房押金纠纷' },
    2: { title: '七天无理由', desc: '电商退货争议' },
    3: { title: '加班费幽灵', desc: '劳动仲裁入门' },
    4: { title: '信息饕餮', desc: '隐私政策漏洞' },
    5: { title: '版权窃贼', desc: '用户协议陷阱' },
    6: { title: '竞业锁链', desc: '离职限制条款' },
    7: { title: '格式条款恶魔', desc: '霸王条款识别' },
    8: { title: '仲裁迷宫', desc: '仲裁程序争议' },
    9: { title: '证据湮灭', desc: '举证责任翻转' },
    10: { title: '终极审判', desc: '综合大案' },
    11: { title: '租赁押金争议', desc: '房屋租赁合同纠纷' },
    12: { title: '网购退货之争', desc: '网络购物合同纠纷' },
    13: { title: '离职工资之争', desc: '劳动争议' },
    14: { title: '购房尾款之争', desc: '房屋买卖合同纠纷' },
    15: { title: '转账之争', desc: '民间借贷纠纷' },
    16: { title: '装修停工之争', desc: '承揽/装饰装修合同纠纷' },
    17: { title: '二手车之争', desc: '买卖合同纠纷' },
    18: { title: '验收之争', desc: '买卖合同纠纷' },
    19: { title: '理赔之争', desc: '保险合同纠纷' },
    20: { title: '酒局之后', desc: '生命权、健康权、身体权纠纷' },
  },
  en: {
    1: { title: 'Deposit Hunter', desc: 'Lease deposit dispute' },
    2: { title: 'No-Reason Return', desc: 'E-commerce return dispute' },
    3: { title: 'Overtime Ghost', desc: 'Labor arbitration primer' },
    4: { title: 'Data Glutton', desc: 'Privacy policy loophole' },
    5: { title: 'Copyright Thief', desc: 'User-agreement trap' },
    6: { title: 'Non-Compete Chain', desc: 'Departure restriction clause' },
    7: { title: 'Boilerplate Demon', desc: 'Unfair-term spotter' },
    8: { title: 'Arbitration Maze', desc: 'Arbitration procedure dispute' },
    9: { title: 'Evidence Gone Missing', desc: 'Burden-shifting dispute' },
    10: { title: 'Final Trial', desc: 'Comprehensive case' },
    11: { title: 'Rental Deposit Dispute', desc: 'Lease contract dispute' },
    12: { title: 'Online Return Dispute', desc: 'E-commerce purchase dispute' },
    13: { title: 'Wage Dispute After Resignation', desc: 'Labor dispute' },
    14: { title: 'Home Purchase Balance Dispute', desc: 'Housing-sale contract dispute' },
    15: { title: 'Transfer Dispute', desc: 'Private lending dispute' },
    16: { title: 'Renovation Stoppage Dispute', desc: 'Renovation contract dispute' },
    17: { title: 'Used-Car Dispute', desc: 'Sales contract dispute' },
    18: { title: 'Acceptance Dispute', desc: 'Sales contract dispute' },
    19: { title: 'Claim Dispute', desc: 'Insurance contract dispute' },
    20: { title: 'After the Drinking Party', desc: 'Life, health, and bodily-rights dispute' },
  },
};

const TYPE_COPY: Record<string, Record<Locale, string>> = {
  '房屋租赁合同纠纷': { zh: '房屋租赁合同纠纷', en: 'Lease contract dispute' },
  '网络消费合同纠纷': { zh: '网络消费合同纠纷', en: 'E-commerce consumer dispute' },
  '劳动争议': { zh: '劳动争议', en: 'Labor dispute' },
  '个人信息保护纠纷': { zh: '个人信息保护纠纷', en: 'Personal information dispute' },
  '著作权许可使用纠纷': { zh: '著作权许可使用纠纷', en: 'Copyright license dispute' },
  '预付式消费合同纠纷': { zh: '预付式消费合同纠纷', en: 'Prepaid consumer dispute' },
  '仲裁司法审查训练': { zh: '仲裁司法审查训练', en: 'Arbitration judicial review exercise' },
  '劳动争议 · 举证妨碍': { zh: '劳动争议 · 举证妨碍', en: 'Labor dispute · evidence obstruction' },
  '技术服务合同及知识产权、个人信息综合争议': { zh: '技术服务合同及知识产权、个人信息综合争议', en: 'Tech services, IP, and personal-data dispute' },
  '网络购物合同纠纷': { zh: '网络购物合同纠纷', en: 'Online shopping contract dispute' },
  '房屋买卖合同纠纷': { zh: '房屋买卖合同纠纷', en: 'Housing-sale contract dispute' },
  '民间借贷纠纷': { zh: '民间借贷纠纷', en: 'Private lending dispute' },
  '承揽/装饰装修合同纠纷': { zh: '承揽/装饰装修合同纠纷', en: 'Contracting / renovation dispute' },
  '买卖合同纠纷': { zh: '买卖合同纠纷', en: 'Sales contract dispute' },
  '保险合同纠纷': { zh: '保险合同纠纷', en: 'Insurance contract dispute' },
  '生命权、健康权、身体权纠纷': { zh: '生命权、健康权、身体权纠纷', en: 'Life, health, and bodily-rights dispute' },
};

const EVIDENCE_NATURE_COPY: Record<string, Record<Locale, string>> = {
  书证: { zh: '书证', en: 'Documentary evidence' },
  影像物证: { zh: '影像物证', en: 'Visual evidence' },
  支付凭证: { zh: '支付凭证', en: 'Payment proof' },
  单据: { zh: '单据', en: 'Receipt' },
  对话记录: { zh: '对话记录', en: 'Chat log' },
  其他材料: { zh: '其他材料', en: 'Other material' },
  体力恢复: { zh: '体力恢复', en: 'Stamina recovery' },
  防御策略: { zh: '防御策略', en: 'Defense tactic' },
};

const TACTICAL_CARD_COPY: Record<string, { name: Record<Locale, string>; nature: Record<Locale, string>; effect: Record<Locale, string> }> = {
  'recover-breath': { name: { zh: '深呼吸', en: 'Take a breath' }, nature: { zh: '体力恢复', en: 'Stamina recovery' }, effect: { zh: '恢复 3 点体力 · 不造成伤害', en: 'Restore 3 stamina · no damage' } },
  'recover-organize': { name: { zh: '整理思路', en: 'Organize thoughts' }, nature: { zh: '体力恢复', en: 'Stamina recovery' }, effect: { zh: '消耗后恢复 5 点体力 · 净恢复最多 4 点', en: 'Spend 1, restore 5 stamina · net gain up to 4' } },
  'shield-pause': { name: { zh: '请求缓冲', en: 'Request a pause' }, nature: { zh: '防御策略', en: 'Defense tactic' }, effect: { zh: '获得 5 点护盾 · 抵挡后续反击', en: 'Gain 5 shield · block the next counterattack' } },
  'shield-seal': { name: { zh: '封存原件', en: 'Seal the exhibit' }, nature: { zh: '防御策略', en: 'Defense tactic' }, effect: { zh: '获得 8 点护盾 · 抵挡后续反击', en: 'Gain 8 shield · block the next counterattack' } },
};

const BATTLE_EFFECT_COPY: Array<[RegExp, (match: RegExpMatchArray) => Record<Locale, string>]> = [
  [/^护盾 \+(\d+)$/, (match) => ({ zh: `护盾 +${match[1]}`, en: `Shield +${match[1]}` })],
  [/^体力 \+(\d+)$/, (match) => ({ zh: `体力 +${match[1]}`, en: `Stamina +${match[1]}` })],
  [/^异议！-(\d+)$/, (match) => ({ zh: `异议！-${match[1]}`, en: `Objection! -${match[1]}` })],
  [/^护盾吸收 (\d+) · 受伤 -(\d+)$/, (match) => ({ zh: `护盾吸收 ${match[1]} · 受伤 -${match[2]}`, en: `Shield absorbs ${match[1]} · Takes ${match[2]}` })],
  [/^护盾吸收 (\d+) · 完全抵挡$/, (match) => ({ zh: `护盾吸收 ${match[1]} · 完全抵挡`, en: `Shield absorbs ${match[1]} · Fully blocked` })],
  [/^(超时反击|反击！) -(\d+)$/, (match) => ({ zh: `${match[1]} -${match[2]}`, en: `${match[1] === '超时反击' ? 'Timeout counterattack' : 'Counterattack!'} -${match[2]}` })],
];

export function getAppCopy(locale: Locale) {
  return APP_COPY[locale];
}

export function getLevelCopy(levelId: number, locale: Locale, fallback?: { title: string; desc: string }) {
  const entry = LEVEL_COPY[locale][levelId];
  if (entry) return { ...entry, desc: stripCampaignPrefix(entry.desc) };
  return {
    title: stripCampaignPrefix(fallback?.title || ''),
    desc: stripCampaignPrefix(fallback?.desc || ''),
  };
}

export function getTypeCopy(type: string, locale: Locale) {
  return TYPE_COPY[type]?.[locale] || type;
}

export function getEvidenceNatureCopy(type: string, locale: Locale) {
  return EVIDENCE_NATURE_COPY[type]?.[locale] || EVIDENCE_NATURE_COPY['其他材料'][locale];
}

export function getBattleEffectCopy(label: string, locale: Locale) {
  for (const [pattern, formatter] of BATTLE_EFFECT_COPY) {
    const match = label.match(pattern);
    if (match) return formatter(match)[locale];
  }
  return label;
}

export function getTacticalCardCopy(id: string, locale: Locale) {
  const entry = TACTICAL_CARD_COPY[id];
  return entry ? { name: entry.name[locale], nature: entry.nature[locale], effect: entry.effect[locale] } : null;
}

export function translatePartyLabel(value: string, locale: Locale) {
  if (locale === 'zh') return value;
  const replacements: Array<[RegExp, string]> = [
    [/^原告\s*·\s*/, 'Plaintiff · '],
    [/^被告\s*·\s*/, 'Defendant · '],
    [/^申请人\s*·\s*/, 'Applicant · '],
    [/^被申请人\s*·\s*/, 'Respondent · '],
    [/^消费者/, 'Consumer '],
    [/^租客/, 'Tenant '],
    [/^房东/, 'Landlord '],
    [/^前员工/, 'Former employee '],
    [/^员工/, 'Employee '],
    [/^买家/, 'Buyer '],
    [/^买受人/, 'Buyer '],
    [/^出借人/, 'Lender '],
    [/^收款人/, 'Recipient '],
    [/^业主/, 'Owner '],
    [/^购车人/, 'Car buyer '],
    [/^采购方/, 'Purchaser '],
    [/^供应商/, 'Supplier '],
    [/^投保人\/受益人/, 'Policyholder / beneficiary '],
    [/^死者家属/, 'Family of the deceased '],
    [/^同桌组织者与劝酒者/, 'Host and drink-pushers '],
    [/^门店经营者/, 'Store operator '],
    [/^数字服务公司/, 'Digital services company '],
    [/^科技公司/, 'Tech company '],
  ];
  let result = value;
  for (const [pattern, replacement] of replacements) result = result.replace(pattern, replacement);
  return result;
}
