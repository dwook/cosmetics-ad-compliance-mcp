# Policies Corpus

이 디렉터리는 화장품 광고 검수에 사용하는 로컬 정책 문서와 법령 snapshot 자산을 관리한다.

## 현재 구조

- `source_pdfs/`
  - 식약처 지침 PDF
  - KCIA 해설서 PDF
- `extracted_text/`
  - `pdftotext -layout`로 추출한 로컬 텍스트
  - 검수 런타임에서 참조 가능한 policy corpus의 시작점
- `anchor_indexes/`
  - policy 문서용 `page/block` citation index
  - policy 문서용 `heading/semantic` citation index
  - 현재는 `scripts/generate_policy_anchor_indexes.mjs`로 생성한다
- `law_snapshots/`
  - 법령 3종의 동기화 결과를 두는 경로
  - source별 `manifest.json`과 `versions/<date>/...`가 함께 유지된다
  - raw payload 보존, normalized body, citation anchor를 모두 저장한다
  - `npm run scaffold:law-snapshots`로 planned 템플릿을 만들 수 있다
  - `npm run sync:law-snapshots:from-raw`로 raw artifact에서 snapshot 본문/anchor를 생성한다

## 운영 원칙

- 검수 요청 시 외부 live fetch는 하지 않는다.
- 정책 문서는 저장소 내부 로컬 자산을 우선 사용한다.
- 법령 3종은 외부 최신본을 추적하되, 실제 검수는 이후 동기화된 로컬 snapshot으로 수행한다.
- PDF에서 추출된 텍스트는 `citation index`가 아니라 `full_text_ingested` 단계다.
- 정책 문서 2종은 현재 `page/block` anchor와 `heading/semantic` anchor까지 생성되어 있다.
- 법령 3종은 현재 `local_snapshot + full_text_ready + citationIndexAvailable` 상태다.
- 법령 version 디렉터리에는 `body.source.html`, `metadata.json`, `body.txt`, `anchors.json`이 함께 들어간다.
- 시행규칙 `[별표 5]`처럼 본문 HTML 밖에 있는 자료는 공식 PDF와 추출 텍스트를 함께 보존한다.
- 법령 citation은 raw artifact에서 생성된 verified anchor만 사용자 결과에 노출한다.
- 정책 citation은 `semantic anchor 우선 + page/block fallback`으로 선택한다.
