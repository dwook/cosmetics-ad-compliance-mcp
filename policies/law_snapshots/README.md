# Law Snapshots

이 디렉터리는 `화장품법`, `화장품법 시행령`, `화장품법 시행규칙`의 로컬 snapshot 자산을 관리한다.

현재 구조와 원칙은 다음과 같다.

- 검수 런타임은 외부 live fetch 대신 로컬 snapshot을 읽는다.
- snapshot은 외부 최신본 추적 결과를 동기화해서 생성한다.
- source별 `manifest.json`은 현재 version 포인터와 sync 상태를 관리한다.
- version 구조는 `versions/<date>/body.source.html + metadata.json + body.txt + anchors.json`을 기본으로 한다.
- 별표/서식이 본문 HTML에 직접 없으면 공식 PDF artifact와 추출 텍스트를 같은 version 디렉터리에 함께 둔다.
- 법령 citation은 lexical retrieval보다 `rule -> curated anchor mapping`을 우선한다.
- `npm run scaffold:law-snapshots`는 누락된 planned version 템플릿 파일을 다시 생성한다.
- `npm run sync:law-snapshots:from-raw`는 raw artifact에서 normalized snapshot과 anchor를 생성한다.
