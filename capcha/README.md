# 캡챠(CAPCHA) 소개 사이트

어르신 댁에 직접 찾아가 인생 이야기를 인터뷰하고 영상과 책으로 남겨 드리는 서비스의 사이트입니다.
HTML · CSS · 순수 JavaScript로 만든 정적 사이트이며 사용하는 사람이 따로 빌드할 필요가 없습니다.
로그인과 데이터 저장은 Google Firebase(Authentication · Cloud Firestore)를 씁니다.

이 문서는 사이트 주인이 읽는 안내서입니다.

---

## 1. 지금 상태

| 항목 | 상태 |
|---|---|
| 사이트 화면 | 완성. 그림 10장 포함 · 오류 나는 버튼 없음 |
| 로그인 · 신청서 · 사전 질문지 · 문의 · 마이페이지 · 관리자 | 완성 |
| 실제 구글 로그인 | 코드 완성. Firebase 설정 값을 넣으면 켜집니다. (5장) |
| 지금 동작 방식 | 체험 모드. 설정 값이 비어 있어서 구글 로그인 대신 체험 계정(고객 · 관리자)으로 동작합니다. |

체험 모드에서는 화면 맨 위에 "체험 모드" 띠가 보입니다. 입력한 내용은 그 사람의 브라우저에만 저장되므로 멘토분께 기능을 보여 드리기에 알맞습니다.
5장 순서대로 Firebase를 연결하면 띠가 사라지고 실제 구글 로그인과 데이터베이스로 바뀝니다.

---

## 2. 폴더 구성

```
capcha/
├── README.md                이 문서
├── firebase/
│   └── firestore.rules      Firestore 보안 규칙 (Firebase 콘솔에 붙여 넣는 파일)
└── site/                    ← 인터넷에 올리는 폴더
    ├── index.html           메인
    ├── apply.html           신청하기 (안내 + 신청서)
    ├── story-form.html      사전 질문지 (사진 올리기 포함)
    ├── contact.html         문의하기
    ├── mypage.html          마이페이지 (내 신청 · 진행 상황 · 답변)
    ├── admin.html           관리자 페이지
    ├── family.html          가족 영상 페이지 (family.html?id=12자리)
    ├── privacy.html         개인정보 처리방침 (초안)
    ├── 404.html             없는 주소 안내
    ├── css/style.css        모든 디자인
    ├── js/
    │   ├── config.js        ★ Firebase 설정 값을 넣는 곳
    │   ├── backend.js       로그인 · 저장 (Firebase / 체험 모드)
    │   ├── app.js           머리글 로그인 버튼 · 체험 계정 창
    │   ├── ui.js · forms.js · records.js   화면 부품
    │   ├── main.js          첫 화면 슬라이드 · 서서히 나타나기
    │   ├── pages/           페이지별 기능 6개
    │   └── vendor/          Firebase SDK 13.1.0 일부 · QR 코드 라이브러리 · 라이선스 고지
    ├── images/              그림 10장 (직접 그린 SVG)
    ├── fonts/               Paperlogy 3종 · Noto Serif KR 영문 부분 · 라이선스
    ├── favicon.svg
    ├── _headers             Cloudflare Pages용 헤더 설정
    └── vercel.json          Vercel용 설정
```

---

## 3. 사이트 기능

| 누가 | 할 수 있는 일 |
|---|---|
| 누구나 (로그인 없이) | 모든 소개 페이지 보기 · 가족 영상 페이지를 주소로 열기 |
| 로그인한 고객 | 신청서 · 사전 질문지(사진 최대 10장) · 문의 작성, 마이페이지에서 내 기록 · 진행 상태 · 답변 보기 |
| 관리자 | 모든 신청서 보기 · 진행 상태(접수 → 상담 중 → 촬영 예정 → 제작 중 → 전달 완료 · 취소) 바꾸기 · 관리자 메모 · CSV 내려받기 · 사전 질문지와 사진 보기 · 문의 답변 · 가족 영상 페이지와 QR 코드 만들기 · 삭제 |

- 로그인하지 않은 사람이 신청서 · 사전 질문지 · 문의 · 마이페이지를 열면 "로그인이 필요합니다" 상자와 로그인 버튼이 보입니다.
- 관리자 메모는 고객 화면에 보이지 않습니다.
- 고객이 관리자 페이지 주소를 직접 열어도 "관리자 계정이 아닙니다"만 보입니다. 데이터는 보안 규칙이 막습니다.
- 가족 영상 페이지 주소는 관리자 페이지가 추측하기 어려운 12자리로 자동으로 만듭니다. (31가지 글자 · 약 79경 가지)

---

## 4. 내 컴퓨터에서 미리 보기

로그인 기능은 JavaScript 모듈을 쓰기 때문에 파일을 더블클릭하면 동작하지 않습니다. 간이 서버로 열어야 합니다.

1. 터미널을 열고 `capcha/site` 폴더로 이동합니다.
2. `python -m http.server 8000` 을 실행합니다. (Mac은 `python3`)
3. 브라우저에서 `http://localhost:8000` 을 엽니다.
4. 끝낼 때는 터미널에서 `Ctrl + C`를 누릅니다.

---

## 5. 실제 구글 로그인 켜기 (Firebase 설정)

Firebase 무료 요금제(Spark)로 할 수 있습니다. 화면 메뉴 이름은 바뀔 수 있습니다.

### 5-1. 프로젝트 만들기

1. `https://console.firebase.google.com` 에 관리자로 쓸 구글 계정으로 로그인합니다.
2. 프로젝트 만들기를 누르고 이름을 적습니다. (예: `capcha`)
   - 야자 관리 앱이 쓰는 기존 프로젝트(yajahrr)에 넣을 수도 있습니다. 다만 고객 개인정보가 섞이지 않도록 새 프로젝트를 권합니다.
3. 프로젝트 개요에서 웹 앱(`</>` 아이콘)을 추가합니다. Firebase Hosting은 체크하지 않아도 됩니다.
4. 화면에 나온 `firebaseConfig` 값을 `site/js/config.js`의 같은 이름 칸에 붙여 넣습니다.
   - 이 값은 비밀번호가 아닙니다. Firebase 문서는 이 API 키가 프로젝트를 알려 주는 값이고 데이터 보호는 보안 규칙이 맡는다고 설명합니다.

### 5-2. 구글 로그인 켜기

1. 왼쪽 메뉴 Authentication → 시작하기를 누릅니다.
2. Sign-in method 탭에서 Google을 고르고 사용 설정을 켭니다. 프로젝트 지원 이메일을 고르고 저장합니다.
3. Settings 탭 → 승인된 도메인(Authorized domains)에 사이트 주소의 도메인을 추가합니다.
   - GitHub Pages: `habin5725-prog.github.io`
   - 다른 곳에 올리면 그 도메인도 추가합니다. (예: `capcha.pages.dev` · `capcha.vercel.app`)
   - 추가하지 않으면 로그인 때 "승인된 도메인에 없습니다" 안내가 나옵니다.

### 5-3. 데이터베이스 만들기

1. 왼쪽 메뉴 Firestore Database → 데이터베이스 만들기를 누릅니다.
2. 위치를 고릅니다. 서울은 `asia-northeast3` 입니다. 위치는 나중에 바꿀 수 없습니다.
3. 프로덕션 모드로 시작합니다.

### 5-4. 보안 규칙 넣기 (가장 중요)

1. `capcha/firebase/firestore.rules` 파일을 엽니다.
2. `['[관리자 이메일]']` 의 `[관리자 이메일]`을 관리자로 쓸 구글 계정 이메일로 바꿉니다.
   - 예: `['내아이디@gmail.com']`
   - 관리자가 여러 명이면 `['a@gmail.com', 'b@gmail.com']`
   - 이 이메일은 Firebase 콘솔 안에만 들어가고 공개되는 사이트 코드에는 들어가지 않습니다.
3. Firestore Database → 규칙 탭에 파일 전체를 붙여 넣고 게시합니다.

### 5-5. 확인

1. `config.js`를 바꾼 사이트를 다시 올립니다. (8장)
2. 사이트를 열면 체험 모드 띠가 없어야 합니다.
3. 오른쪽 위 로그인을 눌러 관리자 계정으로 로그인하면 계정 메뉴에 "관리자 페이지"가 보입니다.
4. 다른 구글 계정으로 로그인하면 고객 화면만 보입니다.

로그인은 팝업 창 방식입니다. Firebase 문서는 Firebase Hosting이 아닌 곳에 올린 사이트에서는 리디렉션 방식 대신 팝업 방식을 권합니다. 팝업이 막히면 브라우저에서 이 사이트의 팝업을 허용하라는 안내가 나옵니다.

---

## 6. 관리자 페이지 쓰는 법

- 한눈에 보기: 새 신청 · 진행 중 신청 · 사전 질문지 · 답변 대기 문의 수
- 신청서 탭: 진행 상태와 관리자 메모를 바꾸고 저장합니다. 상태는 고객 마이페이지에 바로 보입니다. CSV로 내려받으면 엑셀에서 열 수 있습니다.
- 사전 질문지 탭: "사진 n장 보기"를 누르면 사진이 열리고 크게 보기 · 내려받기를 할 수 있습니다.
- 문의 탭: 답변을 적고 저장하면 고객 마이페이지에 보입니다.
- 가족 영상 페이지 탭:
  1. 유튜브에 영상을 '일부 공개'로 올립니다.
  2. 영상 제목과 유튜브 주소를 적고 페이지 만들기를 누릅니다.
  3. 만들어진 주소와 QR 코드가 보입니다. QR 이미지 내려받기로 PNG를 받아 책에 넣습니다.
  4. 영상을 내릴 때는 삭제를 누르고 유튜브 영상도 비공개로 바꿉니다.
- 일부 공개 영상은 링크를 아는 사람이면 누구나 볼 수 있습니다. 가족 영상 페이지에도 이 안내를 적어 두었습니다.

---

## 7. 사진 저장 방식과 무료 한도

- 고객이 고른 사진은 브라우저에서 긴 변 1600px 이하 JPEG로 줄인 뒤 Firestore에 한 장씩 저장합니다.
  - Firestore 문서 한 개는 1MiB를 넘을 수 없어서 사진마다 문서를 나눴습니다.
  - Cloud Storage for Firebase는 2026년 2월 3일부터 Blaze(종량제) 요금제가 필요해서 쓰지 않았습니다.
- Firestore 무료 한도: 저장 1GiB · 하루 읽기 50,000회 · 쓰기 20,000회 · 삭제 20,000회입니다. 사진 한 장이 약 100~700KB이므로 시범 운영에는 충분한 양입니다. (추측입니다. 사진 크기에 따라 다릅니다)
- 사진이 많아지면 관리자 페이지에서 내려받은 뒤 오래된 질문지를 삭제해 공간을 비울 수 있습니다.
- 체험 모드에서는 브라우저 저장 공간이 작아서 사진을 긴 변 640px로 더 작게 줄입니다.

---

## 8. 사이트 올리기 (지금은 GitHub Pages)

지금 사이트는 GitHub Pages에서 열립니다.

- 주소: `https://habin5725-prog.github.io/-/capcha/site/`
- 저장소의 기본 브랜치(`claude/exciting-dijkstra-evmx15`)에 있는 `capcha` 폴더가 그대로 공개됩니다.
- 고친 내용을 기본 브랜치에 올리면 1~2분 뒤 반영됩니다.
- 이 저장소는 공개 저장소라서 `capcha/README.md`와 `firebase/firestore.rules`도 누구나 볼 수 있습니다. 관리자 이메일은 규칙 파일에 넣지 말고 Firebase 콘솔에서만 바꿔 넣으세요.
- GitHub 약관은 GitHub Pages를 온라인 사업 운영용 무료 호스팅으로 쓰는 것을 허용하지 않습니다. 멘토 시연용 시범 사이트로만 쓰고 정식 운영 때는 다른 호스팅으로 옮기기를 권합니다.

다른 곳에 올릴 때는 `site` 폴더만 올리면 됩니다. Cloudflare Pages는 `_headers`, Vercel은 `vercel.json`을 읽어 가족 영상 · 마이페이지 · 관리자 페이지를 검색에서 뺍니다. 페이지 안에도 noindex 표시가 있어서 GitHub Pages에서도 검색 제외 요청이 됩니다. 올린 도메인은 5-2의 승인된 도메인에 추가해야 합니다.

---

## 9. 바꾸고 싶을 때

| 바꿀 것 | 위치 |
|---|---|
| Firebase 연결 | `site/js/config.js` |
| 관리자 계정 | Firebase 콘솔의 Firestore 규칙 (5-4) |
| 왜 캡챠인가 문장 3개 | `site/index.html`의 `id="why"` 부분. 지금은 받은 서비스 정보로 만든 예시 문장입니다. |
| 자주 묻는 질문 | `site/index.html`의 `id="faq"` 부분 |
| 개인정보 처리방침 | `site/privacy.html` (초안 · 정식 운영 전 확정 필요) |
| 신청서 항목 · 선택지 | `site/js/pages/apply.js`와 `site/js/backend.js`의 목록. 바꾸면 `firestore.rules`의 같은 목록도 함께 바꿔야 합니다. |
| 진행 상태 이름 | `site/js/backend.js`의 STATUSES와 `firestore.rules`의 상태 목록 |
| 그림 → 실제 사진 | `site/images` 폴더의 SVG 대신 사진 파일을 넣고 HTML의 `src`를 바꿉니다. 사진 위 어두운 덮개는 CSS가 자동으로 깝니다. |
| 슬라이드 넘김 간격 | `site/css/style.css`의 `--hero-interval` |

그림은 이 사이트를 위해 새로 그린 일러스트입니다. 실제 고객 사진을 쓸 때는 사진 속 사람의 동의를 받은 사진만 씁니다.

---

## 10. 시험한 내용

| 시험 | 결과 |
|---|---|
| 체험 모드 전체 흐름 (신청 → 사진 2장 질문지 → 문의 → 마이페이지 → 관리자 상태 변경 · 답변 · 가족 페이지 → 고객 화면 반영) | 통과 |
| Firebase 에뮬레이터(Auth · Firestore)에서 실제 코드와 보안 규칙으로 고객 · 다른 고객 · 관리자 · 비로그인 권한 시험 50개 | 50개 통과 |
| 관리자 삭제 4종 (신청서 · 질문지와 사진 · 문의 · 가족 페이지) | 통과 |
| axe-core 접근성 검사 (WCAG 2.1 A · AA) 9개 페이지 × 휴대폰 · PC | 위반 0건 |
| 가로 넘침 · 콘솔 오류 · 깨진 링크 | 0건 |

시험하지 못한 것도 있습니다.

- 실제 구글 로그인 팝업 창: 작업 환경에서 구글 로그인 창이 쓰는 주소(apis.google.com)가 막혀 있어서 열어 보지 못했습니다. 에뮬레이터 시험은 같은 Firebase 계정 정보로 바로 로그인하는 방식으로 했습니다. 5장 설정 뒤 실제 사이트에서 한 번 확인해 주세요.
- 실제 유튜브 영상 재생: 작업 환경에서 유튜브 접속이 막혀 있어서 영상 칸이 만들어지는 것까지만 확인했습니다.

---

## 11. 개인정보 · 법 관련 확인할 점

- 이제 사이트가 이름 · 연락처 · 부모님 이야기 · 사진을 직접 받습니다. 개인정보 보호법 제30조에 따라 개인정보 처리방침을 정하고 공개해야 합니다. `privacy.html`은 초안입니다.
- 각 폼의 동의 문구는 개인정보 보호법 제15조 제2항이 정한 네 가지(목적 · 항목 · 보유 기간 · 거부 권리)를 담았습니다. 보유 기간은 "시범 운영 기간 동안 보관 · 요청하면 지체 없이 삭제"로 적었고 정식 운영 전에 확정해야 합니다.
- 사전 질문지에는 부모님에 관한 정보가 들어갑니다. 부모님 정보에 대한 동의를 누구에게 어떤 방식으로 받아야 하는지는 확실하지 않습니다. 정식 운영 전에 전문가 확인을 권합니다.
- 방문자 추적 도구 · 광고 코드 · 결제 기능은 없습니다.

---

## 12. 글꼴 · 라이브러리 라이선스

| 이름 | 쓰는 곳 | 라이선스 |
|---|---|---|
| Paperlogy 400 · 500 · 700 | 한국어 글자 | SIL Open Font License 1.1 · `fonts/OFL-Paperlogy.txt` |
| Noto Serif KR 영문 부분 | 큰 영문 제목 | SIL Open Font License 1.1 · `fonts/OFL-NotoSerifKR.txt` |
| Firebase JavaScript SDK 13.1.0 일부 | 로그인 · 데이터 | Apache License 2.0 · `js/vendor/THIRD_PARTY_NOTICES.txt` |
| qrcode-generator 2.0.4 | 가족 페이지 QR 코드 | MIT · 파일 첫머리 고지 |

---

## 13. 확인한 자료 출처

작업 환경의 네트워크 정책 때문에 일부 공식 문서는 직접 열지 못하고 검색 결과의 인용으로 확인했습니다.

- [Authenticate Using Google with JavaScript · Firebase](https://firebase.google.com/docs/auth/web/google-signin) : 구글 로그인 켜기 · 팝업 로그인 · 승인된 도메인
- [Best practices for using signInWithRedirect · Firebase](https://firebase.google.com/docs/auth/web/redirect-best-practices) : 다른 도메인에서 팝업 방식 권장
- [Learn about and manage API keys for Firebase](https://firebase.google.com/docs/projects/api-keys) · [Firebase security checklist](https://firebase.google.com/support/guides/security-checklist) : 웹 설정 값은 비밀이 아니고 보안 규칙이 데이터를 지킴
- [Securely query data · Firestore](https://firebase.google.com/docs/firestore/security/rules-query) : 보안 규칙은 걸러 주는 기능이 아님 (내 기록만 묻는 질의를 쓴 이유)
- [Usage and limits · Firestore](https://firebase.google.com/docs/firestore/quotas) : 문서 한 개 최대 1MiB
- [Understand Cloud Firestore billing](https://firebase.google.com/docs/firestore/pricing) : 무료 한도 1GiB · 읽기 5만 · 쓰기 2만 · 삭제 2만 (하루)
- [Cloud Storage for Firebase 요금제 변경 FAQ](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024) : 2026년 2월 3일부터 Blaze 요금제 필요
- [Cloud Firestore locations](https://firebase.google.com/docs/firestore/locations) : 데이터베이스 위치
- [Change video privacy settings · YouTube](https://support.google.com/youtube/answer/157177) : 일부 공개의 뜻
- [Embed videos & playlists · YouTube](https://support.google.com/youtube/answer/171780) : 개인정보 보호 강화 모드(youtube-nocookie)
- [Block Search Indexing with noindex · Google Search Central](https://developers.google.com/search/docs/crawling-indexing/block-indexing) : noindex
- [GitHub Terms for Additional Products and Features](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features) : GitHub Pages 사업용 사용 제한
- [개인정보 보호법 · 국가법령정보센터](https://www.law.go.kr/법령/개인정보보호법) : 제15조(수집 · 이용 동의) · 제30조(처리방침)
- [WAI-ARIA 탭 방식 캐러셀 예시](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-2-tablist/) · [WCAG 2.1 대비 기준](https://www.w3.org/TR/WCAG21/#contrast-minimum)
