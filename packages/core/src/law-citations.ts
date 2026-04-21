import type {
  CitationAnchor,
  CuratedLawCitationTarget,
  RuleDefinition,
} from "../../shared-types/src/index.js";
import { getLawAnchorRecord } from "./law-snapshot-store.js";

const CURATED_LAW_CITATION_MAP: Record<string, CuratedLawCitationTarget[]> = {
  "cosmetics.medical_claim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-1",
      locator: "제13조제1항제1호",
      label: "화장품법 제13조제1항제1호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773305",
      note: "의약품으로 잘못 인식할 우려가 있는 표시 또는 광고 금지.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
      note: "표시·광고 범위와 준수사항이 별표 5에 따른다는 연결 조문.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-ga",
      locator: "[별표 5] 제2호 가목",
      label: "화장품법 시행규칙 [별표 5] 제2호 가목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/deccInfoP.do?deccSeq=233329&mode=3",
      note: "의약품 오인 우려 내용 및 효능·효과 광고 금지.",
    },
  ],
  "cosmetics.functional_scope": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-2",
      locator: "제13조제1항제2호",
      label: "화장품법 제13조제1항제2호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773305",
      note: "기능성화장품 오인 및 심사결과와 다른 광고 금지.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-na",
      locator: "[별표 5] 제2호 나목",
      label: "화장품법 시행규칙 [별표 5] 제2호 나목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsRvsDocListP.do?chrClsCd=010202&lsId=008741&lsRvsGubun=all",
      note: "기능성화장품 오인 광고 금지.",
    },
  ],
  "cosmetics.functional_category_mismatch": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-2",
      locator: "제13조제1항제2호",
      label: "화장품법 제13조제1항제2호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773305",
      note: "심사 결과와 다르거나 기능성화장품으로 잘못 인식할 우려가 있는 광고 금지.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-na",
      locator: "[별표 5] 제2호 나목",
      label: "화장품법 시행규칙 [별표 5] 제2호 나목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsRvsDocListP.do?chrClsCd=010202&lsId=008741&lsRvsGubun=all",
      note: "기능성화장품 오인 및 심사 결과와 다른 광고 금지.",
    },
  ],
  "cosmetics.ingredient_transfer": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
      note: "사실과 다르거나 소비자 오인 우려가 있는 광고 금지 일반 조항.",
    },
    {
      sourceId: "cosmetics-act",
      anchorId: "article-14-paragraph-1",
      locator: "제14조제1항",
      label: "화장품법 제14조제1항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1015734703",
      note: "광고 중 사실 관련 사항 실증 의무.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-sa",
      locator: "[별표 5] 제2호 사목",
      label: "화장품법 시행규칙 [별표 5] 제2호 사목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458852&mode=2&ofiClsCd=350123",
      note: "부분적으로 사실이라도 전체적으로 소비자 오인 우려가 있는 광고 금지.",
    },
  ],
  "cosmetics.side_effect_misleading": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
      note: "부작용을 부정하거나 치료 과정처럼 읽히는 안전성 관련 표현은 소비자 오인 우려가 있는 광고로 볼 수 있다.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-sa",
      locator: "[별표 5] 제2호 사목",
      label: "화장품법 시행규칙 [별표 5] 제2호 사목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458726&mode=2&ofiClsCd=350123",
      note: "사실과 다르거나 소비자가 사실로 오인할 수 있는 표현 금지.",
    },
  ],
  "cosmetics.procedure_like_claim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
      note: "의료시술이나 화장품 범위를 벗어난 사용방법으로 오인될 표현은 소비자 오인 우려가 있는 광고로 볼 수 있다.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-sa",
      locator: "[별표 5] 제2호 사목",
      label: "화장품법 시행규칙 [별표 5] 제2호 사목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458726&mode=2&ofiClsCd=350123",
      note: "사실과 다르거나 소비자가 오인할 수 있는 사용방법 광고 금지.",
    },
  ],
  "cosmetics.skin_age_claim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
      note: "피부나이가 몇 년 감소하거나 어려진다고 단정하는 표현은 사실과 다르게 소비자를 오인시킬 우려가 있다.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-sa",
      locator: "[별표 5] 제2호 사목",
      label: "화장품법 시행규칙 [별표 5] 제2호 사목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458726&mode=2&ofiClsCd=350123",
      note: "소비자가 사실로 오인할 수 있는 표현 금지.",
    },
  ],
  "cosmetics.natural_organic_claim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
      note: "천연·유기농으로 읽히는 표현은 사실과 다르거나 소비자가 오인하지 않도록 광고되어야 한다.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-sa",
      locator: "[별표 5] 제2호 사목",
      label: "화장품법 시행규칙 [별표 5] 제2호 사목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458726&mode=2&ofiClsCd=350123",
      note: "사실과 다르거나 소비자가 잘못 인식할 우려가 있는 광고 금지.",
    },
  ],
  "cosmetics.vegan_claim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
      note: "비건으로 읽히는 표시·광고도 사실과 다르거나 소비자가 오인할 우려가 없어야 한다.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-sa",
      locator: "[별표 5] 제2호 사목",
      label: "화장품법 시행규칙 [별표 5] 제2호 사목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458726&mode=2&ofiClsCd=350123",
      note: "사실과 다르거나 소비자가 오인할 우려가 있는 광고 금지.",
    },
  ],
  "cosmetics.iso_index_claim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-14-paragraph-1",
      locator: "제14조제1항",
      label: "화장품법 제14조제1항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1015734703",
      note: "ISO 지수처럼 사실 관련 표시·광고는 실증할 수 있어야 한다.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-23-paragraph-1",
      locator: "제23조제1항",
      label: "화장품법 시행규칙 제23조제1항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=273053",
      note: "실증이 필요한 표시·광고 대상을 정하는 시행규칙 근거.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-23-paragraph-2",
      locator: "제23조제2항",
      label: "화장품법 시행규칙 제23조제2항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=273053",
      note: "실증자료의 범위 및 요건을 정하는 시행규칙 근거.",
    },
  ],
  "cosmetics.banned_ingredient_free_claim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
      note: "배합금지 원료를 사용하지 않았다는 표현은 소비자를 기만하거나 사실과 다르게 이해하게 할 우려가 있다.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-sa",
      locator: "[별표 5] 제2호 사목",
      label: "화장품법 시행규칙 [별표 5] 제2호 사목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458726&mode=2&ofiClsCd=350123",
      note: "사실과 다르거나 소비자가 오인할 수 있는 표현 금지.",
    },
  ],
  "cosmetics.specific_ingredient_free_claim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-14-paragraph-1",
      locator: "제14조제1항",
      label: "화장품법 제14조제1항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1015734703",
      note: "특정 성분이 들어 있지 않다는 사실 관련 표시·광고는 실증할 수 있어야 한다.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-23-paragraph-1",
      locator: "제23조제1항",
      label: "화장품법 시행규칙 제23조제1항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=273053",
      note: "실증이 필요한 표시·광고 대상을 정하는 시행규칙 근거.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-23-paragraph-2",
      locator: "제23조제2항",
      label: "화장품법 시행규칙 제23조제2항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=273053",
      note: "시험분석자료 등 실증자료 범위와 요건을 정하는 시행규칙 근거.",
    },
  ],
  "cosmetics.patent_claim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-14-paragraph-1",
      locator: "제14조제1항",
      label: "화장품법 제14조제1항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1015734703",
      note: "특허 관련 사실 표시·광고는 실증할 수 있어야 한다.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-23-paragraph-1",
      locator: "제23조제1항",
      label: "화장품법 시행규칙 제23조제1항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=273053",
      note: "실증이 필요한 표시·광고 대상을 정하는 시행규칙 근거.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-23-paragraph-2",
      locator: "제23조제2항",
      label: "화장품법 시행규칙 제23조제2항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=273053",
      note: "실증자료의 범위 및 요건을 정하는 시행규칙 근거.",
    },
  ],
  "cosmetics.patent_overclaim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
      note: "특허 명칭이나 내용을 이용해 소비자를 오인시키는 표현 금지.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-sa",
      locator: "[별표 5] 제2호 사목",
      label: "화장품법 시행규칙 [별표 5] 제2호 사목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458726&mode=2&ofiClsCd=350123",
      note: "사실과 다르거나 소비자가 오인할 수 있는 표현 금지.",
    },
  ],
  "cosmetics.human_derived_claim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
      note: "줄기세포, 엑소좀, 인체 세포·조직 배양액처럼 인체 유래 성분이 들어 있는 것으로 오인될 수 있는 표현은 사실과 다르거나 소비자를 오인시킬 우려가 있다.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-sa",
      locator: "[별표 5] 제2호 사목",
      label: "화장품법 시행규칙 [별표 5] 제2호 사목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458726&mode=2&ofiClsCd=350123",
      note: "사실과 다르거나 소비자가 오인할 수 있는 표현 금지.",
    },
  ],
  "cosmetics.absolute_claim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-ba",
      locator: "[별표 5] 제2호 바목",
      label: "화장품법 시행규칙 [별표 5] 제2호 바목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458726&mode=2&ofiClsCd=350123",
      note: "배타성을 띤 최고·최상 등의 절대적 표현 광고 금지.",
    },
  ],
  "cosmetics.testimonial_claim": [],
  "cosmetics.authority_certification": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
      note: "허가·인증·공인처럼 소비자를 오인시킬 우려가 있는 광고 금지 일반 조항.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-sa",
      locator: "[별표 5] 제2호 사목",
      label: "화장품법 시행규칙 [별표 5] 제2호 사목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458726&mode=2&ofiClsCd=350123",
      note: "사실과 다르거나 전체적으로 소비자 오인을 일으킬 우려가 있는 광고 금지.",
    },
  ],
  "cosmetics.evidence_overlay": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-14-paragraph-1",
      locator: "제14조제1항",
      label: "화장품법 제14조제1항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1015734703",
      note: "표시·광고 중 사실과 관련한 사항은 실증할 수 있어야 한다는 상위 법률 근거.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-23-paragraph-1",
      locator: "제23조제1항",
      label: "화장품법 시행규칙 제23조제1항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=273053",
      note: "실증이 필요한 표시·광고의 대상을 정하는 시행규칙 근거.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-23-paragraph-2",
      locator: "제23조제2항",
      label: "화장품법 시행규칙 제23조제2항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=273053",
      note: "실증자료의 범위 및 요건을 정하는 시행규칙 근거.",
    },
  ],
  "cosmetics.comparison_claim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-14-paragraph-1",
      locator: "제14조제1항",
      label: "화장품법 제14조제1항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1015734703",
      note: "비교 대상과 수치 우위가 포함된 사실 관련 광고는 실증할 수 있어야 한다.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-23-paragraph-1",
      locator: "제23조제1항",
      label: "화장품법 시행규칙 제23조제1항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=273053",
      note: "소비자 오인 우려가 있는 비교·우위 광고는 실증 대상이 될 수 있다.",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-ba",
      locator: "[별표 5] 제2호 바목",
      label: "화장품법 시행규칙 [별표 5] 제2호 바목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458426&mode=2&ofiClsCd=350123",
      note: "비교 대상과 기준을 분명히 밝히고 객관적으로 확인 가능한 사항만 광고해야 한다.",
    },
  ],
  "cosmetics.ranking_claim": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-ba",
      locator: "[별표 5] 제2호 바목",
      label: "화장품법 시행규칙 [별표 5] 제2호 바목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458426&mode=2&ofiClsCd=350123",
      note: "배타성을 띤 최고·최상 등의 절대적 표현 광고 금지.",
    },
  ],
  "cosmetics.expert_endorsement": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-da",
      locator: "[별표 5] 제2호 다목",
      label: "화장품법 시행규칙 [별표 5] 제2호 다목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458516&mode=2&ofiClsCd=350123",
      note: "의약 분야 전문가 지정·공인·추천 암시 광고 금지.",
    },
  ],
  "cosmetics.general_misleading": [
    {
      sourceId: "cosmetics-act",
      anchorId: "article-13-paragraph-1-item-4",
      locator: "제13조제1항제4호",
      label: "화장품법 제13조제1항제4호",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1011773109",
    },
    {
      sourceId: "cosmetics-act",
      anchorId: "article-14-paragraph-1",
      locator: "제14조제1항",
      label: "화장품법 제14조제1항",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lsLawLinkInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1015734703",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "article-22",
      locator: "제22조",
      label: "화장품법 시행규칙 제22조",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=123252",
    },
    {
      sourceId: "enforcement-rule",
      anchorId: "appendix-5-item-2-subitem-sa",
      locator: "[별표 5] 제2호 사목",
      label: "화장품법 시행규칙 [별표 5] 제2호 사목",
      status: "verified",
      discoverySourceUrl:
        "https://www.law.go.kr/LSW/cgmExpcInfoP.do?cgmExpcDatSeq=458726&mode=2&ofiClsCd=350123",
    },
  ],
};

export function resolveLawCitations(rule: RuleDefinition): CitationAnchor[] {
  const configuredTargets = CURATED_LAW_CITATION_MAP[rule.id] ?? [];

  return configuredTargets
    .filter((target) => target.status === "verified")
    .map((target) => {
      const anchor = getLawAnchorRecord(target.sourceId, target.anchorId);

      if (!anchor) {
        return null;
      }

      return {
        sourceId: target.sourceId,
        anchorId: anchor.anchorId,
        locator: anchor.locator,
        label: anchor.label,
        excerpt: anchor.excerpt,
      };
    })
    .filter((citation): citation is CitationAnchor => citation !== null);
}

export function getCuratedLawCitationTargets(
  ruleId: string,
): CuratedLawCitationTarget[] {
  return CURATED_LAW_CITATION_MAP[ruleId] ?? [];
}
