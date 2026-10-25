# 캡챠(CAPCHA) 소개 사이트

어르신 댁에 직접 찾아가 인생 이야기를 인터뷰하고 영상과 책으로 남겨 드리는 서비스의 소개 사이트입니다.
HTML · CSS · 순수 JavaScript로만 만든 정적 사이트이며 빌드 과정이 없습니다.

이 문서는 사이트 주인이 읽는 안내서입니다. Cloudflare Pages에는 `site` 폴더만 올리므로 이 문서와 `tools` 폴더는 인터넷에 공개되지 않습니다.

---

## 1. 폴더 구성

```
capcha/
├── README.md              이 문서 (올리지 않음)
├── tools/
│   └── family-id.html     가족 영상 페이지 이름 만들기 도구 (내 컴퓨터에서만 사용 · 올리지 않음)
└── site/                  ← Cloudflare Pages에 올리는 폴더
    ├── index.html         메인
    ├── apply.html         신청 안내
    ├── story-form.html    사전 질문지 안내
    ├── 404.html           없는 주소 안내
    ├── family/
    │   └── sample.html    가족 영상 페이지 템플릿 (검색 제외)
    ├── css/style.css      모든 디자인
    ├── js/main.js         첫 화면 슬라이드 · 서서히 나타나기
    ├── fonts/             Paperlogy 3종 · Noto Serif KR 라틴 부분 · 라이선스 2종
    ├── favicon.svg        브라우저 탭 아이콘
    └── _headers           Cloudflare Pages 응답 헤더 설정
```

메인 페이지 순서는 첫 화면(슬라이드 3장) → 탭 3개와 진행 막대 → 왜 캡챠인가 → 결과물 3가지 → 진행 과정 → 자주 묻는 질문 → 신청 버튼입니다.

---

## 2. 내 컴퓨터에서 미리 보기

### 방법 1. 간이 서버로 열기 (권장)

Python이 설치되어 있으면 가장 정확하게 볼 수 있습니다.

1. 터미널을 엽니다. (Windows는 PowerShell · Mac은 터미널)
2. `site` 폴더로 이동합니다.
   ```
   cd 내려받은위치/capcha/site
   ```
3. 아래 명령을 실행합니다. Windows는 `python` · Mac은 `python3`입니다.
   ```
   python -m http.server 8000
   ```
4. 브라우저 주소창에 `http://localhost:8000` 을 입력합니다.
5. 끝낼 때는 터미널에서 `Ctrl + C`를 누릅니다.

Python이 없다는 메시지가 나오면 VS Code의 Live Server 확장 기능으로 `site/index.html`을 열어도 됩니다.

### 방법 2. 파일을 더블클릭해서 열기

`site/index.html`을 더블클릭해도 대부분의 화면은 보입니다. 다만 아래 두 가지는 이 방법으로 확인할 수 없습니다.

- 가족 영상 페이지의 유튜브 영상: 유튜브 삽입 영상은 HTTP Referer 정보가 없으면 153 오류를 냅니다. 파일로 연 페이지는 이 정보를 보내지 않으므로 영상이 나오지 않을 수 있습니다. (추측입니다. 근거는 10장의 153 오류 자료입니다.)
- 404 페이지와 `_headers` 설정: Cloudflare Pages에 올린 뒤에만 동작합니다.

---

## 3. 바꿔야 할 자리표시 목록

대괄호 `[ ]` 로 표시한 곳이 자리표시입니다. VS Code에서 `Ctrl + Shift + H`(폴더에서 바꾸기)를 쓰면 여러 파일을 한 번에 바꿀 수 있습니다.

| 자리표시 | 넣을 내용 | 들어 있는 파일 (개수) |
|---|---|---|
| `[신청 구글폼 주소]` | 신청서 구글 설문지 공유 주소 (`https://docs.google.com/forms/...` 또는 `https://forms.gle/...`) | apply.html (1) |
| `[질문지 구글폼 주소]` | 사전 질문지 구글 설문지 공유 주소 | story-form.html (1) |
| `[처리방침 주소]` | 개인정보 처리방침 페이지 주소 | index (1) · apply (2) · story-form (2) · family/sample (1) · 404 (1) |
| `[이메일]` | 문의 이메일 주소 (`mailto:` 링크 안에도 들어 있으므로 한 번에 모두 바꿉니다) | index (6) · apply (4) · story-form (6) · family/sample (4) · 404 (4) |
| `[유튜브 ID]` | 유튜브 영상 ID (5장 참고) | family/sample.html (3) |
| `[영상 제목]` | 가족 영상 페이지 제목 | family/sample.html (3) |
| `[차별점 1]` `[차별점 2]` `[차별점 3]` | 왜 캡챠인가 제목 3개 | index.html |
| `[차별점 1 설명 문장]` 등 3개 | 왜 캡챠인가 설명 3개 | index.html |
| `[촬영 시간 · 제작 기간]` | 자주 묻는 질문 답변 | index.html |
| `[사이트 주소]` | tools/family-id.html 입력 칸 기본값 (선택) | tools/family-id.html |

### 3-1. 왜 캡챠인가 문장 예시

받은 서비스 정보만으로 만든 예시입니다. 그대로 쓰거나 고쳐 쓰면 됩니다. index.html 안 주석에도 같은 예시를 적어 두었습니다.

| 자리 | 제목 예시 | 설명 예시 |
|---|---|---|
| 차별점 1 | 어르신 댁으로 찾아갑니다 | 익숙한 집에서 편하게 이야기를 나눕니다. |
| 차별점 2 | 자녀의 질문을 인터뷰에 담습니다 | 사전 질문지로 자녀가 부모님께 묻고 싶은 질문을 미리 받습니다. |
| 차별점 3 | 글과 목소리를 함께 남깁니다 | 책 속 QR을 찍으면 인터뷰 영상이 열립니다. |

다른 후보로 "촬영 뒤에도 이야기를 더합니다 / 촬영 뒤에 찾은 사진과 이야기도 반영합니다."를 쓸 수 있습니다.

### 3-2. 사진 자리 10곳

| 파일 | 자리표시 글자 | 크기 (가로x세로) |
|---|---|---|
| index.html | 어르신 댁 거실에서 인터뷰하는 장면 | 1600x900 |
| index.html | 카메라 앞에서 이야기하는 어르신 | 1600x900 |
| index.html | 펼쳐 놓은 생애 기록 책과 QR | 1600x900 |
| index.html | 부모님과 자녀가 함께 옛 앨범을 보는 장면 | 1920x800 |
| index.html | 인터뷰 영상의 한 장면 | 1200x800 |
| index.html | 펼쳐 놓은 생애 기록 책 | 1200x800 |
| index.html | 실사형 · 캐릭터형 3D 피규어 | 1200x800 |
| index.html | 두 손으로 옛 사진을 든 모습 | 1920x800 |
| apply.html | 부모님 손을 잡은 자녀의 손 | 1920x700 |
| story-form.html | 탁자 위에 펼쳐 놓은 옛 사진들 | 1920x700 |

바꾸는 방법은 아래와 같습니다.

1. `site/images` 폴더를 만들고 사진을 넣습니다. (예: `hero-1.jpg`)
2. 자리표시 상자 한 줄을 `<img>` 한 줄로 바꿉니다. 어두운 덮개와 크기 맞춤은 CSS가 자동으로 처리합니다.

```html
<!-- 바꾸기 전 -->
<div class="ph ph-dark ph-corner" role="img" aria-label="사진 준비 중: 어르신 댁에서 인터뷰하는 장면">[어르신 댁 거실에서 인터뷰하는 장면 · 1600x900]</div>

<!-- 바꾼 뒤 -->
<img src="images/hero-1.jpg" alt="거실 소파에 앉아 인터뷰하는 어르신" width="1600" height="900">
```

- `alt`에는 사진에 보이는 내용을 짧게 적습니다.
- 사진은 실제 고객의 동의를 받은 사진이나 사용 권한이 있는 사진만 씁니다.
- 파일 용량이 작을수록 빨리 열립니다. Cloudflare Pages 끌어다 놓기 업로드는 파일 하나당 25MiB까지 받습니다.

---

## 4. 구글 설문지 2개에 넣을 질문

### 4-1. 확인한 사실: 구글 설문지 파일 업로드 제약

| 내용 | 근거 |
|---|---|
| 파일 업로드 문항에 답하려면 응답자가 구글 계정에 로그인해야 합니다. | Google 문서 편집기 고객센터 (공식) |
| 파일 업로드 문항이 하나라도 있으면 설문지 전체가 로그인을 요구합니다. 이메일 주소 수집을 '확인됨'으로 두거나 응답을 1회로 제한해도 로그인을 요구합니다. | Google Docs Editors Community 가이드 (커뮤니티 전문가 작성 · 공식 도움말은 아님) |
| 올린 파일은 설문지 주인의 구글 드라이브에 설문지별 폴더로 저장됩니다. | Google Workspace 학습 센터 (공식) |
| 공유 드라이브에 있는 설문지에서는 파일 업로드 문항을 쓸 수 없습니다. 관리자가 데이터 손실 방지(DLP)를 켠 회사·학교 계정도 쓸 수 없습니다. | Google 문서 편집기 고객센터 (공식) |
| 주인이 파일 형식 · 최대 파일 수 · 최대 파일 크기를 정할 수 있습니다. | Google 공식 도움말 |
| 파일 수는 1 · 5 · 10개 · 파일 크기는 1MB~10GB 중에서 고르고 설문지 전체 한도는 기본 1GB라는 설명이 있습니다. | 확실하지 않음 (제3자 안내 글 기준 · 공식 수치 확인 못 함) |
| 올린 파일은 주인의 구글 드라이브 저장 용량을 차지합니다. | 확실하지 않음 (제3자 안내 글 기준) |

정리하면 사전 질문지에 사진 문항을 넣으면 구글 계정이 없는 가족은 질문지 전체를 작성할 수 없습니다. 그래서 사이트 안내 문구에 이메일로 보내는 방법을 함께 넣었습니다.

두 가지 운영 방법 중 하나를 고르면 됩니다.

- A안 (현재 사이트 문구 기준): 사전 질문지에 사진 문항을 넣습니다. 모든 응답자가 로그인해야 하며 로그인이 어려운 가족은 이메일로 받습니다.
- B안: 사전 질문지에서 사진 문항을 빼고 사진은 이메일로만 받습니다. 질문지는 로그인 없이 작성할 수 있습니다. B안을 고르면 아래 문구를 고칩니다.
  - story-form.html: "방법 1 · 질문지에 바로 올리기" 타일 삭제 · 맨 아래 "질문지에 사진 문항이 있어 구글 계정 로그인이 필요합니다." 문장 삭제
  - index.html: 자주 묻는 질문 "옛 사진은 어떻게 보내나요?" 답변을 이메일 안내로 수정

신청서에는 파일 업로드 문항을 넣지 않습니다. 그래야 로그인 없이 신청할 수 있습니다. 이메일 주소 수집과 응답 1회 제한도 끕니다.

### 4-2. 신청서 질문 목록

| 번호 | 질문 | 구글 설문지 질문 유형 | 필수 | 메모 |
|---|---|---|---|---|
| 1 | 신청하는 자녀 이름 | 단답형 | 필수 | |
| 2 | 연락처 (휴대폰 번호) | 단답형 | 필수 | 설명란: 상담 연락에만 씁니다. |
| 3 | 부모님 연세대 | 객관식 | 필수 | 60대 · 70대 · 80대 · 90대 이상 · 기타 |
| 4 | 지역 | 객관식 | 필수 | 대전 동구 · 중구 · 서구 · 유성구 · 대덕구 · 기타(직접 입력) |
| 5 | 원하는 결과물 | 체크박스 | 필수 | 인터뷰 영상 · 생애 기록 책 · 3D 피규어 실사형 · 3D 피규어 캐릭터형 · 상담 후 결정 |
| 6 | 희망 시기 | 단답형 | 필수 | 예: 2027년 3월 · 아버지 칠순 잔치 전 |
| 7 | 개인정보 수집 · 이용 동의 | 체크박스 (선택지 1개: 동의합니다) | 필수 | 설명란에 아래 동의 문구를 넣습니다. |

동의 문구 예시입니다. 개인정보 보호법 제15조 제2항은 동의를 받을 때 네 가지를 알리도록 정하고 있습니다. 보유 기간은 직접 정해야 하므로 자리표시로 두었습니다.

```
[개인정보 수집 · 이용 동의]
1. 수집 · 이용 목적: 상담 연락 및 서비스 안내
2. 수집 항목: 신청자 이름 · 연락처 · 부모님 연세대 · 지역 · 원하는 결과물 · 희망 시기
3. 보유 및 이용 기간: [보유 기간]
4. 동의를 거부할 권리가 있습니다. 동의하지 않으면 신청 접수와 상담이 어렵습니다.
자세한 내용은 개인정보 처리방침([처리방침 주소])에서 확인할 수 있습니다.
```

위 문구는 법률 자문이 아닌 작성 예시입니다. 실제 운영 전에 개인정보 처리방침과 함께 확인하는 것을 권합니다.

### 4-3. 사전 질문지 질문 목록

| 번호 | 질문 | 구글 설문지 질문 유형 | 필수 | 메모 |
|---|---|---|---|---|
| 1 | 신청하신 분(자녀) 이름 | 단답형 | 필수 | 추가 제안: 신청서와 맞춰 보기 위한 문항 |
| 2 | 부모님의 사소한 일상 | 장문형 | 선택 | 설명란 예: 즐겨 드시는 음식 · 자주 하시는 말씀 · 하루를 보내는 모습 |
| 3 | 간직하고 싶은 이야기 | 장문형 | 선택 | 설명란 예: 처음 만난 날 · 고향 이야기 |
| 4 | 자녀가 부모님께 묻고 싶은 질문 | 장문형 | 선택 | 설명란: 인터뷰 때 여쭙니다. |
| 5 | 옛 사진 | 파일 업로드 (이미지만 허용) | 선택 | A안일 때만 넣습니다. 로그인 필요 |
| 6 | 사진 설명 | 장문형 | 선택 | 언제 · 어디서 · 누구와 찍은 사진인지 |
| 7 | 개인정보 수집 · 이용 동의 | 체크박스 (동의합니다) | 필수 | 4-2와 같은 형식으로 목적 · 항목 · 기간 · 거부 권리를 적습니다. |

사전 질문지에는 부모님에 관한 이야기와 사진이 들어갑니다. 부모님 정보에 대한 동의를 누구에게 어떤 방식으로 받아야 하는지는 확실하지 않습니다. 운영 전에 전문가 확인을 권합니다.

---

## 5. 가족마다 추측하기 어려운 주소로 영상 페이지 만들기

### 5-1. 순서

1. 유튜브에 영상을 '일부 공개'로 올립니다. YouTube 스튜디오 → 콘텐츠 → 영상의 공개 상태 → 일부 공개 순서입니다.
2. 영상 ID를 확인합니다.
   - `https://www.youtube.com/watch?v=AbCdEfGhIjK` 이면 `v=` 뒤의 `AbCdEfGhIjK`
   - `https://youtu.be/AbCdEfGhIjK` 이면 마지막 `AbCdEfGhIjK`
3. 페이지 이름을 만듭니다. `tools/family-id.html`을 더블클릭하면 헷갈리기 쉬운 글자(0 · o · 1 · l · i)를 뺀 영문 소문자와 숫자로 12자리 이름을 만들어 줍니다. 경우의 수는 31의 12제곱(약 79경)입니다.
   - 도구를 쓰지 않을 때도 이름 · 생일 · 전화번호처럼 추측할 수 있는 정보는 넣지 않습니다.
4. `site/family/sample.html`을 복사해서 `site/family/만든이름.html`로 저장합니다. (예: `site/family/k7m2q9x4w8pd.html`)
5. 복사한 파일에서 `[유튜브 ID]` 3곳과 `[영상 제목]` 3곳을 바꿉니다. `noindex` 줄은 지우지 않습니다.
6. 6장 순서로 사이트를 다시 올립니다.
7. QR 코드에는 `https://사이트주소/family/만든이름` 을 넣습니다. Cloudflare Pages는 `.html`로 끝나는 주소를 `.html` 없는 주소로 넘겨 주므로 두 주소 모두 열립니다.
8. 휴대폰으로 QR을 찍어 영상이 나오는지 확인한 뒤 책에 넣습니다.

### 5-2. 알고 있어야 할 점

- 일부 공개 영상은 링크를 아는 사람이면 누구나 보고 공유할 수 있습니다. 완전한 비공개가 아닙니다. 사이트 문구에도 이 내용을 적어 두었습니다.
- 가족 페이지는 두 겹으로 검색에서 뺐습니다. 페이지 안의 `<meta name="robots" content="noindex, nofollow">`와 `_headers`의 `X-Robots-Tag` 헤더입니다.
- `robots.txt`로 family 폴더를 막지 않습니다. 검색 로봇이 페이지를 읽지 못하면 noindex도 읽지 못해서 오히려 검색 결과에 주소가 나올 수 있습니다.
- 사이트의 다른 페이지에는 가족 페이지 링크를 걸지 않습니다. 지금도 걸려 있지 않습니다.
- 영상은 유튜브 개인정보 보호 강화 모드 주소(`youtube-nocookie.com`)로 넣었습니다. 이 모드는 삽입 영상 시청 기록이 유튜브 맞춤 추천 등에 영향을 주지 않게 하는 기능입니다. 유튜브 쪽 쿠키나 기록이 전혀 없다는 뜻인지는 확실하지 않습니다.
- 영상 칸에는 `referrerpolicy="strict-origin-when-cross-origin"`을 넣었습니다. 유튜브는 이 정보가 없으면 153 오류를 내고 이 설정은 가족 페이지 주소 전체가 아니라 사이트 도메인만 보냅니다.
- 영상을 내릴 때는 해당 html 파일을 지우고 다시 올린 뒤 유튜브 영상도 비공개로 바꾸거나 삭제합니다.

---

## 6. Cloudflare Pages에 올리는 순서

Cloudflare 화면의 메뉴 이름은 바뀔 수 있습니다. 아래는 2026년 10월에 확인한 공식 문서 기준입니다.

### 6-1. 처음 올릴 때

1. Cloudflare 계정을 만들고 대시보드에 로그인합니다.
2. 왼쪽 메뉴에서 Workers & Pages로 갑니다.
3. Create application → Pages → Use direct upload(또는 끌어다 놓기 업로드)를 고릅니다.
4. 프로젝트 이름을 적습니다. (예: `capcha`) 사이트 주소는 `프로젝트이름.pages.dev`가 됩니다.
5. `capcha/site` 폴더를 끌어다 놓습니다. zip 파일도 받습니다.
6. Deploy site를 누릅니다.
7. 주소를 열어 첫 화면이 바로 나오는지 확인합니다. 첫 화면이 나오지 않고 폴더 이름이 주소에 섞여 있으면 `site` 폴더 안의 파일들만 골라 zip으로 묶어 다시 올립니다. (이 부분은 화면에서 직접 확인이 필요합니다.)

### 6-2. 고친 뒤 다시 올릴 때

1. Workers & Pages에서 프로젝트를 엽니다.
2. Create new deployment를 누르고 Production을 고릅니다.
3. 고친 `site` 폴더를 다시 통째로 올립니다.

### 6-3. 알아 둘 점

- 끌어다 놓기 업로드는 파일 1,000개 · 파일 하나당 25MiB까지 받습니다. 지금 `site` 폴더는 파일 15개 · 약 2.1MB입니다.
- 직접 업로드(Direct Upload)로 만든 프로젝트는 나중에 Git 연동 방식으로 바꿀 수 없습니다. Git 연동을 원하면 새 프로젝트를 만들어야 합니다.
- 맨 위에 `404.html`이 없으면 Cloudflare Pages는 사이트를 한 페이지짜리 앱으로 보고 없는 주소에도 첫 화면을 보여 줍니다. 그래서 `404.html`을 넣었습니다.
- `_headers` 파일은 사이트 폴더 맨 위에 두면 Cloudflare Pages가 읽고 방문자에게는 파일로 보이지 않습니다.
- Cloudflare는 미리보기 배포 주소에 기본으로 `X-Robots-Tag: noindex`를 붙입니다.
- Cloudflare 문서는 새 프로젝트에 Workers를 쓰라고 안내하고 있습니다. 다만 Pages 직접 업로드도 계속 문서에 안내되어 있어 이 사이트에는 그대로 써도 됩니다.
- Web Analytics 같은 방문자 분석 기능은 켜지 않습니다.
- 내 도메인을 연결하려면 프로젝트의 Custom domains 메뉴를 씁니다. (선택)
- GitHub Pages를 쓰지 않는 이유: GitHub 문서는 GitHub Pages를 온라인 사업 운영용 무료 호스팅으로 쓰는 것을 허용하지 않는다고 적고 있습니다.

---

## 7. 이 사이트가 하지 않는 것

- 결제 · 회원가입 · 로그인 기능이 없습니다.
- 입력 칸이 없습니다. 이름 · 연락처 · 사진을 사이트 안에 저장하거나 외부로 보내지 않습니다. 신청과 질문지는 구글 설문지 링크로만 받습니다.
- 방문자 추적 도구와 광고 코드가 없습니다. 쿠키 · localStorage도 쓰지 않습니다.
- 글꼴은 사이트 안에 넣었습니다. Google Fonts 같은 외부 글꼴 서버를 부르지 않습니다.
- 외부로 나가는 요청은 가족 영상 페이지의 유튜브 영상 하나뿐입니다.
- 후기 · 고객 수 · 실적 · 수상 같은 문장이나 숫자는 넣지 않았습니다. 현재 상태는 "시범 제작 중"으로만 적었습니다.

---

## 8. 디자인과 접근성 메모

### 8-1. 참고 사이트에서 빌린 것과 빌리지 않은 것

- 빌린 것은 레이아웃 느낌뿐입니다. 꽉 찬 사진 위 어두운 덮개 · 가운데 흰 글씨 · 양옆 가는 선의 영문 대문자 문구 · 큰 세리프 영문 제목 · 테두리만 있는 둥근 버튼 · 가운데 로고와 아래 가로 메뉴 · 첫 화면 아래 탭 3개와 얇은 진행 막대 · 넓은 여백 · 흰색과 옅은 회색 번갈아 쓰기 · 어두운 사진 띠 위에 겹친 카드 · 가운데 정렬 하단과 둥근 TOP 버튼입니다.
- 로고 · 사진 · 문구 · 코드 · 브랜드명은 가져오지 않았습니다. 모든 문구와 코드는 새로 썼습니다.

### 8-2. 색과 글자 대비

WCAG 기준은 일반 글자 4.5:1 이상입니다. 아래 수치는 WCAG 공식 계산식으로 직접 계산했습니다.

| 조합 | 대비 |
|---|---|
| 제목 #222 / 흰색 | 15.91:1 |
| 본문 #666 / 흰색 | 5.74:1 |
| 본문 #666 / 옅은 회색 #F5F5F5 | 5.27:1 |
| 앰버 #D9A066 / 흰색 | 2.29:1 → 글자에 쓰지 않고 선 · 진행 막대 · 점에만 사용 |
| 진한 앰버 #8A5A22 / 흰색 | 5.89:1 → 흰 바탕 위 작은 영문 문구와 번호에 사용 |
| #222 글자 / 앰버 #D9A066 바탕 | 6.95:1 → '선택' 표시에 사용 |
| 흰 글자 / 가장 밝은 사진 위 60% 덮개 | 5.74:1 이상 |

### 8-3. 움직임과 키보드

- 움직임은 서서히 나타나기와 슬라이드 페이드뿐입니다. 운영체제의 움직임 줄이기 설정을 켜면 모두 꺼지고 슬라이드도 자동으로 넘어가지 않습니다.
- 첫 화면 슬라이드는 7초마다 넘어가며 오른쪽 둥근 버튼으로 멈출 수 있습니다. 마우스를 올리거나 키보드로 들어오면 멈춥니다. 간격은 `css/style.css`의 `--hero-interval`에서 바꿉니다.
- 키보드: Tab으로 메뉴와 버튼을 이동합니다. 첫 Tab에서 "본문 바로가기"가 나옵니다. 슬라이드 탭은 왼쪽 · 오른쪽 화살표와 Home · End로 고릅니다. 자주 묻는 질문은 Enter나 Space로 엽니다.
- 점검 결과: axe-core 4.10.2 자동 검사(WCAG 2.1 A · AA)에서 5개 페이지 모두 위반 0건 · 휴대폰(390px)과 PC(1440px) 모두 가로 넘침 0px였습니다. 자동 검사는 모든 문제를 찾지 못하므로 실제 화면 읽기 프로그램 확인을 함께 권합니다.

---

## 9. 글꼴과 라이선스

| 글꼴 | 쓰는 곳 | 파일 | 라이선스 |
|---|---|---|---|
| Paperlogy (페이퍼로지) 400 · 500 · 700 | 한국어 전체 | `fonts/Paperlogy-4Regular.ttf` 등 3개 · 약 2MB | SIL Open Font License 1.1 (글꼴 파일 안의 라이선스 정보로 확인) · `fonts/OFL-Paperlogy.txt` |
| Noto Serif KR 라틴 부분 400 | 큰 영문 제목 · 로고 | `fonts/noto-serif-kr-latin-400-normal.woff2` · 19KB | SIL Open Font License 1.1 · `fonts/OFL-NotoSerifKR.txt` (npm `@fontsource/noto-serif-kr` 5.3.1에서 가져옴) |

- Paperlogy는 받은 파일을 고치지 않고 그대로 넣었습니다. 9가지 굵기 중 실제로 쓰는 3가지만 넣었습니다.
- 브라우저는 화면에 쓰인 굵기의 파일만 내려받습니다.

---

## 10. 확인한 자료 출처

이 세션의 네트워크 정책 때문에 아래 공식 문서 일부는 직접 열지 못하고 검색 결과의 요약과 인용으로 확인했습니다. 운영 전에 한 번 더 직접 열어 보기를 권합니다.

구글 설문지
- [Choose a type of question for your form · Google Docs Editors Help](https://support.google.com/docs/answer/7322334?hl=en) : 파일 업로드 문항 로그인 필요 · 공유 드라이브 · DLP 제약
- [Google Forms: Why Your Respondents are Being Forced to Login · Docs Editors Community](https://support.google.com/docs/community-guide/395355672/google-forms-why-your-respondents-are-being-forced-to-login?hl=en) : 로그인을 강제하는 설정
- [Tips to customize your forms · Google Workspace Learning Center](https://support.google.com/a/users/answer/13138098?hl=en) : 업로드 파일 저장 폴더
- [Google Forms File Upload: Limits and the Sign-In Requirement · dokutrak](https://dokutrak.com/blog/google-forms-file-upload) : 파일 수 · 크기 선택지 (제3자 자료)

Cloudflare Pages
- [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) : 업로드 순서 · 1,000개 · 25MiB · Git 전환 불가 · 새 배포
- [Limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/) : 404.html · 한 페이지 앱 처리 · .html 주소 넘김
- [Headers](https://developers.cloudflare.com/pages/configuration/headers/) : `_headers` 문법 · 미리보기 noindex
- [Get started (Pages)](https://developers.cloudflare.com/pages/get-started/) : Workers 권장 안내

유튜브 · 검색
- [Change video privacy settings · YouTube Help](https://support.google.com/youtube/answer/157177?hl=en) : 일부 공개의 뜻
- [Embed videos & playlists · YouTube Help](https://support.google.com/youtube/answer/171780?hl=en) : 개인정보 보호 강화 모드
- [Fixing YouTube Player Error 153 · University of Michigan](https://teamdynamix.umich.edu/TDClient/30/Portal/KB/Article/14491/Fixing-YouTube-Player-Error-153-with-Referrer-Policy-Settings) · [Simon Willison 블로그](https://simonwillison.net/2025/Dec/1/youtube-embed-153-error/) : 153 오류와 referrer 설정
- [Block Search Indexing with noindex · Google Search Central](https://developers.google.com/search/docs/crawling-indexing/block-indexing) : noindex와 robots.txt 관계

법령 · 약관
- [개인정보 보호법 제15조 · 국가법령정보센터](https://www.law.go.kr/법령/개인정보보호법) : 동의 받을 때 알릴 네 가지
- [GitHub Terms for Additional Products and Features](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features) : GitHub Pages 사업용 사용 제한

접근성
- [WCAG 2.1 대비 기준 (1.4.3)](https://www.w3.org/TR/WCAG21/#contrast-minimum)
- [WAI-ARIA 탭 방식 캐러셀 예시](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-2-tablist/)
